'use client'

import { useEffect, useRef } from 'react'

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let particles: Particle[] = []

    // 캔버스 사이즈 맞춤
    const resize = () => {
      if (!canvas.parentElement) return
      canvas.width = canvas.parentElement.clientWidth
      canvas.height = canvas.parentElement.clientHeight
    }
    
    // 초기 세팅
    window.addEventListener('resize', resize)
    resize()

    const mouse = { x: -100, y: -100, isMoving: false }

    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      life: number
      maxLife: number

      constructor(x: number, y: number) {
        this.x = x + (Math.random() * 40 - 20)
        this.y = y + (Math.random() * 40 - 20)
        this.size = Math.random() * 2 + 0.5
        this.speedX = Math.random() * 2 - 1
        this.speedY = Math.random() * -2 - 0.5
        this.maxLife = Math.random() * 30 + 50
        this.life = this.maxLife
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY
        this.life -= 1
        // 서서히 작아지거나 반짝임
        if (this.size > 0.1) this.size -= 0.01
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = `rgba(255, 255, 255, ${this.life / this.maxLife})`
        ctx.shadowBlur = 10
        ctx.shadowColor = 'white'
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
      
      // 마우스를 움직일 때마다 파티클 소량 생성 (모래가 쓸리거나 반딧불이가 이는 느낌)
      for (let i = 0; i < 3; i++) {
        particles.push(new Particle(mouse.x, mouse.y))
      }
    }

    const handleMouseLeave = () => {
      mouse.x = -100
      mouse.y = -100
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // 잔상(trail) 효과를 원한다면 fillRect rgba로 덮어도 되지만
      // 이번엔 빛 결정체들이 올라가는 효과
      for (let i = 0; i < particles.length; i++) {
        particles[i].update()
        particles[i].draw()
        
        if (particles[i].life <= 0) {
          particles.splice(i, 1)
          i--
        }
      }
      animationFrameId = requestAnimationFrame(animate)
    }
    
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full z-20 pointer-events-auto cursor-crosshair mix-blend-screen"
    />
  )
}
