'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, User, LogOut, ChevronRight } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface NavLink {
  name: string
  href: string
  highlight?: boolean
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setIsMounted(true)
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        // 1. Metadata 확인
        const metaRole = (user?.user_metadata?.role || '').toLowerCase()
        // 2. DB 정보 확인
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        const dbRole = (profile?.role || '').toLowerCase()
        
        setIsAdmin(metaRole === 'doctor' || metaRole === 'admin' || dbRole === 'doctor' || dbRole === 'admin')
      }
    }
    getUser()

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
    router.push('/')
  }

  // 일반 링크 순서: 심리상담 챗봇 → Cure → 마이페이지
  const baseNavLinks: NavLink[] = [
    { name: '심리상담 챗봇', href: '/chat' },
    { name: '인지재구성(Cure)', href: '/select' },
    { name: '마이페이지', href: '/my-situation' },
  ]

  // 관리자에게만 추가로 표시
  const navLinks: NavLink[] = isAdmin
    ? [...baseNavLinks, { name: '관리자 뷰어', href: '/dashboard', highlight: true }]
    : baseNavLinks

  if (!isMounted) return <div className="h-20" />;

  return (
    <header 
      className={`fixed top-0 w-full z-[100] transition-all duration-300 px-6 md:px-10 py-4 md:py-6 ${
        isScrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm font-medium' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center text-gray-500">
        <Link href="/" className="z-[110]">
          <img src="/moodb-logo.svg" alt="MoodB" className="h-8 md:h-10 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex gap-10 font-bold text-sm tracking-tight text-gray-500">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`hover:text-[#566e63] transition-colors ${link.highlight ? 'text-[#bfa588] font-black' : ''}`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right Actions (Desktop) */}
        <div className="hidden lg:flex items-center gap-6">
          {user && (
            <div className="flex items-center gap-6 font-bold">
              {/* Point Display for Users */}
              <div className="flex items-center gap-2 bg-[#f0f4f1] px-4 py-2 rounded-full border border-[#e8efe9] group cursor-pointer hover:bg-[#566e63] transition-all">
                <div className="w-5 h-5 rounded-full bg-[#566e63] group-hover:bg-white flex items-center justify-center text-white group-hover:text-[#566e63] text-[10px]">P</div>
                <span className="text-xs text-[#566e63] group-hover:text-white">마음 점수: <span className="font-black">5,000 dB</span></span>
                <div className="hidden group-hover:block absolute top-14 right-40 bg-white shadow-2xl p-4 rounded-2xl w-64 border border-gray-100 z-[120] text-left">
                   <p className="text-[#222] text-sm mb-2 font-black">✨ 포인트 활용 가이드</p>
                   <p className="text-gray-500 text-[11px] leading-relaxed font-bold">
                     - 매일 진단 시 100P 적립<br/>
                     - CBT 완료 시 500P 적립<br/>
                     - 적립된 포인트로 프리미엄 명상 해금!
                   </p>
                </div>
              </div>
              
              <span className="text-gray-400 text-sm tracking-widest">{user.user_metadata?.full_name || '로그인 중'}</span>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors text-sm"
              >
                <div className="bg-gray-100 p-2 rounded-full">
                  <LogOut size={16} />
                </div>
                <span>로그아웃</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="lg:hidden z-[110] p-2 text-gray-600"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Mobile Menu Overlay */}
        <div 
          className={`fixed inset-0 bg-white z-[100] flex flex-col pt-32 px-10 transition-transform duration-500 ease-in-out lg:hidden ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <nav className="flex flex-col gap-8 mb-12">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                onClick={() => setIsOpen(false)}
                className={`text-2xl font-black flex items-center justify-between group ${
                  link.highlight ? 'text-[#bfa588]' : 'text-[#222]'
                }`}
              >
                {link.name}
                <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </nav>

          <div className="mt-auto pb-12 border-t border-gray-100 pt-8 flex flex-col gap-4">
            {user && (
              <>
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#566e63] font-bold">
                     <User size={20} />
                   </div>
                   <span className="font-bold text-gray-700">{user.email}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full py-4 border border-gray-200 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <LogOut size={18} /> 로그아웃
                </button>
                <Link 
                  href="/my-situation" 
                  onClick={() => setIsOpen(false)}
                  className="w-full py-4 bg-[#566e63] text-white rounded-2xl font-bold text-center shadow-lg"
                >
                  마이페이지 바로가기
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
