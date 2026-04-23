import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { csei_results, cure_history } = await req.json()

    // 1. CSEI(7가지 감정) 설문 기록 일괄 Insert
    if (csei_results && Array.isArray(csei_results) && csei_results.length > 0) {
      const cseiInserts = csei_results.map((r: any) => ({
        user_id: user.id,
        scores: r.scores,
        created_at: r.timestamp || new Date().toISOString()
      }))
      const { error } = await supabase.from('csei_results').insert(cseiInserts)
      if (error) {
        console.error('csei_results sync error:', error)
        throw new Error(`Sync failed for CSEI: ${error.message}`)
      }
    }

    // 2. Cure(인지재구성) 기록 일괄 Insert
    if (cure_history && Array.isArray(cure_history) && cure_history.length > 0) {
      const cureInserts = cure_history.map((c: any) => {
        return {
          user_id: user.id,
          type: c.type,
          situation: c.situation,
          thought: c.thought,
          summary: c.summary,
          thinking_trap: c.thinkingTrap,
          sentiment: c.sentiment,
          tags: c.tags,
          created_at: c.id ? new Date(c.id).toISOString() : new Date().toISOString()
        }
      })
      const { error } = await supabase.from('cure_history').insert(cureInserts)
      if (error) {
        console.error('cure_history sync error:', error)
        throw new Error(`Sync failed for Cure History: ${error.message}`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('sync exception:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
