import re

# Read current main (with new UI)
with open('app/meditation/[emotion]/page.tsx', 'r', encoding='utf-8') as f:
    main_text = f.read()

# 1. Update Imports (Add Volume2, remove redundant ones if any)
main_text = main_text.replace("import { ArrowLeft, Play, Pause, RotateCcw, Brain, MessageCircle, Heart, Fingerprint, Activity, Wind, Sparkles, Volume2, FileText, Settings, Type, Download } from 'lucide-react'", 
                             "import { ArrowLeft, Play, Pause, RotateCcw, Brain, MessageCircle, Heart, Fingerprint, Activity, Wind, Sparkles, Volume2, FileText, Settings, Type, Download, SkipForward } from 'lucide-react'")

# 2. Replace State variables block
state_pattern = r"  const \[isPlaying, setIsPlaying\] = useState\(false\)\n  const \[currentTimeSec, setCurrentTimeSec\] = useState\(0\)\n  const \[durationSec, setDurationSec\] = useState\(300\)\n\n  // Studio States\n  const \[activeTab, setActiveTab\] = useState<'script' \| 'audio' \| 'subtitle' \| 'export'>\('audio'\)\n  const \[selectedVoice, setSelectedVoice\] = useState\('female1'\)\n  const \[voiceVolume, setVoiceVolume\] = useState\(100\)\n  const \[bgmVolume, setBgmVolume\] = useState\(30\)\n  const \[showSubtitle, setShowSubtitle\] = useState\(true\)\n  \n  const voiceRef = useRef<HTMLAudioElement>\(null\)\n  const iframeRef = useRef<HTMLIFrameElement>\(null\)"

new_states = """  const [isPlaying, setIsPlaying] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0)
  const [currentDisplayScript, setCurrentDisplayScript] = useState("")
  
  // Studio States
  const [activeTab, setActiveTab] = useState<'script' | 'audio' | 'subtitle'>('audio')
  const [voiceVolume, setVoiceVolume] = useState(100)
  const [bgmVolume, setBgmVolume] = useState(30)
  const [showSubtitle, setShowSubtitle] = useState(true)
  const [showResultModal, setShowResultModal] = useState(false)
  
  // 브라우저 지원 음성 목록 상태
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('')
  
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)"""

main_text = re.sub(state_pattern, new_states, main_text)

# 3. Replace Effects and Core Logic (Timer, SpeakSegment, etc.)
logic_pattern = r"  // 보이스 오디오 제어.*?const progressPercent = \(currentTimeSec / durationSec\) \* 100"
new_logic = """  // 브라우저 보이스 로드
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('ko'))
      setVoices(availableVoices)
      if (availableVoices.length > 0 && !selectedVoiceURI) {
        setSelectedVoiceURI(availableVoices[0].voiceURI)
      }
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
  }, [selectedVoiceURI])

  // 즉시 설정 반영
  const applySettingsNow = () => {
    if (isPlaying && isSpeaking) {
      window.speechSynthesis.cancel()
      speakSegment(currentSegmentIndex)
    }
  }

  // 0.1초 단위 정밀 타이머 엔진
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsedTime(prev => {
          const next = prev + 0.1
          // 마지막 문장 종료 후 3초 뒤 자동 모달
          const lastSeg = activeScripts[activeScripts.length - 1]
          if (lastSeg && lastSeg.endTime && next >= lastSeg.endTime + 3) {
            setIsPlaying(false)
            setShowResultModal(true)
            return next
          }
          return next
        })
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPlaying, activeScripts.length])

  // 문장 트리거 감지
  useEffect(() => {
    if (!isPlaying) return
    
    const script = activeScripts[currentSegmentIndex]
    if (script && elapsedTime >= script.time) {
      speakSegment(currentSegmentIndex)
      setCurrentSegmentIndex(prev => prev + 1)
    }
  }, [elapsedTime, isPlaying, currentSegmentIndex, activeScripts])

  const speakSegment = (index: number) => {
    if (index >= activeScripts.length) return
    setIsSpeaking(true)
    const script = activeScripts[index]
    const utterance = new SpeechSynthesisUtterance(script.text)
    utterance.lang = 'ko-KR'
    
    let dynamicRate = 1.0
    if (script.endTime) {
       const durationSec = script.endTime - script.time
       const charsPerSec = script.text.length / (durationSec || 1)
       const targetRate = charsPerSec / 5.5
       dynamicRate = Math.max(0.3, Math.min(2.0, targetRate))
    }
    
    utterance.rate = dynamicRate
    utterance.pitch = 1.0
    utterance.volume = voiceVolume / 100
    
    if (voices.length > 0) {
      const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI)
      if (selectedVoice) utterance.voice = selectedVoice
    }

    utterance.onstart = () => setCurrentDisplayScript(script.text)
    utterance.onend = () => {
       setIsSpeaking(false)
       const nextScript = activeScripts[index + 1]
       if (nextScript && nextScript.time - (script.endTime || script.time) > 2) {
          // 다음 문장까지 2초 이상 남으면 가이드 메시지 (선택 사항)
       }
    }

    window.speechSynthesis.speak(utterance)
  }

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false)
      window.speechSynthesis.cancel()
    } else {
      setIsPlaying(true)
    }
  }

  const resetPlay = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setElapsedTime(0)
    setCurrentSegmentIndex(0)
    setIsSpeaking(false)
    setCurrentDisplayScript("")
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [0, true] }), '*')
    }
  }

  const lastSeg = activeScripts[activeScripts.length - 1]
  const maxDuration = lastSeg ? ((lastSeg.endTime || lastSeg.time + 10) + 3) : 1
  const progressPercent = (elapsedTime / maxDuration) * 100"""

