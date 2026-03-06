import { useEffect, useRef, useState } from 'react'

export default function PowerBar({ p1Score, p2Score, p1Name, p2Name, lastHitRole, lastHitTotal }) {
  const total = p1Score + p2Score
  const p1pct = total === 0 ? 50 : Math.round((p1Score / total) * 100)
  const p2pct = 100 - p1pct
  const [flash, setFlash] = useState(null) // 'p1' | 'p2' | null
  const [shake, setShake] = useState(false)
  const prevHit = useRef(null)

  useEffect(() => {
    if (!lastHitRole || !lastHitTotal) return
    const key = `${lastHitRole}-${lastHitTotal}-${Date.now()}`
    if (prevHit.current === key) return
    prevHit.current = key

    setFlash(lastHitRole)
    if (lastHitTotal >= 20) setShake(true)

    const t1 = setTimeout(() => setFlash(null), 400)
    const t2 = setTimeout(() => setShake(false), 300)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [lastHitRole, lastHitTotal])

  const flashColor = flash === 'p1' ? 'var(--neon-cyan)' : 'var(--neon-red)'

  return (
    <div style={{
      padding: '6px 0',
      animation: shake ? 'shake 0.25s ease' : 'none'
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: "'Share Tech Mono',monospace", fontSize: 10, marginBottom: 4
      }}>
        <span style={{ color: 'var(--neon-cyan)' }}>{p1Name}</span>
        <span style={{ color: 'var(--dim)', letterSpacing: 2 }}>POWER BAR</span>
        <span style={{ color: 'var(--neon-red)' }}>{p2Name}</span>
      </div>

      <div style={{
        height: 22,
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${flash ? flashColor : 'var(--border)'}`,
        position: 'relative', overflow: 'hidden',
        transition: 'border-color 0.1s',
        boxShadow: flash ? `0 0 15px ${flashColor}` : 'none'
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: p1pct + '%',
          background: 'linear-gradient(90deg, rgba(0,245,255,0.2), var(--neon-cyan))',
          transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)'
        }} />
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: p2pct + '%',
          background: 'linear-gradient(270deg, rgba(255,0,60,0.2), var(--neon-red))',
          transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)'
        }} />
        {/* Flash overlay */}
        {flash && (
          <div style={{
            position: 'absolute', inset: 0,
            background: `${flashColor}30`,
            animation: 'flashFade 0.4s ease forwards'
          }} />
        )}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, width: 3,
          left: p1pct + '%', transform: 'translateX(-50%)',
          background: 'var(--neon-yellow)',
          boxShadow: '0 0 8px var(--neon-yellow)',
          transition: 'left 0.6s cubic-bezier(0.34,1.56,0.64,1)',
          zIndex: 2
        }} />
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: "'Share Tech Mono',monospace", fontSize: 11, marginTop: 3
      }}>
        <span style={{ color: 'var(--neon-cyan)' }}>{p1pct}%</span>
        <span style={{ color: 'var(--neon-red)' }}>{p2pct}%</span>
      </div>

      <style>{`
        @keyframes flashFade {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-4px); }
          40%     { transform: translateX(4px); }
          60%     { transform: translateX(-3px); }
          80%     { transform: translateX(3px); }
        }
      `}</style>
    </div>
  )
}
