import { useState, useEffect } from 'react'

export function RoundOverlay({ p1Name, p2Name, p1Score, p2Score, p1RoundWins, p2RoundWins, roundActive, matchOver, showCountdown, bestBurn }) {
  const show = !roundActive && !matchOver && !showCountdown
  const [burnVisible, setBurnVisible] = useState(false)

  useEffect(() => {
    if (bestBurn && show) {
      const t = setTimeout(() => setBurnVisible(true), 400)
      return () => clearTimeout(t)
    } else {
      setBurnVisible(false)
    }
  }, [bestBurn, show])

  if (!show) return null

  const winner = p1Score > p2Score ? p1Name : p2Score > p1Score ? p2Name : 'TIE'
  const isP1Win = winner === p1Name
  const isTie = winner === 'TIE'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(5,5,8,0.95)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 14, textAlign: 'center', padding: 20,
      animation: 'fadeIn 0.3s ease'
    }}>
      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes burnIn  { 0%{opacity:0;transform:scale(0.9) translateY(8px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes flamePulse { 0%,100%{text-shadow:0 0 10px #ff6b00,0 0 20px #ff6b0066} 50%{text-shadow:0 0 20px #ff6b00,0 0 40px #ff6b00aa} }
      `}</style>

      <div style={{ fontFamily:"'Black Ops One',cursive", fontSize:'clamp(32px,8vw,64px)', color:'var(--neon-yellow)', letterSpacing:4, textShadow:'0 0 20px var(--neon-yellow)' }}>
        ROUND OVER!
      </div>

      <div style={{ fontFamily:"'Black Ops One',cursive", fontSize:'clamp(18px,5vw,36px)', color: isTie?'var(--neon-yellow)':isP1Win?'var(--neon-cyan)':'var(--neon-red)', textShadow:'0 0 15px currentColor' }}>
        {isTie ? '⚡ DEAD HEAT' : `${winner.toUpperCase()} WINS!`}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, maxWidth:360, width:'100%' }}>
        {[{name:p1Name,score:p1Score,color:'var(--neon-cyan)'},{name:p2Name,score:p2Score,color:'var(--neon-red)'}].map(({name,score,color})=>(
          <div key={name} style={{ padding:14, textAlign:'center', border:`1px solid ${color}`, background:'var(--panel)' }}>
            <div style={{ fontFamily:"'Black Ops One',cursive", fontSize:30, color }}>{score}</div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:'var(--dim)', letterSpacing:2, marginTop:4 }}>{name}</div>
          </div>
        ))}
      </div>

      {/* Best Burn of the Round */}
      {burnVisible && bestBurn ? (
        <div style={{
          maxWidth: 380, width: '100%',
          border: '1px solid rgba(255,107,0,0.6)',
          background: 'rgba(255,107,0,0.06)',
          padding: '12px 16px',
          animation: 'burnIn 0.5s cubic-bezier(0.36,0.07,0.19,0.97)',
        }}>
          <div style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 8, letterSpacing: 3,
            color: '#ff6b00',
            marginBottom: 6,
            animation: 'flamePulse 2s ease infinite',
          }}>🔥 BEST BURN OF THE ROUND</div>

          <div style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 11, color: 'var(--fg)',
            lineHeight: 1.5, marginBottom: 6,
            fontStyle: 'italic',
          }}>"{bestBurn.text}"</div>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
            <span style={{
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: 8, color: '#ff6b00', letterSpacing: 1,
            }}>— {bestBurn.name?.toUpperCase()}</span>
            <span style={{
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: 8, color: 'var(--dim)', letterSpacing: 1,
              textAlign: 'right', flex: 1,
            }}>{bestBurn.reason?.toUpperCase()}</span>
          </div>
        </div>
      ) : (
        <div style={{
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: 8, color: 'rgba(255,107,0,0.3)',
          letterSpacing: 2,
          animation: 'blink 1s ease infinite',
        }}>🔥 JUDGING BEST BURN...</div>
      )}

      <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:'var(--dim)', letterSpacing:3, animation:'blink 1s ease infinite' }}>
        NEXT ROUND STARTING...
      </div>
    </div>
  )
}

export function MatchOverlay({ matchOver, winner, winnerRole, myRole, myName, p1Name, p2Name, p1Wins, p2Wins, onRematch, onLeave, matchBestBurn }) {
  if (!matchOver) return null
  const isTie = winnerRole === 'tie' || winner === 'TIE'
  const isMyWin = !isTie && winnerRole === myRole
  const myColor = isMyWin ? 'var(--neon-green)' : isTie ? 'var(--neon-yellow)' : 'var(--neon-red)'
  const winColor = isTie ? 'var(--neon-yellow)' : winnerRole === 'p1' ? 'var(--neon-cyan)' : 'var(--neon-red)'
  const resultText = isTie ? '⚡ DRAW' : isMyWin ? '🏆 YOU WIN' : '💀 YOU LOSE'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 110,
      background: 'rgba(5,5,8,0.97)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 12, textAlign: 'center', padding: 24,
      animation: 'fadeIn 0.4s ease', overflowY: 'auto',
    }}>
      <style>{`
        @keyframes fadeIn     { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:0.75} }
        @keyframes flamePulse { 0%,100%{text-shadow:0 0 10px #ff6b00,0 0 20px #ff6b0066} 50%{text-shadow:0 0 20px #ff6b00,0 0 40px #ff6b00aa} }
      `}</style>

      <div style={{ fontFamily:"'Black Ops One',cursive", fontSize:'clamp(36px,12vw,80px)', color:myColor, textShadow:`0 0 30px ${myColor}, 0 0 60px ${myColor}44`, letterSpacing:4, lineHeight:1, animation:'pulse 1.2s ease infinite' }}>
        {resultText}
      </div>

      {!isTie && (
        <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:'var(--dim)', letterSpacing:3 }}>
          {isMyWin ? 'YOUR TRASH TALK WINS' : `${winner.toUpperCase()} WINS THE MATCH`}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, maxWidth:340, width:'100%' }}>
        {[
          {name:p1Name, wins:p1Wins, color:'var(--neon-cyan)', isMe: myRole==='p1'},
          {name:p2Name, wins:p2Wins, color:'var(--neon-red)',  isMe: myRole==='p2'}
        ].map(({name,wins,color,isMe})=>(
          <div key={name} style={{ padding:'12px 8px', textAlign:'center', border:`1px solid ${color}`, background: isMe ? `${color}10` : 'var(--panel)' }}>
            <div style={{ fontFamily:"'Black Ops One',cursive", fontSize:30, color }}>{wins}</div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:'var(--dim)', letterSpacing:2, marginTop:3 }}>
              {name}{isMe ? ' [YOU]' : ''}<br/>ROUNDS WON
            </div>
          </div>
        ))}
      </div>

      {/* Match MVP Burn */}
      {matchBestBurn && (
        <div style={{
          maxWidth: 380, width: '100%',
          border: '1px solid rgba(255,107,0,0.7)',
          background: 'rgba(255,107,0,0.07)',
          padding: '12px 16px',
        }}>
          <div style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 8, letterSpacing: 3, color: '#ff6b00',
            marginBottom: 6, animation: 'flamePulse 2s ease infinite',
          }}>🔥 MATCH MVP BURN</div>

          <div style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 11, color: 'var(--fg)',
            lineHeight: 1.5, marginBottom: 6, fontStyle: 'italic',
          }}>"{matchBestBurn.text}"</div>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
            <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:'#ff6b00', letterSpacing:1 }}>— {matchBestBurn.name?.toUpperCase()}</span>
            <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:'var(--dim)', letterSpacing:1, textAlign:'right', flex:1 }}>{matchBestBurn.reason?.toUpperCase()}</span>
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center', maxWidth:340, width:'100%' }}>
        <button onClick={onRematch} style={{ flex:1, minWidth:130, padding:'13px 20px', background:'var(--neon-cyan)', color:'#000', border:'none', fontFamily:"'Black Ops One',cursive", fontSize:13, letterSpacing:2, cursor:'pointer', clipPath:'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>REMATCH</button>
        <button onClick={onLeave} style={{ flex:1, minWidth:130, padding:'13px 20px', background:'transparent', color:'var(--neon-red)', border:'1px solid var(--neon-red)', fontFamily:"'Black Ops One',cursive", fontSize:13, letterSpacing:2, cursor:'pointer', clipPath:'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>LEAVE</button>
      </div>
    </div>
  )
}

export default RoundOverlay
