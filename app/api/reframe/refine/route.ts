import { NextResponse } from 'next/server'
import { ChatOpenAI } from '@langchain/openai'
import { StringOutputParser } from '@langchain/core/output_parsers'

type RefineMode = 'empathy' | 'actionability' | 'specificity'

export async function POST(req: Request) {
  try {
    const { originalText, mode, situation, thought } = await req.json()

    if (!originalText || !mode) {
      return NextResponse.json({ error: '텍스트와 다듬기 방향을 입력해주세요.' }, { status: 400 })
    }

    const llm = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 512,
    })

    let systemContent = 'You are a helpful cognitive behavioral therapist. Always respond in Korean.'
    let userPrompt = ''

    // control.js 방식 적용 (영문 프롬프트로 GPT에게 더 명확한 지시)
    if (mode === 'empathy') {
      userPrompt = `Please rewrite the following response to be more empathetic and validating of the person's feelings. Respond in Korean only.
Response: "${originalText}"
More empathetic Korean response:`
    } else if (mode === 'actionability') {
      userPrompt = `Please rewrite the following response to include more specific, actionable steps the person can take. Respond in Korean only.
Response: "${originalText}"
More actionable Korean response:`
    } else if (mode === 'specificity') {
      userPrompt = `Please rewrite the following response to be more specific to this exact situation and thought. Respond in Korean only.
Situation: "${situation || ''}"
Thought: "${thought || ''}"
Response: "${originalText}"
More specific Korean response:`
    } else {
      return NextResponse.json({ error: '올바른 다듬기 방향을 선택해주세요.' }, { status: 400 })
    }

    const output = new StringOutputParser()
    const chain = llm.pipe(output)
    const refinedText = await chain.invoke([
      { role: 'system', content: systemContent },
      { role: 'user', content: userPrompt },
    ])

    return NextResponse.json({
      success: true,
      refinedText: refinedText.trim(),
    })
  } catch (error: any) {
    console.error('Refine API 오류:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
