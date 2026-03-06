import GuideClient from "./GuideClient";
import { seedNewAccount } from "@/actions/seed";

export default async function GuidePage() {
  // Seed example task for brand new accounts (no-op if user already has tasks)
  await seedNewAccount();

  return <GuideClient />;
}
