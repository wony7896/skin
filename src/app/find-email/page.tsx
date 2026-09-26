import { redirect } from "next/navigation";
import { FindEmailForm } from "@/components/auth/FindEmailForm";
import { getSessionUser } from "@/lib/auth";

export default async function FindEmailPage() {
  const { user } = await getSessionUser();
  if (user) {
    redirect("/recommendations");
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4">
      <FindEmailForm />
    </main>
  );
}