main_text = re.sub(logic_pattern, new_logic, main_text, flags=re.DOTALL)

# 4. Update UI Components (Sticky Layout + Circle Progress + Tabs)
main_text = main_text.replace("<div className=\"flex-1 bg-white/80 backdrop-blur-md rounded-[40px] shadow-2xl border border-white p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[500px]\">", 
                             "<div className=\"lg:sticky lg:top-10 lg:self-start flex-1 bg-white/80 backdrop-blur-md rounded-[40px] shadow-2xl border border-white p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[500px]\">")

main_text = main_text.replace("{isPlaying ? `${Math.floor(currentTimeSec / 60)}:${String(Math.floor(currentTimeSec % 60)).padStart(2, '0')}` : 'READY'}",
                             "{isPlaying ? `${Math.floor(elapsedTime / 60)}:${String(Math.floor(elapsedTime % 60)).padStart(2, '0')}` : 'READY'}")

main_text = main_text.replace("{currentScript || \"조용히 숨을 고릅니다...\"}", "{currentDisplayScript || \"...\"}")

# Update Tab Contents (Audio Tab)
audio_tab_pattern = r"{activeTab === 'audio' && \(.*?</div>\n              </div>\n            \)}"
new_audio_tab = """{activeTab === 'audio' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <h3 className="font-extrabold text-[#222] mb-4 text-lg">리딩 설정 (내장 음성)</h3>
                  <div className="space-y-6 bg-[#faf8f5] p-5 rounded-2xl border border-gray-100">
                    <div>
                      <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
                        <span>목소리 종류</span>
                      </div>
                      <select 
                        value={selectedVoiceURI} 
                        onChange={(e) => { setSelectedVoiceURI(e.target.value); setTimeout(applySettingsNow, 50); }}
                        className="w-full p-2 border border-gray-200 rounded-xl bg-white text-sm font-medium text-[#222]"
                      >
                        {voices.length === 0 && <option>목소리 로딩 중...</option>}
                        {voices.map(v => (
                          <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-[#222] mb-4 flex items-center gap-2">
                    <Volume2 size={18} /> 오디오 믹서 (스마트 호흡 매칭)
                  </h3>
                  <div className="space-y-6 bg-[#faf8f5] p-5 rounded-2xl border border-gray-100">
                    <div>
                      <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
                        <span>보이스 볼륨</span>
                        <span>{voiceVolume}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={voiceVolume} onChange={(e) => setVoiceVolume(Number(e.target.value))} className="w-full accent-[#566e63]" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
                        <span>자연 배경소리 (BGM)</span>
                        <span>{bgmVolume}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={bgmVolume} onChange={(e) => setBgmVolume(Number(e.target.value))} className="w-full accent-blue-400" />
                      <p className="text-xs text-gray-400 mt-2 font-medium">BGM은 Youtube 소스를 자동으로 사용합니다.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}"""
main_text = re.sub(audio_tab_pattern, new_audio_tab, main_text, flags=re.DOTALL)

# Update Script Tab to use currentSegmentIndex
main_text = main_text.replace("{currentTimeSec >= line.time ? 'bg-[#566e63]/10 text-[#222] font-bold border border-[#566e63]/20' : 'text-gray-400'}",
                             "{currentSegmentIndex > idx ? 'bg-[#566e63]/10 text-[#222] font-bold border border-[#566e63]/20' : 'text-gray-400'}")

# Update Export Tab Removal (If any) or just handle the activeTab type
main_text = main_text.replace("const [activeTab, setActiveTab] = useState<'script' | 'audio' | 'subtitle' | 'export'>('audio')",
                             "const [activeTab, setActiveTab] = useState<'script' | 'audio' | 'subtitle'>('audio')")

# Final Cleanup of unused things like durationSec if any remain
main_text = main_text.replace("currentTimeSec < durationSec", "elapsedTime < maxDuration")
main_text = main_text.replace("currentTimeSec >= durationSec", "showResultModal")

with open('app/meditation/[emotion]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(main_text)
