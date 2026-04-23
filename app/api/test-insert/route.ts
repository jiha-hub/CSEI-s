import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No user. Please login in browser to test.' })
  }

  const { data, error } = await supabase.from('csei_results').insert([{
    user_id: user.id,
    scores: [{ subject: 'test', A: 50, fullMark: 100 }]
  }]).select()

  return NextResponse.json({ user: user.id, error, data })
}
