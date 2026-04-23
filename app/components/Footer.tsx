'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 px-6 md:px-10 py-12 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        <div className="flex flex-col gap-4">
          <Link href="/" className="font-extrabold text-2xl text-[#566e63] tracking-tighter">MoodB</Link>
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] leading-relaxed">
            © 2024 MoodB. 마음의 안식처.<br/>
            All Rights Reserved.
          </div>
        </div>

        <nav className="grid grid-cols-2 sm:flex gap-10 md:gap-14 text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest">
          <div className="flex flex-col gap-4">
            <Link href="/select" className="hover:text-black transition-colors" title="감정 데시벨 측정, 명상, CBT">MoodB 프로그램</Link>
          </div>
          <div className="flex flex-col gap-4">
            <Link href="/chat" className="hover:text-black transition-colors">심리 챗봇</Link>
            <Link href="/dashboard" className="hover:text-black transition-colors">관리자 뷰어</Link>
          </div>
        </nav>

        {/* Social Icons Placeholder */}
        <div className="flex items-center gap-4">
           <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#566e63] hover:text-white transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
           </button>
           <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#566e63] hover:text-white transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
           </button>
        </div>
      </div>
    </footer>
  )
}
