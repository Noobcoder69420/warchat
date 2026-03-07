import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import socket from '../socket'
import sfx from '../sfx'
import PowerBar from '../components/PowerBar'
import ChatArea from '../components/ChatArea'
import RoundHUD from '../components/RoundHUD'
import FighterCard from '../components/FighterCard'
import { RoundOverlay } from '../components/RoundOverlay'
import { MatchOverlay } from '../components/RoundOverlay'
import Countdown from '../components/Countdown'
import CrowdReactions from '../components/CrowdReactions'
import { getAvatar } from '../avatars'
import styles from './Battle.module.css'

export default function Battle() {
  const { state, dispatch } = useGame()
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [shake, setShake] = useState(false)
  const [bgOn, setBgOn] = useState(() => localStorage.getItem('kw_bg') !== 'off')
  const [oppTyping, setOppTyping] = useState(false)

  useEffect(() => {
    if (state.roundActive && inputRef.current) inputRef.current.focus()
  }, [state.roundActive])

  useEffect(() => {
    if (!state.matchOver) return
    const isTie = state.matchWinnerRole === 'tie'
    const isMyWin = !isTie && state.matchWinnerRole === state.myRole
    if (isTie) sfx.roundEnd()
    else if (isMyWin) { sfx.win(); triggerShake(3) }
    else sfx.lose()
  }, [state.matchOver])

  useEffect(() => {
    if (state.lastHit && state.lastHit.total >= 20) triggerShake(1)
    if (state.lastHit && state.lastHit.total >= 25) triggerShake(2)
  }, [state.lastHit])

  function triggerShake(intensity = 1) {
    setShake(intensity)
    setTimeout(() => setShake(false), intensity === 3 ? 800 : 400)
  }

  useEffect(() => {
    sfx.unlock()
    if (bgOn) sfx.startBg()
    sfx.setBgMuted(!bgOn)
    return () => sfx.stopBg()
  }, [])

  function toggleBg() {
    const next = !bgOn
    setBgOn(next)
    localStorage.setItem('kw_bg', next ? 'on' : 'off')
    if (next) { sfx.startBg(); sfx.setBgMuted(false) }
    else sfx.setBgMuted(true)
  }

  useEffect(() => {
    socket.on('opponent_typing', () => {
      setOppTyping(true)
      clearTimeout(typingTimeout.current)
      typingTimeout.current = setTimeout(() => setOppTyping(false), 2500)
      sfx.opponentTyping()
    })
    return () => socket.off('opponent_typing')
  }, [])

  function handleInputChange(e) {
    setInput(e.target.value)
    if (!typingEmitTimeout.current) {
      socket.emit('typing')
      typingEmitTimeout.current = setTimeout(() => { typingEmitTimeout.current = null }, 800)
    }
  }

  function sendMessage(text) {
    const t = (text ?? input).trim()
    if (!t || !state.roundActive) return
    sfx.messageSent()
    socket.emit('send_message', { text: t })
    setInput('')
    setOppTyping(false)
    inputRef.current?.focus()
  }

  function handleRematch() {
    socket.emit('rematch_request')
    dispatch({ type: 'SYSTEM_MSG', text: '🔄 YOU REQUESTED A REMATCH...' })
  }

  function handleLeave() {
    socket.emit('leave_room')
    sessionStorage.removeItem('kw_session')
    sfx.stopBg()
    dispatch({ type: 'RESET' })
    navigate('/')
  }

  const lastScore = state.lastHit ? { total: state.lastHit.total } : null

  const shakeStyle = shake ? {
    animation: shake === 3 ? 'shakeWin 0.8s ease' : shake === 2 ? 'shakeHeavy 0.4s ease' : 'shakeLight 0.3s ease'
  } : {}

  const accentColor = state.myRole === 'p1' ? 'var(--neon-cyan)' : 'var(--neon-red)'

  return (
    <div className={styles.page} onClick={() => sfx.unlock()} style={shakeStyle}>
      <div className={styles.layout}>

        <RoundHUD
          round={state.round}
          timer={state.timer}
          p1RoundWins={state.p1RoundWins}
          p2RoundWins={state.p2RoundWins}
          modeLabel={state.modeLabel}
          roundsToWin={state.roundsToWin}
        />

        <div className={styles.fightersRow}>
          <FighterCard name={p1Name} score={state.p1Score} side="p1" isMe={state.myRole==='p1'} avatar={p1Av} />
          <div className={styles.vsBadge}>VS</div>
          <FighterCard name={p2Name} score={state.p2Score} side="p2" isMe={state.myRole==='p2'} avatar={p2Av} />
        </div>

        <PowerBar
          p1Score={state.p1Score} p2Score={state.p2Score}
          p1Name={p1Name} p2Name={p2Name}
          lastHitRole={state.lastHit?.role}
          lastHitTotal={state.lastHit?.total}
        />

        <ChatArea messages={state.messages} myRole={state.myRole} oppTyping={oppTyping} oppName={state.oppName} />

        {/* Input zone */}
        <div className={styles.inputWrap}>

          <div className={styles.inputRow}>
            <input
              ref={inputRef}
              className={`${styles.battleInput} ${styles[state.myRole+'Input']}`}
              value={input}
              onChange={handleInputChange}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={state.roundActive ? 'Type your best shot...' : 'Waiting...'}
              maxLength={200}
              disabled={!state.roundActive}
              autoComplete="off"
              autoCorrect="on"
              spellCheck={false}
              inputMode="text"
              enterKeyHint="send"
            />
            <button
              className={`${styles.sendBtn} ${styles[state.myRole]}`}
              onPointerDown={e => { e.preventDefault(); sendMessage() }}
              disabled={!state.roundActive || !input.trim()}
            >SEND</button>
          </div>

          <div className={styles.bottomBar}>
            <span className={styles.charCount} style={{ color: input.length > 180 ? 'var(--neon-red)' : undefined }}>
              {input.length}/200
            </span>

            <button
              className={`${styles.iconBtn} ${styles.musicBtn} ${bgOn ? '' : styles.off}`}
              onPointerDown={e => { e.preventDefault(); toggleBg() }}
              aria-label={bgOn ? 'Mute music' : 'Unmute music'}
            >{bgOn ? '♪ ON' : '♪ OFF'}</button>

            <button
              className={`${styles.iconBtn} ${styles.forfeitBtn}`}
              onPointerDown={e => {
                e.preventDefault()
                if (window.confirm('Forfeit and leave? This counts as a loss.')) handleLeave()
              }}
            >✕ FORFEIT</button>
          </div>
        </div>
      </div>

      {/* Opponent reconnecting banner */}
      {state.oppReconnecting && (
        <div style={{
          position:'fixed',top:0,left:0,right:0,zIndex:140,
          background:'rgba(255,230,0,0.12)',border:'1px solid var(--neon-yellow)',
          padding:'10px 16px',fontFamily:"'Share Tech Mono',monospace",
          fontSize:12,color:'var(--neon-yellow)',textAlign:'center',letterSpacing:2,
          animation:'blink 1s ease infinite'
        }}>
          📶 {state.oppName} LOST CONNECTION — WAITING 15s...
        </div>
      )}

      {/* Opponent disconnected overlay */}
      {state.oppDisconnected && !state.matchOver && (
        <div style={{
          position:'fixed',inset:0,zIndex:150,background:'rgba(5,5,8,0.96)',
          display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
          gap:16,textAlign:'center',padding:24,animation:'fadeIn 0.3s ease'
        }}>
          <div style={{fontSize:48}}>⚠️</div>
          <div style={{fontFamily:"'Black Ops One',cursive",fontSize:'clamp(22px,6vw,48px)',color:'var(--neon-yellow)',textShadow:'0 0 20px var(--neon-yellow)',letterSpacing:3}}>OPPONENT LEFT</div>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:13,color:'var(--dim)',letterSpacing:1,maxWidth:280}}>{state.oppName} disconnected from the battle.</div>
          <button onPointerDown={handleLeave} style={{marginTop:8,padding:'14px 36px',background:'var(--neon-cyan)',color:'#000',border:'none',fontFamily:"'Black Ops One',cursive",fontSize:14,letterSpacing:2,cursor:'pointer',clipPath:'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))'}}>BACK TO LOBBY</button>
          <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
        </div>
      )}

      {state.showCountdown && (
        <Countdown key={state.battleKey} round={state.round} onDone={() => dispatch({ type: 'COUNTDOWN_DONE' })} />
      )}

      <CrowdReactions lastScore={lastScore} />

      <RoundOverlay
        p1Name={p1Name} p2Name={p2Name}
        p1Score={state.p1Score} p2Score={state.p2Score}
        p1RoundWins={state.p1RoundWins} p2RoundWins={state.p2RoundWins}
        roundActive={state.roundActive} matchOver={state.matchOver}
        showCountdown={state.showCountdown}
        bestBurn={state.bestBurn}
      />

      <MatchOverlay
        matchOver={state.matchOver}
        winner={state.matchWinner}
        winnerRole={state.matchWinnerRole}
        myRole={state.myRole}
        myName={state.myName}
        p1Name={p1Name} p2Name={p2Name}
        p1Wins={state.p1RoundWins} p2Wins={state.p2RoundWins}
        onRematch={handleRematch}
        onLeave={handleLeave}
        matchBestBurn={state.matchBestBurn}
      />

      <style>{`
        @keyframes shakeLight {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-4px)} 40%{transform:translateX(4px)}
          60%{transform:translateX(-3px)} 80%{transform:translateX(3px)}
        }
        @keyframes shakeHeavy {
          0%,100%{transform:translate(0,0)}
          15%{transform:translate(-8px,-4px)} 30%{transform:translate(8px,4px)}
          45%{transform:translate(-6px,3px)}  60%{transform:translate(6px,-3px)}
          75%{transform:translate(-4px,2px)}  90%{transform:translate(4px,-2px)}
        }
        @keyframes shakeWin {
          0%,100%{transform:translate(0,0) scale(1)}
          10%{transform:translate(-10px,-5px) scale(1.02)} 20%{transform:translate(10px,5px) scale(0.98)}
          30%{transform:translate(-8px,4px) scale(1.01)}  40%{transform:translate(8px,-4px) scale(1)}
          50%{transform:translate(-5px,3px)} 60%{transform:translate(5px,-3px)}
          70%{transform:translate(-3px,2px)} 80%{transform:translate(3px,-2px)}
          90%{transform:translate(-1px,1px)}
        }
      `}</style>
    </div>
  )
}
