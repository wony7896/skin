// PRD 섹션 1 설계 원칙: "중증 여드름, 급성 접촉성피부염 의심" 등에 해당하는 응답이 나오면
// 제품 추천 대신 피부과 상담을 권유하는 분기를 둔다. 실제로 수집되는 필드 기준의 트리거.
const SEVERITY_THRESHOLD = 4; // 1~5 척도에서 4 이상

export function needsDermatologistAdvisory(input: {
  severity: number | null;
  reactionTypes: string[];
}): boolean {
  if (input.severity !== null && input.severity >= SEVERITY_THRESHOLD) {
    return true;
  }
  return input.reactionTypes.includes("hives");
}
