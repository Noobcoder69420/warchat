import { useState, useEffect } from 'react'
import sfx from '../sfx'

export default function Countdown({ onDone, round }) {
  const [count, setCount] = useState(3)
  const [phase, setPhase] = useState('number') // number | fight | done

  useEffect(() => {
    sfx.unlock()
    sfx.countdownBeep(3)

    const timers = []

    timers.push(setTimeout(() => { setCount(2); sfx.countdownBeep(2) }, 1000))
    timers.push(setTimeout(() => { setCount(1); sfx.countdownBeep(1) }, 2000))
    timers.push(setTimeout(() => { setPhase('fight'); sfx.fight() }, 3000))
    timers.push(setTimeout(() => { setPhase('done'); onDone?.() }, 3800))

    return () => timers.forEach(clearTimeout)
  }, [])

  if (phase === 'done') return null

  const isFight = phase === 'fight'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(5,5,8,0.95)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 16
    }}>
      <div style={{
        fontFamily: "'Share Tech Mono',monospace",
        fontSize: 12, color: 'var(--dim)',
        letterSpacing: 4
      }}>
        ROUND {round}
      </div>

      <div style={{
        fontFamily: "'Black Ops One',cursive",
        fontSize: isFight ? 'clamp(60px,15vw,120px)' : 'clamp(80px,20vw,160px)',
        lineHeight: 1,
        color: isFight ? 'var(--neon-yellow)' : 'var(--neon-cyan)',
        textShadow: isFight
          ? '0 0 30px var(--neon-yellow), 0 0 80px rgba(255,230,0,0.5)'
          : '0 0 30px var(--neon-cyan), 0 0 80px rgba(0,245,255,0.4)',
        animation: 'countPop 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        letterSpacing: isFight ? 8 : 0
      }} key={isFight ? 'fight' : count}>
        {isFight ? 'FIGHT!' : count}
      </div>

      {!isFight && (
        <div style={{ display: 'flex', gap: 8 }}>
          {[3,2,1].map(n => (
            <div key={n} style={{
              width: 10, height: 10,
              background: n >= count ? 'var(--neon-cyan)' : 'var(--border)',
              transition: 'background 0.2s',
              boxShadow: n >= count ? '0 0 8px var(--neon-cyan)' : 'none'
            }} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes countPop {
          from { transform: scale(1.4); opacity: 0.5; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}
