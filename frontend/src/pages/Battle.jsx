import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import socket from '../socket'
import PowerBar from '../components/PowerBar'
import ChatArea from '../components/ChatArea'
import RoundHUD from '../components/RoundHUD'
import FighterCard from '../components/FighterCard'
import RoundOverlay from '../components/RoundOverlay'
import MatchOverlay from '../components/MatchOverlay'
import styles from './Battle.module.css'

export default function Battle() {
  const { state, dispatch } = useGame()
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  const p1Name = state.myRole === 'p1' ? state.myName : state.oppName
  const p2Name = state.myRole === 'p2' ? state.myName : state.oppName

  useEffect(() => {
    if (state.screen === 'lobby') navigate('/')
  }, [state.screen])

  useEffect(() => {
    if (state.roundActive && inputRef.current) {
      inputRef.current.focus()
    }
  }, [state.roundActive])

  function sendMessage() {
    const text = input.trim()
    if (!text || !state.roundActive) return
    socket.emit('send_message', { text })
    setInput('')
  }

  function handleRematch() {
    socket.emit('rematch_request')
    dispatch({ type: 'SYSTEM_MSG', text: '🔄 YOU REQUESTED A REMATCH...' })
  }

  function handleLeave() {
    dispatch({ type: 'RESET' })
    navigate('/')
  }

  const myColor = state.myRole === 'p1' ? 'var(--neon-cyan)' : 'var(--neon-red)'

  return (
    <div className={styles.page}>
      <div className={styles.layout}>

        {/* HUD */}
        <RoundHUD
          round={state.round}
          timer={state.timer}
          p1RoundWins={state.p1RoundWins}
          p2RoundWins={state.p2RoundWins}
        />

        {/* Fighters */}
        <div className={styles.fightersRow}>
          <FighterCard
            name={p1Name}
            score={state.p1Score}
            side="p1"
            isMe={state.myRole === 'p1'}
          />
          <div className={styles.vsBadge}>VS</div>
          <FighterCard
            name={p2Name}
            score={state.p2Score}
            side="p2"
            isMe={state.myRole === 'p2'}
          />
        </div>

        {/* Power bar */}
        <PowerBar
          p1Score={state.p1Score}
          p2Score={state.p2Score}
          p1Name={p1Name}
          p2Name={p2Name}
        />

        {/* Chat */}
        <ChatArea
          messages={state.messages}
          myRole={state.myRole}
        />

        {/* Input */}
        <div className={styles.inputWrap}>
          <div className={styles.inputRow}>
            <input
              ref={inputRef}
              className={`${styles.battleInput} ${styles[state.myRole + 'Input']}`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={state.roundActive ? `Type your best shot...` : 'Round ended'}
              maxLength={200}
              disabled={!state.roundActive}
            />
            <button
              className={`${styles.sendBtn} ${styles[state.myRole]}`}
              onClick={sendMessage}
              disabled={!state.roundActive || !input.trim()}
            >
              SEND
            </button>
          </div>
          <div className={styles.charCount}>
            <span style={{ color: input.length > 180 ? 'var(--neon-red)' : 'var(--dim)' }}>
              {input.length}
            </span>/200
          </div>
        </div>

      </div>

      {/* Overlays */}
      <RoundOverlay
        p1Name={p1Name}
        p2Name={p2Name}
        p1Score={state.p1Score}
        p2Score={state.p2Score}
        p1RoundWins={state.p1RoundWins}
        p2RoundWins={state.p2RoundWins}
        roundActive={state.roundActive}
        matchOver={state.matchOver}
      />

      <MatchOverlay
        matchOver={state.matchOver}
        winner={state.matchWinner}
        myName={state.myName}
        p1Name={p1Name}
        p2Name={p2Name}
        p1Wins={state.p1RoundWins}
        p2Wins={state.p2RoundWins}
        onRematch={handleRematch}
        onLeave={handleLeave}
      />
    </div>
  )
}
