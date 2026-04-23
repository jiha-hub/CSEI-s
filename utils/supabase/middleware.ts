import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 중요: getUser()를 호출해야만 세션이 갱신됩니다.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 1. 보호된 경로 및 역할 권한 로직
  const url = request.nextUrl.clone()
  const isMedicalPath = url.pathname.startsWith('/dashboard') && !url.pathname.startsWith('/report-demo')
  const isAuthPath = url.pathname.startsWith('/login')

  // 로그인하지 않은 사용자가 보호된 경로(의료인 페이지 등)에 접근할 경우 로그인 페이지로 리다이렉트
  if (!user && isMedicalPath) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 의료인 전용 페이지 보호 로직 (현재 모든 사용자가 볼 수 있도록 임시 해제됨)
  /*
  if (user && isMedicalPath) {
    const role = user.user_metadata?.role
    if (role !== 'doctor') {
      // 의사가 아니면 메인이나 마이페이지로 보호
      url.pathname = '/my-situation'
      return NextResponse.redirect(url)
    }
  }
  */

  // 로그인한 사용자가 로그인 페이지에 접근할 경우 대시보드나 마이페이지로 리다이렉트
  if (user && isAuthPath) {
    const role = user.user_metadata?.role
    url.pathname = role === 'doctor' ? '/dashboard' : '/my-situation'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
