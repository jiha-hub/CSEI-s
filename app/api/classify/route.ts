import { NextResponse } from 'next/server'
import { ChatOpenAI } from '@langchain/openai'

// 사고함정 한국어 번역 맵
const TRAP_KO: Record<string, string> = {
  'all-or-nothing thinking': '흑백논리 (모 아니면 도)',
  'black and white thinking': '흑백논리 (모 아니면 도)',
  'overgeneralizing': '과도한 일반화',
  'labeling': '낙인찍기 (라벨링)',
  'fortune telling': '근거 없는 추측 (점치기)',
  'mind reading': '마음 읽기 (독심술)',
  'emotional reasoning': '감정적 추론',
  'should statements': "'~해야 한다'는 강박",
  'personalizing': '내 탓 하기 (개인화)',
  'disqualifying the positive': '긍정적인 면 깎아내리기',
  'catastrophizing': '파국화 (최악 상상하기)',
  'comparing and despairing': '비교와 절망',
  'blaming': '남 탓 하기 (책임 전가)',
  'negative feeling or emotion': '부정적 감정에 매몰되기',
  'magnification': '과장하기',
  'minimization': '축소하기',
  'jumping to conclusions': '섣부른 결론',
  'none': '해당 없음',
}

// 사고함정 설명 맵
const TRAP_DESC: Record<string, string> = {
  '흑백논리 (모 아니면 도)': '중간 없이 양극단으로 생각해요. 완벽하지 않으면 전부 실패한 것이라고 믿는 거예요.',
  '과도한 일반화': '딱 한 번의 경험을 가지고 성급하게 전체 결론을 내려버려요.',
  '낙인찍기 (라벨링)': '단 하나의 행동이나 특징으로 자신이나 타인을 정의해버려요.',
  '근거 없는 추측 (점치기)': '미래를 부정적으로 단정 지어요. 다른 가능성은 무시하고 안 좋은 결과만 확신해요.',
  '마음 읽기 (독심술)': '상대방이 무슨 생각을 하는지 다 안다고 지레짐작해요.',
  '감정적 추론': '내가 느끼는 기분을 곧 사실이라고 믿어버려요.',
  "'~해야 한다'는 강박": '자신에게 비현실적인 기준을 세우고 압박해요. (당위적 사고)',
  '내 탓 하기 (개인화)': '나와 상관없는 일도 내 책임으로 돌리거나 나랑 연결 지어 생각해요.',
  '긍정적인 면 깎아내리기': '좋은 일이 생겨도 운이 좋았을 뿐이라며 그 가치를 무시해요.',
  '파국화 (최악 상상하기)': '어떤 상황에서 일어날 수 있는 최악의 결과만 떠올리고 부풀려요.',
  '비교와 절망': '나의 가장 안 좋은 점과 남의 가장 좋은 점만 비교하며 괴로워해요.',
  '남 탓 하기 (책임 전가)': '내 감정이나 행동의 원인을 모두 남에게 돌려요.',
  '부정적 감정에 매몰되기': '괴로운 생각이나 감정에서 빠져나오지 못하고 계속 갇혀 있어요.',
  '과장하기': '작은 실수나 문제를 실제보다 훨씬 크게 부풀려서 생각해요.',
  '축소하기': '좋은 점이나 성과를 실제보다 훨씬 작게 깎아내려 생각해요.',
  '섣부른 결론': '충분한 근거 없이 부정적인 결론을 성급하게 내려요.',
  '해당 없음': '뚜렷한 인지적 오류 패턴이 감지되지 않았어요.',
}

function translateTrap(trap: string): string {
  const lower = trap.toLowerCase().trim()
  if (TRAP_KO[lower]) return TRAP_KO[lower]
  for (const [en, ko] of Object.entries(TRAP_KO)) {
    if (lower.includes(en)) return ko
  }
  return trap.replace(/\s*\(\d+%\)\s*$/, '').trim()
}

function getDescription(koTrap: string): string {
  return TRAP_DESC[koTrap] || ''
}

export async function POST(req: Request) {
  try {
    const { thought, situation } = await req.json()

    if (!thought) {
      return NextResponse.json({ message: 'Thought is required' }, { status: 400 })
    }

    const modelName = process.env.OPENAI_FINETUNE_MODEL || 'gpt-4o-mini'

    const llm = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      modelName,
      temperature: 0,
      maxTokens: 100,
    })

    // 파인튜닝 모델이면 시스템 프롬프트만, 아니면 Few-shot 포함
    const isFineTuned = modelName.startsWith('ft:')

    const systemMsg = 'You are an expert cognitive behavioral therapist. Classify ALL cognitive distortions present in the user\'s thought. List them separated by commas. Respond with only the distortion names, nothing else.'

    const userMsg = `Situation: ${situation || ''}\nThought: ${thought}`

    let messages: { role: string; content: string }[]

    if (isFineTuned) {
      messages = [
        { role: 'system', content: systemMsg },
        { role: 'user', content: userMsg },
      ]
    } else {
      // Few-shot fallback (파인튜닝 모델이 아직 없을 때)
      const fewShotPrompt = `Here are examples of cognitive distortion classification:

Thought: "Everyone will hate me"
Cognitive Distortions: mind reading, fortune telling

Thought: "I am completely worthless"
Cognitive Distortions: labeling, all-or-nothing thinking

Thought: "If it's not perfect, it's a failure"
Cognitive Distortions: all-or-nothing thinking

Thought: "The worst will definitely happen"
Cognitive Distortions: catastrophizing, fortune telling

---

Situation: ${situation || ''}
Thought: ${thought}
Cognitive Distortions:`

      messages = [
        { role: 'system', content: systemMsg },
        { role: 'user', content: fewShotPrompt },
      ]
    }

    const response = await llm.invoke(messages)
    const raw = typeof response.content === 'string' ? response.content.trim() : ''

    // 다중 레이블 파싱: 쉼표로 분리 → 개별 번역 → 중복 제거
    const trapsEn = raw.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0)
    const trapsKo = [...new Set(trapsEn.map(t => translateTrap(t)))]

    // 각 사고함정에 대한 설명도 함께 반환
    const trapsWithDesc = trapsKo.map(ko => ({
      name: ko,
      description: getDescription(ko),
    }))

    return NextResponse.json({
      thinking_trap: trapsKo.join(', '),
      thinking_traps: trapsWithDesc,
    })
  } catch (error: any) {
    console.error('Classify API 오류:', error)
    return NextResponse.json(
      { message: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
