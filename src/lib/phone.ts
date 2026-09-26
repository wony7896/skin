/** 전화번호에서 숫자만 남긴다. 저장·조회 모두 이 형태를 쓴다 (예: "010-1234-5678" → "01012345678"). */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** 가입·복구 입력용 최소 검증 — 국내외 번호를 넉넉히 허용 (9~15자리). */
export function isValidPhone(normalized: string): boolean {
  return /^\d{9,15}$/.test(normalized);
}
