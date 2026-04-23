'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsScrolled(currentScrollY > 20)
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false) // 내릴 때 숨김
      } else {
        setIsVisible(true)  // 올릴 때 표시
      }
      setLastScrollY(currentScrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  if (!isMounted) return <div className="h-16" />;

  return (
    <header 
      className={`fixed top-0 w-full z-[100] transition-all duration-300 px-6 md:px-10 py-3 md:py-4 bg-white font-medium ${
        isScrolled ? 'shadow-sm' : ''
      } ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="z-[110]">
          {/* 로고 크기 축소 및 검정 배경 제거 */}
          <img src="/emindlogo.jpg" alt="Emind" className="h-8 md:h-10 w-auto invert mix-blend-multiply" />
        </Link>
      </div>
    </header>
  )
}
