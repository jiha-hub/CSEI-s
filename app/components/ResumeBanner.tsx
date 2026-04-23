'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Moon, Play, X } from 'lucide-react'

export default function ResumeBanner() {
  const [resumeData, setResumeData] = useState<{ emotion: string; progress: number } | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('meditation_resume')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.emotion) {
          setResumeData(parsed)
          setIsVisible(true)
        }
      }
    } catch (e) {}
  }, [])

  if (!isVisible || !resumeData) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-2xl z-50 animate-in fade-in slide-in-from-bottom-10 duration-700">
      <div className="bg-gradient-to-r from-[#566e63] to-[#4a5c53] rounded-[30px] p-5 pr-6 flex items-center justify-between gap-4 shadow-[0_20px_50px_rgba(42,54,48,0.3)] border border-white/20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Moon size={24} className="text-white fill-white/20" />
          </div>
          <div>
            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Meditation in Progress</p>
            <p className="text-white font-black text-base sm:text-lg">
              {resumeData.emotion} 명상 <span className="text-white/40 font-medium ml-1">· {resumeData.progress}%</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href={`/meditation/${encodeURIComponent(resumeData.emotion)}`}
            className="flex items-center gap-2 bg-white text-[#566e63] font-black px-5 py-3 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all text-sm whitespace-nowrap"
          >
            <Play size={16} className="fill-current" /> 이어서 하기
          </Link>
          <button
            onClick={() => {
              setIsVisible(false)
              localStorage.removeItem('meditation_resume')
            }}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-black/10 hover:bg-black/20 text-white/50 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
