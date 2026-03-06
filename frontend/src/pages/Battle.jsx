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
  const inputRef = useRef(null)

  const p1Name = state.myRole === 'p1' ? state.myName : state.oppName
  const p2Name = state.myRole === 'p2' ? state.myName : state.oppName
  const myAv = getAvatar(state.myAvatar)
  const oppAv = getAvatar(state.oppAvatar || 'skull')
  const p1Av = state.myRole === 'p1' ? myAv : oppAv
  const p2Av = state.myRole === 'p2' ? myAv : oppAv

  useEffect(() => {
    if (state.screen === 'lobby') navigate('/')
  }, [state.screen])

  useEffect(() => {
    if (state.roundActive && inputRef.current) inputRef.current.focus()
  }, [state.roundActive])

  // Play win/lose on match end
  useEffect(() => {
    if (state.matchOver) {
      if (state.matchWinner === state.myName) sfx.win()
      else sfx.lose()
    }
  }, [state.matchOver])

  function sendMessage() {
    const text = input.trim()
    if (!text || !state.roundActive) return
    sfx.messageSent()
    socket.emit('send_message', { text })
    setInput('')
  }

  function handleRematch() {
    socket.emit('rematch_request')
    dispatch({ type: 'SYSTEM_MSG', text: '🔄 YOU REQUESTED A REMATCH...' })
  }

  function handleLeave() {
    // Tell server we're intentionally leaving (not a reconnectable disconnect)
    socket.emit('leave_room')
    // Clear session so reconnect doesn't try to rejoin old room
    sessionStorage.removeItem('kw_session')
    // Stop all SFX
    sfx.unlock()
    // Full state reset
    dispatch({ type: 'RESET' })
    navigate('/')
  }

  // Last score for crowd reactions
  const lastScore = state.lastHit ? { total: state.lastHit.total } : null

  return (
    <div className={styles.page} onClick={() => sfx.unlock()}>
      <div className={styles.layout}>

        <RoundHUD
          round={state.round}
          timer={state.timer}
          p1RoundWins={state.p1RoundWins}
          p2RoundWins={state.p2RoundWins}
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

        <ChatArea messages={state.messages} myRole={state.myRole} />

        <div className={styles.inputWrap}>
          <div className={styles.inputRow}>
            <input
              ref={inputRef}
              className={`${styles.battleInput} ${styles[state.myRole+'Input']}`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && sendMessage()}
              placeholder={state.roundActive ? `Type your best shot...` : 'Waiting...'}
              maxLength={200}
              disabled={!state.roundActive}
            />
            <button
              className={`${styles.sendBtn} ${styles[state.myRole]}`}
              onClick={sendMessage}
              disabled={!state.roundActive || !input.trim()}
            >SEND</button>
          </div>
          <div className={styles.charCount}>
            <span style={{ color: input.length > 180 ? 'var(--neon-red)' : 'var(--dim)' }}>{input.length}</span>/200
            <button
              onClick={() => {
                if (window.confirm('Forfeit and leave? This counts as a loss.')) handleLeave()
              }}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: '1px solid rgba(255,0,60,0.3)',
                color: 'rgba(255,0,60,0.5)',
                fontFamily: "'Share Tech Mono',monospace",
                fontSize: 9, letterSpacing: 1,
                padding: '2px 8px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.target.style.borderColor='var(--neon-red)'; e.target.style.color='var(--neon-red)' }}
              onMouseLeave={e => { e.target.style.borderColor='rgba(255,0,60,0.3)'; e.target.style.color='rgba(255,0,60,0.5)' }}
            >✕ FORFEIT</button>
          </div>
        </div>
      </div>

      {/* Opponent reconnecting banner */}
      {state.oppReconnecting && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 140,
          background: 'rgba(255,230,0,0.12)',
          border: '1px solid var(--neon-yellow)',
          padding: '10px 16px',
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: 12, color: 'var(--neon-yellow)',
          textAlign: 'center', letterSpacing: 2,
          animation: 'blink 1s ease infinite'
        }}>
          📶 {state.oppName} LOST CONNECTION — WAITING 15s FOR RECONNECT...
          <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
        </div>
      )}

      {/* Opponent disconnected overlay */}
      {state.oppDisconnected && !state.matchOver && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 150,
          background: 'rgba(5,5,8,0.96)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 16, textAlign: 'center', padding: 24,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <div style={{
            fontFamily: "'Black Ops One',cursive",
            fontSize: 'clamp(24px,6vw,48px)',
            color: 'var(--neon-yellow)',
            textShadow: '0 0 20px var(--neon-yellow)',
            letterSpacing: 3
          }}>OPPONENT LEFT</div>
          <div style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 13, color: 'var(--dim)',
            letterSpacing: 1, maxWidth: 280
          }}>
            {state.oppName} disconnected from the battle.
          </div>
          <button
            onClick={handleLeave}
            style={{
              marginTop: 8,
              padding: '13px 32px',
              background: 'var(--neon-cyan)', color: '#000',
              border: 'none',
              fontFamily: "'Black Ops One',cursive",
              fontSize: 14, letterSpacing: 2, cursor: 'pointer',
              clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))'
            }}
          >
            BACK TO LOBBY
          </button>
          <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
        </div>
      )}

      {/* Countdown overlay */}
      {state.showCountdown && (
        <Countdown
          round={state.round}
          onDone={() => dispatch({ type: 'COUNTDOWN_DONE' })}
        />
      )}

      {/* Crowd reactions */}
      <CrowdReactions lastScore={lastScore} />

      <RoundOverlay
        p1Name={p1Name} p2Name={p2Name}
        p1Score={state.p1Score} p2Score={state.p2Score}
        p1RoundWins={state.p1RoundWins} p2RoundWins={state.p2RoundWins}
        roundActive={state.roundActive} matchOver={state.matchOver}
        showCountdown={state.showCountdown}
      />

      <MatchOverlay
        matchOver={state.matchOver}
        winner={state.matchWinner}
        myName={state.myName}
        p1Name={p1Name} p2Name={p2Name}
        p1Wins={state.p1RoundWins} p2Wins={state.p2RoundWins}
        onRematch={handleRematch}
        onLeave={handleLeave}
      />
    </div>
  )
}
