import type { AuthError } from "@supabase/supabase-js";

/**
 * Supabase 인증 에러를 사용자에게 보여줄 한글 문구로 옮긴다.
 * supabase-js는 안정적인 `code`를 주므로 그걸 우선 쓰고,
 * 없으면 메시지 일부를 매칭한다. 알 수 없는 건 일반 문구로 뭉갠다.
 */
export function authErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "이메일 또는 비밀번호가 올바르지 않아요.";
    case "email_not_confirmed":
      return "이메일 인증이 필요해요. 메일함의 확인 링크를 눌러주세요.";
    case "user_already_exists":
    case "email_exists":
      return "이미 가입된 이메일이에요. 로그인해주세요.";
    case "weak_password":
      return "비밀번호는 6자 이상이어야 해요.";
    case "validation_failed":
    case "email_address_invalid":
      return "사용할 수 없는 이메일 주소예요. 다른 주소를 입력해주세요.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "현재 이메일 회원가입이 비활성화돼 있어요.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "요청이 너무 잦아요. 잠시 후 다시 시도해주세요.";
    case "same_password":
      return "기존과 다른 비밀번호를 입력해주세요.";
  }

  const msg = error.message.toLowerCase();
  if (msg.includes("invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않아요.";
  }
  if (msg.includes("email not confirmed")) {
    return "이메일 인증이 필요해요. 메일함의 확인 링크를 눌러주세요.";
  }
  if (msg.includes("already registered") || msg.includes("already been registered")) {
    return "이미 가입된 이메일이에요. 로그인해주세요.";
  }
  if (
    msg.includes("is invalid") ||
    msg.includes("invalid format") ||
    msg.includes("invalid email")
  ) {
    return "사용할 수 없는 이메일 주소예요. 다른 주소를 입력해주세요.";
  }
  if (msg.includes("password")) {
    return "비밀번호는 6자 이상이어야 해요.";
  }
  if (msg.includes("rate limit") || msg.includes("for security purposes")) {
    return "요청이 너무 잦아요. 잠시 후 다시 시도해주세요.";
  }

  return "처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.";
}
