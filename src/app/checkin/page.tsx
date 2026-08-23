import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { skinProfiles } from "@/db/schema";
import { CheckinForm } from "@/components/checkin/CheckinForm";
import { createClient } from "@/lib/supabase/server";

export default async function CheckinPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [baseline] = await db
    .select()
    .from(skinProfiles)
    .where(eq(skinProfiles.userId, user.id))
    .orderBy(desc(skinProfiles.createdAt))
    .limit(1);

  if (!baseline) {
    redirect("/onboarding");
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="border-b border-neutral-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">
        이 체크인은 자가 평가 참고용이며, 의학적 진단이 아닙니다.
      </div>
      <CheckinForm
        baseline={{
          oilyDryScore: baseline.oilyDryScore,
          recentRecommendationSatisfaction:
            baseline.recentRecommendationSatisfaction,
          sleepHours: baseline.sleepHours,
          stressLevel: baseline.stressLevel,
          goals: (baseline.goals ?? []) as string[],
          goalPriority: (baseline.goalPriority ?? []) as string[],
        }}
      />
    </main>
  );
}
