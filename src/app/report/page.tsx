import { db } from "@/db";
import { products } from "@/db/schema";
import { ReportForm } from "@/components/report/ReportForm";
import { AppHeader } from "@/components/AppHeader";
import { hasConsent } from "@/lib/consent";
import { requireUser } from "@/lib/auth";

export default async function ReportPage() {
  const { user } = await requireUser();

  const productList = await db
    .select({ id: products.id, name: products.name })
    .from(products)
    .orderBy(products.name);

  const hasPhotoConsent = await hasConsent(user.id, "biometric_photo");

  return (
    <main className="min-h-screen bg-neutral-50">
      <AppHeader />
      <div className="border-b border-neutral-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">
        이 리포트는 자가 평가 참고용이며, 의학적 진단이 아닙니다.
      </div>
      <ReportForm products={productList} hasPhotoConsent={hasPhotoConsent} />
    </main>
  );
}
