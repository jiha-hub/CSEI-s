import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://dummy.supabase.co') {
    return {
      auth: {
        async getUser() {
          const u = cookieStore.get('mock_user_email')
          if (u) return { data: { user: { id: 'mock-user-123', email: u.value } }, error: null }
          return { data: { user: null }, error: null }
        }
      },
      from: (table: string) => ({
        select: () => ({
          order: async () => {
             // Mock data for homepage to prevent crashes
             if (table === 'app_content') {
                return { data: [], error: null }
             }
             return { data: [], error: null }
          }
        })
      })
    } as any
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
