"use client";

// PRD 섹션 1 설계 원칙: 중증·급성 반응이 의심되면 제품 추천 대신 피부과 상담을 권유한다.
export function DermatologistAdvisory() {
  return (
    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      강도가 높거나 두드러기 같은 반응은 자가 관리보다{" "}
      <strong>피부과 상담을 먼저 받아보시길 권장드려요.</strong> 이 서비스의
      추천은 의학적 진단을 대체하지 않아요.
    </div>
  );
}
