export const TASK_TYPES = {
  checkbox: "Checkbox",
  multi_quality: "Multi-Quality",
} as const;

export type TaskType = keyof typeof TASK_TYPES;

export const QUALITY_TYPES = {
  checkbox: "Checkbox",
  rating: "Rating",
} as const;

export type QualityType = keyof typeof QUALITY_TYPES;

export const RATING_MIN = 1;
export const RATING_MAX = 10;
