import { useState, useEffect, useRef } from 'react'

const REACTIONS = {
  fatal:  ['🔥','💀','😱','🤯','⚡','👑','💥','🏆'],
  heavy:  ['😤','🎯','💪','🔥','👏','😮','⚔️'],
  medium: ['👀','😯','🤔','👌','💬','🗣️'],
  weak:   ['😴','🥱','💤','😒','🙄','👎'],
}

function getReactionSet(total) {
  if (total >= 25) return REACTIONS.fatal
  if (total >= 20) return REACTIONS.heavy
  if (total >= 13) return REACTIONS.medium
  return REACTIONS.weak
}

let reactionId = 0

export default function CrowdReactions({ lastScore }) {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (!lastScore) return
    const set = getReactionSet(lastScore.total)
    const count = lastScore.total >= 25 ? 8 : lastScore.total >= 20 ? 5 : lastScore.total >= 13 ? 3 : 1

    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: reactionId++,
      emoji: set[Math.floor(Math.random() * set.length)],
      x: 10 + Math.random() * 80,
      delay: i * 80,
      duration: 1800 + Math.random() * 600,
      size: lastScore.total >= 25 ? 28 : lastScore.total >= 20 ? 24 : 20,
    }))

    setParticles(p => [...p, ...newParticles])

    // Cleanup after animation
    const maxDuration = Math.max(...newParticles.map(p => p.delay + p.duration))
    const timer = setTimeout(() => {
      const ids = new Set(newParticles.map(p => p.id))
      setParticles(p => p.filter(x => !ids.has(x.id)))
    }, maxDuration + 100)

    return () => clearTimeout(timer)
  }, [lastScore])

  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50, overflow: 'hidden'
    }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          bottom: '20%',
          left: `${p.x}%`,
          fontSize: p.size,
          animation: `floatUp ${p.duration}ms ease-out ${p.delay}ms both`,
          userSelect: 'none'
        }}>
          {p.emoji}
        </div>
      ))}
      <style>{`
        @keyframes floatUp {
          from { transform: translateY(0) scale(0.5); opacity: 0; }
          15%  { transform: translateY(-20px) scale(1.2); opacity: 1; }
          100% { transform: translateY(-180px) scale(0.8); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
