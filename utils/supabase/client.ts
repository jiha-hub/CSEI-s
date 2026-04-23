import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://dummy.supabase.co') {
    return {
      auth: {
        async getUser() {
          if (typeof document !== 'undefined') {
            const match = document.cookie.match(/(^| )mock_user_email=([^;]+)/)
            if (match) {
              return { data: { user: { id: 'mock-user-123', email: match[2] } }, error: null }
            }
          }
          return { data: { user: null }, error: null }
        },
        async signOut() {
          if (typeof document !== 'undefined') {
            document.cookie = 'mock_user_email=; Max-Age=-99999999; path=/;'
          }
        }
      },
      from: (table: string) => {
        return {
          select: () => {
            return {
              eq: () => {
                return {
                  order: async () => {
                    if (table === 'csei_results') {
                      if (typeof window !== 'undefined') {
                        const local = JSON.parse(localStorage.getItem('final_csei_results') || '[]')
                        const arr = Array.isArray(local) ? local : (local.scores ? [local] : [])
                        return { data: arr, error: null }
                      }
                    } else if (table === 'cure_history') {
                      if (typeof window !== 'undefined') {
                        const local = JSON.parse(localStorage.getItem('final_cure_history') || '[]')
                        return { data: local, error: null }
                      }
                    }
                    return { data: [], error: null }
                  }
                }
              }
            }
          }
        }
      }
    } as any
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
