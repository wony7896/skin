-- 회원탈퇴(개인정보보호법상 파기·동의철회 수단).
-- 본인 계정(auth.users)을 삭제하면 user_id를 FK로 참조하는 모든 public 테이블
-- 행이 ON DELETE CASCADE로 함께 삭제된다: skin_profiles, excluded_ingredients,
-- trouble_reports, user_medications, recommendations, usage_feedback,
-- user_consents. 스토리지(skin-photos 버킷)의 사용자 파일은 FK가 없으므로
-- 서버 액션(deleteAccount)에서 먼저 삭제한다.
--
-- anon 키 + 사용자 JWT만 있는 실행 환경(PostgREST 경유 supabase.rpc)에서도
-- 호출 가능하도록 security definer로 두고, 실행 권한은 authenticated에만 준다.
-- auth.uid()로 호출자 본인만 삭제하므로 다른 사용자 계정은 건드릴 수 없다.
create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_current_user() from public, anon;
grant execute on function public.delete_current_user() to authenticated;
