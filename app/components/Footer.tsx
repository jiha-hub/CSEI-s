'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 px-6 md:px-10 py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col justify-center items-center gap-6">
        <Link href="/">
          {/* 로고 크기를 키우고, 검정 배경을 제거(반전 후 흰 배경 투명화) */}
          <img src="/emindlogo.jpg" alt="Emind" className="h-14 md:h-16 w-auto invert mix-blend-multiply opacity-80 hover:opacity-100 transition-opacity" />
        </Link>
        <div className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-[0.2em] leading-relaxed text-center">
          © 2024 EMIND.<br/>
          All Rights Reserved.
        </div>
      </div>
    </footer>
  )
}
