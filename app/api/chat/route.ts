import { NextResponse } from 'next/server'
import { PineconeStore } from '@langchain/pinecone'
import { PineconeEmbeddings } from '@langchain/pinecone'
import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { getPineconeClient, PINECONE_INDEX_NAME } from '@/utils/pinecone_client'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const { message } = await req.json()
    if (!message) return NextResponse.json({ error: '메시지가 없습니다.' }, { status: 400 })

    // 0. Supabase 인증 및 개인화 데이터(Context) 로드
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    let userContextStr = ""
    if (user) {
      // 가장 최근 7가지 감정 진단 데이터 하나 가져오기
      const { data: cseiData } = await supabase.from('csei_results')
        .select('scores')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        
      if (cseiData && cseiData.length > 0) {
        const topEmotions = cseiData[0].scores
          .sort((a: any, b: any) => b.A - a.A)
          .slice(0, 2)
          .map((s: any) => `${s.subject} ${s.A}dB`)
          .join(', ')
        userContextStr += `\n[사용자 개인 상황 요약]\n- 최근 감정 상태(높은 지표): ${topEmotions}`
      }

      // 가장 최근 치료 기록 하나 가져오기
      const { data: cureData } = await supabase.from('cure_history')
        .select('thought, thinking_trap')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (cureData && cureData.length > 0) {
        userContextStr += `\n- 최근 인지 재구성/생각 함정: ${cureData[0].thought} (${cureData[0].thinking_trap})`
      }
      if(userContextStr) {
        userContextStr = `이 사용자에 대해 다음과 같은 최근 분석 데이터가 있습니다. 해당 감정 및 과거 상황을 고려하여 맥락에 맞는 깊이 있는 공감을 먼저 표현하세요:${userContextStr}`
      }
    }

    // 1. Pinecone 인덱스 연결
    const pc = getPineconeClient()
    const pineconeIndex = pc.Index(PINECONE_INDEX_NAME)

    // 2. LangChain PineconeEmbeddings
    const embeddings = new PineconeEmbeddings({
      model: 'llama-text-embed-v2',
      apiKey: process.env.PINECONE_API_KEY!,
    })

    // 3. 기존 인덱스에서 유사도 검색
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace: 'main',
    })

    const topKResults = await vectorStore.similaritySearch(message, 3)
    const context = topKResults
      .map((doc, i) => `사례 ${i + 1}:\n${doc.pageContent}\n재구성: ${doc.metadata.reframe || doc.metadata.text || '정보 없음'}`)
      .join('\n\n')

    // 4. OpenAI LLM으로 답변 생성
    const llm = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4o',
      temperature: 0.7,
    })

    const promptTemplate = PromptTemplate.fromTemplate(`
      당신은 공감적이고 전문적인 심리 상담 인테이크(Intake) 담당자입니다. 
      사용자의 현재 기분, 최근에 있었던 구체적인 사건, 그리고 그로 인한 신체적/심리적 불편함을 부드럽게 경청하여 수집하는 것이 당신의 목표입니다.
      
      [핵심 가이드라인]
      1. 치료적 개입(생각 재구성 등)은 사이트 내 '인지재구성(Cure)'이나 '7가지 감정 명상' 메뉴에서 진행할 수 있도록 안내만 하세요.
      2. 지금 이 공간은 오직 사용자가 자신의 마음을 충분히 털어놓는 상담 입력 공간임을 명심하세요.
      3. 따뜻한 공감을 먼저 표현하고, 사용자가 말을 이어갈 수 있도록 열린 질문을 던지세요.
      
      {userContextStr}

      [사용자의 현재 생각/상황]
      {input}

      인테이크 담당자의 답변 (기록을 위해 상냥하고 구체적으로):
    `)

    const chain = promptTemplate.pipe(llm).pipe(new StringOutputParser())
    const response = await chain.invoke({ context, input: message, userContextStr })

    // 4.5 메시지 요약 생성 (데이터베이스 저장용)
    const summaryPrompt = PromptTemplate.fromTemplate(`
      아래 상담 메시지를 의료진이 빠르게 파악할 수 있도록 1문장으로 핵심만 요약해주세요.
      메시지: {message}
      요약:
    `)
    const summaryChain = summaryPrompt.pipe(llm).pipe(new StringOutputParser())
    const summary = await summaryChain.invoke({ message })

    // 5. 상담 내용을 Supabase에 자동 기록 (전체 내용 + 요약본)
    if (user) {
      try {
        await supabase.from('counseling_logs').insert([{
          user_id: user.id,
          user_message: message, // 전체 내용
          summary_content: summary, // 요약 내용 (추가됨)
          bot_response: response,
          context_summary: userContextStr || '초기 상담',
          created_at: new Date().toISOString()
        }])
      } catch (err) {
        console.error('Logging to Supabase failed:', err)
      }
    }

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error('Chat Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
