'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!isMounted) return <div className="h-20" />;

  return (
    <header 
      className={`fixed top-0 w-full z-[100] transition-all duration-300 px-6 md:px-10 py-4 md:py-6 ${
        isScrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm font-medium' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="z-[110]">
          {/* 로고 크기를 키우고, 검정 배경을 제거(반전 후 흰 배경 투명화) */}
          <img src="/emindlogo.jpg" alt="Emind" className="h-12 md:h-16 w-auto invert mix-blend-multiply" />
        </Link>
      </div>
    </header>
  )
}
