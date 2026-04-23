import { NextResponse } from 'next/server'
import { PineconeStore } from '@langchain/pinecone'
import { PineconeEmbeddings } from '@langchain/pinecone'
import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { getPineconeClient, PINECONE_INDEX_NAME } from '@/utils/pinecone_client'

export async function POST(req: Request) {
  try {
    const { situation, thought } = await req.json()

    if (!situation || !thought) {
      return NextResponse.json({ error: '상황과 생각을 모두 입력해주세요.' }, { status: 400 })
    }

    const userInput = `상황: ${situation}\n생각: ${thought}`

    // 1. Pinecone 벡터 유사도 검색 (유사 사례 5개)
    const pc = getPineconeClient()
    const pineconeIndex = pc.Index(PINECONE_INDEX_NAME)

    const embeddings = new PineconeEmbeddings({
      model: 'llama-text-embed-v2',
      apiKey: process.env.PINECONE_API_KEY!,
    })

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace: 'main',
    })

    const results = await vectorStore.similaritySearch(userInput, 5)

    // 2. 유사 사례 정리 (프론트엔드 표시용 + GPT 컨텍스트용)
    const similarCases = results.map((doc, i) => ({
      id: i + 1,
      situationThought: doc.pageContent,
      reframe: doc.metadata.reframe || '',
      traps: doc.metadata.traps || '',
    }))

    const contextText = similarCases
      .map(item => `사례 ${item.id}:\n${item.situationThought}\n재구성: ${item.reframe}\n생각의 함정: ${item.traps}`)
      .join('\n\n')

    // 3. GPT로 3가지 reframe 생성
    const llm = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4o-mini',
      temperature: 0.8,
    })

    const promptTemplate = PromptTemplate.fromTemplate(`
당신은 인지행동치료(CBT) 전문 상담사입니다.
사용자의 상황과 생각을 분석하고, 아래 참고 사례를 활용하여 3가지 서로 다른 관점으로 인지를 재구성해주세요.
각 재구성은 충분히 구체적이고 공감적이며 실용적이어야 합니다.

[참고 사례]
{context}

[사용자 입력]
상황: {situation}
생각: {thought}

아래 JSON 형식으로만 응답하세요. 다른 텍스트나 마크다운 없이 JSON만 출력하세요:
{{
  "reframes": [
    {{
      "icon": "perspective",
      "title": "성장의 관점",
      "text": "첫 번째 재구성 문장 (성장과 발전에 초점, 2~3문장)"
    }},
    {{
      "icon": "balance", 
      "title": "균형의 관점",
      "text": "두 번째 재구성 문장 (균형 잡힌 시각, 2~3문장)"
    }},
    {{
      "icon": "action",
      "title": "행동의 관점",
      "text": "세 번째 재구성 문장 (실천과 행동에 초점, 2~3문장)"
    }}
  ]
}}
`)

    const chain = promptTemplate.pipe(llm).pipe(new StringOutputParser())
    const rawResponse = await chain.invoke({
      context: contextText,
      situation,
      thought,
    })

    // JSON 파싱
    let parsed: { reframes: { icon: string; title: string; text: string }[] }
    try {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawResponse)
    } catch {
      parsed = {
        reframes: [
          { icon: 'perspective', title: '성장의 관점', text: rawResponse.slice(0, 200) },
          { icon: 'balance', title: '균형의 관점', text: '이 상황을 다양한 시각으로 바라볼 수 있습니다.' },
          { icon: 'action', title: '행동의 관점', text: '구체적인 행동으로 변화를 만들어 나갈 수 있습니다.' },
        ],
      }
    }

    return NextResponse.json({
      success: true,
      reframes: parsed.reframes,
      similarCases: similarCases.map(c => ({
        id: c.id,
        situationThought: c.situationThought,
        reframe: c.reframe,
        traps: c.traps,
      })),
    })
  } catch (error: any) {
    console.error('Reframe API 오류:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
