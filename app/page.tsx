import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import HeroCanvas from './components/HeroCanvas'
import Footer from './components/Footer'
import NatureCanvas from './components/NatureCanvas'
import { ClipboardList, Sparkles, Brain, Heart, Shield } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const emotions = [
    { name: '희(喜)', label: '기쁨', desc: '즐겁고 유쾌한 감정의 상태를 측정합니다.' },
    { name: '노(怒)', label: '분노', desc: '화가 나거나 격분하는 감정의 정도를 분석합니다.' },
    { name: '사(思)', label: '고민', desc: '생각이 많고 걱정이 깊어지는 상태를 체크합니다.' },
    { name: '우(憂)', label: '근심', desc: '의욕이 저하되고 마음이 가라앉은 정도를 측정합니다.' },
    { name: '비(悲)', label: '슬픔', desc: '슬프고 서글픈 감정의 깊이를 확인합니다.' },
    { name: '공(恐)', label: '두려움', desc: '겁이 나고 불안하거나 무서운 감정을 분석합니다.' },
    { name: '경(驚)', label: '놀람', desc: '깜짝 놀라거나 당황스러운 감정의 반응을 체크합니다.' },
  ]

  return (
    <div className="min-h-screen bg-[#fffdfa] text-[#333]">
      <main className="pt-20 md:pt-32 pb-12 md:pb-20">
        {/* 히어로 섹션 */}
        <section className="px-6 md:px-10 lg:px-20 grid md:grid-cols-2 gap-8 md:gap-20 items-center mb-16 md:mb-32">
          <div className="max-w-xl animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="inline-flex items-center gap-2 bg-[#566e63]/10 text-[#566e63] px-4 py-2 rounded-full text-xs font-black mb-8">
              <Sparkles size={14} />
              <span>핵심칠정척도(CSEI-s) 기반 정서 진단</span>
            </div>
            <h1 className="text- responsive-h1 mb-6 md:mb-8 text-5xl md:text-7xl font-black leading-tight">
              내 마음의 <br />
              <span className="text-[#566e63] italic font-serif">일곱 가지 빛깔.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed break-keep">
              한의학의 <span className="font-bold text-[#566e63]">칠정(희, 노, 우, 사, 비, 공, 경)</span> 이론을 바탕으로, 
              현대인의 복합적인 감정 상태를 객관적으로 진단하고 나를 이해하는 시간을 가져보세요.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link href="/questionnaire" className="w-full sm:w-auto bg-[#566e63] text-white px-10 py-5 rounded-full text-lg font-black shadow-xl shadow-[#566e63]/30 hover:bg-[#4a5c53] hover:-translate-y-1 transition-all text-center flex items-center justify-center gap-3">
                <ClipboardList size={20} />
                3분 문진 시작하기
              </Link>
            </div>
          </div>
          
          <div className="relative aspect-square md:aspect-[4/5] rounded-[48px] overflow-hidden shadow-2xl group border-[6px] md:border-[12px] border-white/90 animate-in fade-in zoom-in duration-1000">
             <div className="absolute inset-0 bg-[#fdfbf7]"></div>
             <div className="absolute inset-0 bg-[url('/homepage_hero.png')] bg-cover bg-center mix-blend-multiply opacity-80 group-hover:scale-105 transition-transform duration-[2s]"></div>
             <HeroCanvas />
          </div>
        </section>

        {/* 칠정 설명 섹션 */}
        <section className="px-6 md:px-10 lg:px-20 mb-32 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6 text-[#222]">일곱 가지 마음의 지표</h2>
            <p className="text-gray-500 max-w-2xl mx-auto font-medium">
              CSEI-s(Core Seven Emotions Inventory)는 임상적으로 표준화된 도구로,<br className="hidden md:block" /> 
              당신의 현재 정서 균형을 다각도에서 분석합니다.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {emotions.map((emo, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[32px] border border-[#e8e0d5] hover:shadow-xl transition-all group">
                <div className="text-[#566e63] font-serif italic text-3xl mb-4 group-hover:scale-110 transition-transform inline-block">{emo.name}</div>
                <h3 className="text-xl font-black mb-3">{emo.label}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{emo.desc}</p>
              </div>
            ))}
            <div className="bg-[#566e63] p-8 rounded-[32px] text-white flex flex-col justify-center items-center text-center">
               <Brain size={40} className="mb-4 opacity-50" />
               <h3 className="text-xl font-black mb-2">종합 분석</h3>
               <p className="text-sm opacity-80 font-medium">모든 지표를 종합하여<br/>현재의 정서 에너지를 확인합니다.</p>
            </div>
          </div>
        </section>

        {/* 안내 섹션 */}
        <section className="mt-12 md:mt-24 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 md:gap-24 items-center">
           <div className="order-2 md:order-1 relative">
              <div className="relative aspect-square md:aspect-[4/5] rounded-[48px] overflow-hidden shadow-2xl border-[8px] md:border-[16px] border-white">
                 <div className="absolute inset-0 bg-gradient-to-br from-[#fdfbf7] via-[#fcfaf5] to-[#f5ebd9]"></div>
                 <div className="absolute inset-8 md:inset-12 border border-[#bfa588]/20 rounded-[32px] flex flex-col items-center justify-center p-6 md:p-12 text-center">
                    <span className="text-[#bfa588] text-[9px] font-black tracking-[0.3em] uppercase mb-6 md:mb-8 block opacity-40">Privacy & Science</span>
                    <Heart size={32} className="text-[#bfa588] mb-6 opacity-30" />
                    <p className="text-[#8c7457] font-serif italic text-xl md:text-2xl leading-[1.6] mb-8 break-keep">
                      "모든 답변은 익명으로 안전하게 처리되며,<br/>
                      표준화된 데이터에 근거하여<br/>
                      정확한 분석 결과를 제공합니다."
                    </p>
                    <div className="w-10 h-[1px] bg-[#bfa588]/30"></div>
                 </div>
              </div>
           </div>

           <div className="order-1 md:order-2">
              <span className="text-[#566e63] font-black text-[10px] tracking-[0.4em] uppercase mb-4 md:mb-6 block">Our Approach</span>
              <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
                나를 위한 <br/>
                <span className="text-[#566e63] relative">
                  객관적인 기록
                  <svg className="absolute -bottom-2 left-0 w-full opacity-30" height="8" viewBox="0 0 100 8" preserveAspectRatio="none">
                    <path d="M0 7C30 7 70 7 100 2" stroke="#566e63" strokeWidth="6" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
              </h2>
              <div className="space-y-6 mb-12">
                <div className="flex gap-4">
                  <div className="bg-[#566e63]/10 p-3 rounded-2xl h-fit"><Shield size={20} className="text-[#566e63]" /></div>
                  <div>
                    <h4 className="font-black text-lg mb-1">철저한 익명 보장</h4>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed">회원가입 없이도 검사가 가능하며, 데이터는 통계 분석용으로만 활용됩니다.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-[#566e63]/10 p-3 rounded-2xl h-fit"><Sparkles size={20} className="text-[#566e63]" /></div>
                  <div>
                    <h4 className="font-black text-lg mb-1">3분 내외의 짧은 시간</h4>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed">28개의 핵심 문항을 통해 부담 없이 자신의 마음을 점검할 수 있습니다.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/questionnaire" className="w-full sm:w-auto bg-[#566e63] text-white px-10 py-5 rounded-full text-lg font-black shadow-xl shadow-[#566e63]/20 hover:bg-[#4a5c53] active:scale-95 transition-all text-center">
                  ✨ 지금 바로 진단하기
                </Link>
              </div>
           </div>
        </section>

        <NatureCanvas />
      </main>

      <Footer />
    </div>
  )
}
