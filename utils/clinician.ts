/**
 * 임상가 접근 제어 유틸리티
 *
 * 대시보드에 접근을 허용할 이메일을 아래 목록에 추가하세요.
 * 이메일은 대소문자를 구분하지 않습니다.
 */
export const ALLOWED_CLINICIAN_EMAILS: string[] = [
  'admin@example.com',
  // 추가 허용 이메일 주소를 여기에 입력하세요
]

/**
 * 로그인된 사용자의 이메일이 임상가 허용 목록에 있는지 확인합니다.
 */
export function isClinician(email: string | undefined | null): boolean {
  if (!email) return false
  const normalized = email.toLowerCase().trim()
  return ALLOWED_CLINICIAN_EMAILS.map(e => e.toLowerCase()).includes(normalized)
}
