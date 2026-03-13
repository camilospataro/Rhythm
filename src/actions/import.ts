"use server";

import { createClient, getUserId } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const SYSTEM_PROMPT = `You are an assistant that converts user-provided files (routines, schedules, habit lists, etc.) into structured data for a habit-tracking app called Rhythm.

The app has these concepts:
1. **Tasks** — individual habits to track. Two types:
   - "checkbox" — simple yes/no (e.g., "Take vitamins")
   - "multi_quality" — rated on a numeric scale with optional sub-qualities (e.g., "Workout" rated 1-5)

2. **Task Qualities** — sub-items under a multi_quality task. Each quality has:
   - name: string
   - type: "checkbox" or "rating"
   - rating_max: number (only for "rating" type, typically 5 or 10)
   - tags: string[] (optional tags the user can select from, e.g., ["cardio", "strength", "flexibility"])

3. **Templates** — weekly routines. A template assigns tasks to specific days of the week (0=Monday, 1=Tuesday, ..., 6=Sunday).

Your job: analyze the file content and any user instructions, then output valid JSON with this exact structure:

{
  "tasks": [
    {
      "name": "Task Name",
      "type": "checkbox" | "multi_quality",
      "color": "#hex",
      "rating_max": 5,
      "qualities": [
        {
          "name": "Quality Name",
          "type": "checkbox" | "rating",
          "rating_max": 5,
          "tags": ["tag1", "tag2"]
        }
      ]
    }
  ],
  "template": {
    "name": "Template Name",
    "days": {
      "0": ["Task Name", "Task Name"],
      "1": ["Task Name"],
      ...
    }
  }
}

Rules:
- Use nice colors that match the task theme (e.g., blue for water, green for exercise, pink for self-care)
- "qualities" array should be empty [] for checkbox tasks
- "rating_max" at task level should be 0 for checkbox tasks
- Template days use 0=Monday through 6=Sunday
- Only include days that have tasks assigned
- Task names in template.days must exactly match task names in the tasks array
- If the file doesn't clearly indicate which days tasks go on, assign them to all 7 days
- Output ONLY the JSON, no markdown fences or explanation`;

interface ImportResult {
  success: boolean;
  tasksCreated: number;
  templateCreated: string | null;
  errors: string[];
  error?: string;
}

export async function importWithAI(
  fileContent: string,
  fileName: string,
  instructions: string
): Promise<ImportResult> {
  const fail = (msg: string): ImportResult => ({
    success: false,
    tasksCreated: 0,
    templateCreated: null,
    errors: [],
    error: msg,
  });

  try {
    const userId = await getUserId();
    if (!userId) return fail("Not authenticated");

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return fail("AI import is not configured. Set ANTHROPIC_API_KEY in environment variables.");

    const userMessage = `File name: ${fileName}\n\nFile content:\n${fileContent}${instructions ? `\n\nAdditional instructions from the user:\n${instructions}` : ""}`;

    // Call Anthropic API directly via fetch (no SDK needed)
    const apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!apiResponse.ok) {
      const errBody = await apiResponse.text();
      return fail(`AI API error (${apiResponse.status}): ${errBody.slice(0, 200)}`);
    }

    const apiData = await apiResponse.json();
    const text = (apiData.content || [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");

    if (!text) return fail("AI returned empty response. Please try again.");

    // Parse JSON — handle possible markdown fences
    const jsonStr = text.replace(/^```json?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();

    let parsed: {
      tasks: Array<{
        name: string;
        type: "checkbox" | "multi_quality";
        color?: string;
        rating_max?: number;
        qualities?: Array<{
          name: string;
          type: "checkbox" | "rating";
          rating_max?: number;
          tags?: string[];
        }>;
      }>;
      template?: {
        name: string;
        days: Record<string, string[]>;
      };
    };

    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return fail("AI returned invalid data. Please try again.");
    }

    const supabase = await createClient();
    const errors: string[] = [];
    const taskIdMap = new Map<string, string>();
    let tasksCreated = 0;

    // Create tasks
    for (const task of parsed.tasks) {
      try {
        const { data: created, error } = await supabase
          .from("tasks")
          .insert({
            user_id: userId,
            name: task.name,
            type: task.type,
            color: task.color || null,
            rating_min: 0,
            rating_max: task.type === "multi_quality" ? (task.rating_max || 5) : 0,
            sort_order: tasksCreated,
            archived: false,
          })
          .select()
          .single();

        if (error) {
          errors.push(`Failed to create task "${task.name}": ${error.message}`);
          continue;
        }

        taskIdMap.set(task.name, created.id);
        tasksCreated++;

        // Create qualities
        if (task.qualities && task.qualities.length > 0) {
          for (let i = 0; i < task.qualities.length; i++) {
            const q = task.qualities[i];
            const { error: qError } = await supabase
              .from("task_qualities")
              .insert({
                task_id: created.id,
                user_id: userId,
                name: q.name,
                type: q.type || "checkbox",
                rating_max: q.rating_max || 5,
                tags: q.tags || [],
                sort_order: i,
              });
            if (qError) {
              errors.push(`Failed to create quality "${q.name}" for "${task.name}": ${qError.message}`);
            }
          }
        }
      } catch (err) {
        errors.push(`Error creating "${task.name}": ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    // Create template
    let templateCreated: string | null = null;
    if (parsed.template && tasksCreated > 0) {
      try {
        const { data: template, error } = await supabase
          .from("week_templates")
          .insert({
            user_id: userId,
            name: parsed.template.name || "Imported Template",
            is_default: false,
          })
          .select()
          .single();

        if (error) {
          errors.push(`Failed to create template: ${error.message}`);
        } else {
          templateCreated = template.name;

          // Assign tasks to days
          const dayInserts: Array<{
            template_id: string;
            task_id: string;
            user_id: string;
            day_of_week: number;
            sort_order: number;
          }> = [];

          for (const [dayStr, taskNames] of Object.entries(parsed.template.days)) {
            const dayNum = parseInt(dayStr, 10);
            if (isNaN(dayNum) || dayNum < 0 || dayNum > 6) continue;

            for (let i = 0; i < taskNames.length; i++) {
              const taskId = taskIdMap.get(taskNames[i]);
              if (taskId) {
                dayInserts.push({
                  template_id: template.id,
                  task_id: taskId,
                  user_id: userId,
                  day_of_week: dayNum,
                  sort_order: i,
                });
              }
            }
          }

          if (dayInserts.length > 0) {
            const { error: dayError } = await supabase
              .from("template_day_tasks")
              .insert(dayInserts);
            if (dayError) {
              errors.push(`Failed to assign tasks to template days: ${dayError.message}`);
            }
          }
        }
      } catch (err) {
        errors.push(`Error creating template: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    revalidatePath("/tasks");
    revalidatePath("/day");
    revalidatePath("/week");

    return { success: true, tasksCreated, templateCreated, errors };
  } catch (err) {
    return {
      success: false,
      tasksCreated: 0,
      templateCreated: null,
      errors: [],
      error: err instanceof Error ? err.message : "Import failed unexpectedly",
    };
  }
}
