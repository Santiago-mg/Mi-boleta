import { useCallback, useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  rotationSpeed: number
  shape: 'rect' | 'circle'
  opacity: number
  life: number
}

const COLORS = [
  '#60a5fa', // blue
  '#34d399', // green
  '#fbbf24', // amber
  '#f472b6', // pink
  '#a78bfa', // purple
  '#fb923c', // orange
  '#4ade80', // lime
  '#38bdf8', // sky
]

export function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    // Create and insert canvas
    const canvas = document.createElement('canvas')
    canvas.className = 'confetti-canvas'
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    document.body.appendChild(canvas)
    canvasRef.current = canvas

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      canvas.remove()
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [])

  const fire = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Cancel previous animation
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current)
    }

    // Generate particles from multiple launch points
    const newParticles: Particle[] = []
    const count = 120

    for (let i = 0; i < count; i++) {
      const launchX = Math.random() < 0.5
        ? canvas.width * 0.25
        : canvas.width * 0.75
      const angle = Math.random() * Math.PI * 2
      const speed = 6 + Math.random() * 10

      newParticles.push({
        x: launchX,
        y: canvas.height * 0.4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        shape: Math.random() < 0.5 ? 'rect' : 'circle',
        opacity: 1,
        life: 1,
      })
    }

    particlesRef.current = newParticles

    function animate() {
      if (!ctx || !canvas) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current = particlesRef.current.filter((p) => p.life > 0)

      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.25 // gravity
        p.vx *= 0.99 // friction
        p.rotation += p.rotationSpeed
        p.life -= 0.012
        p.opacity = Math.max(0, p.life)

        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      }

      if (particlesRef.current.length > 0) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)
  }, [])

  return { fire }
}
