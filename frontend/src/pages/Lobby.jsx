import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import socket from '../socket'
import sfx from '../sfx'
import AvatarSelect from '../components/AvatarSelect'
import styles from './Lobby.module.css'

export default function Lobby() {
  const { state, dispatch } = useGame()
  const navigate = useNavigate()
  const [hostName, setHostName] = useState('')
  const [joinName, setJoinName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [mmName, setMmName] = useState('')
  const [tab, setTab] = useState('create')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (state.screen === 'battle') navigate('/battle')
  }, [state.screen])

  function unlock() { sfx.unlock() }

  function createRoom() {
    if (!hostName.trim()) { dispatch({ type: 'SET_STATUS', msg: 'ENTER YOUR FIGHTER NAME', stype: 'err' }); return }
    socket.emit('create_room', { name: hostName.trim(), avatar: state.myAvatar })
  }

  function joinRoom() {
    if (!joinName.trim()) { dispatch({ type: 'SET_STATUS', msg: 'ENTER YOUR FIGHTER NAME', stype: 'err' }); return }
    if (!joinCode.trim() || joinCode.trim().length < 4) { dispatch({ type: 'SET_STATUS', msg: 'ENTER A VALID 4-CHARACTER ROOM CODE', stype: 'err' }); return }
    socket.emit('join_room_req', { name: joinName.trim(), room_id: joinCode.trim().toUpperCase(), avatar: state.myAvatar })
  }

  function joinMatchmaking() {
    if (!mmName.trim()) { dispatch({ type: 'SET_STATUS', msg: 'ENTER YOUR FIGHTER NAME', stype: 'err' }); return }
    socket.emit('join_matchmaking', { name: mmName.trim(), avatar: state.myAvatar })
  }

  function cancelMatchmaking() {
    socket.emit('leave_matchmaking')
    dispatch({ type: 'SET_MATCHMAKING', value: false })
  }

  function copyCode() {
    navigator.clipboard.writeText(state.roomId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const isWaiting = state.roomId && state.myRole === 'p1' && state.screen === 'lobby'

  return (
    <div className={styles.page} onClick={unlock}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.logo}>KEY<span>BOARD</span> WARRIOR</h1>
          <p className={styles.tagline}>AI-JUDGED TRASH TALK TOURNAMENT</p>
          {!state.connected && <p className={styles.connecting}>⚡ CONNECTING TO SERVER...</p>}
        </header>

        {state.statusMsg && (
          <div className={`${styles.status} ${styles[state.statusType]}`}>{state.statusMsg}</div>
        )}

        <div className={styles.tabs}>
          {['create','join','matchmaking'].map(t => (
            <button key={t} className={`${styles.tab} ${tab===t?styles.tabActive:''}`} onClick={() => setTab(t)}>
              {t==='create'?'⚡ CREATE':t==='join'?'🔥 JOIN':'🎯 FIND'}
            </button>
          ))}
        </div>

        {/* CREATE */}
        {tab === 'create' && (
          <div className={`${styles.panel} ${styles.cyan}`}>
            {!isWaiting ? (
              <>
                <label className={styles.label}>YOUR FIGHTER NAME</label>
                <input className={styles.input} value={hostName} onChange={e=>setHostName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createRoom()} placeholder="e.g. ChadGPT" maxLength={20} disabled={!state.connected} />
                <AvatarSelect selected={state.myAvatar} onSelect={av => dispatch({ type: 'SET_AVATAR', avatar: av })} />
                <button className={`${styles.btn} ${styles.btnCyan}`} onClick={createRoom} disabled={!state.connected}>CREATE ROOM</button>
              </>
            ) : (
              <div className={styles.waitingPanel}>
                <p className={styles.label}>YOUR ROOM CODE</p>
                <div className={styles.codeBox}><span className={styles.codeVal}>{state.roomId}</span></div>
                <button className={styles.copyBtn} onClick={copyCode}>{copied?'✅ COPIED!':'📋 COPY CODE'}</button>
                <div className={styles.waitingDots}><span/><span/><span/></div>
                <p className={styles.waitingText}>WAITING FOR OPPONENT...</p>
                <p className={styles.hint}>Share this code with your friend</p>
              </div>
            )}
          </div>
        )}

        {/* JOIN */}
        {tab === 'join' && (
          <div className={`${styles.panel} ${styles.red}`}>
            <label className={styles.label}>YOUR FIGHTER NAME</label>
            <input className={styles.input} value={joinName} onChange={e=>setJoinName(e.target.value)} placeholder="e.g. KeyboardKing" maxLength={20} disabled={!state.connected} />
            <label className={styles.label}>ROOM CODE</label>
            <input className={`${styles.input} ${styles.codeInput}`} value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&joinRoom()} placeholder="A1B2" maxLength={4} disabled={!state.connected} />
            <AvatarSelect selected={state.myAvatar} onSelect={av => dispatch({ type: 'SET_AVATAR', avatar: av })} />
            <button className={`${styles.btn} ${styles.btnRed}`} onClick={joinRoom} disabled={!state.connected}>JOIN ROOM</button>
          </div>
        )}

        {/* MATCHMAKING */}
        {tab === 'matchmaking' && (
          <div className={`${styles.panel} ${styles.purple}`}>
            {!state.matchmaking ? (
              <>
                <label className={styles.label}>YOUR FIGHTER NAME</label>
                <input className={styles.input} value={mmName} onChange={e=>setMmName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&joinMatchmaking()} placeholder="e.g. TrashTalkGod" maxLength={20} disabled={!state.connected} />
                <AvatarSelect selected={state.myAvatar} onSelect={av => dispatch({ type: 'SET_AVATAR', avatar: av })} />
                <button className={`${styles.btn} ${styles.btnPurple}`} onClick={joinMatchmaking} disabled={!state.connected}>FIND OPPONENT</button>
                <p className={styles.hint}>Matched with a random player</p>
              </>
            ) : (
              <div className={styles.waitingPanel}>
                <div className={styles.searchAnim}>🎯</div>
                <p className={styles.waitingText}>SEARCHING FOR OPPONENT...</p>
                <div className={styles.waitingDots}><span/><span/><span/></div>
                <button className={`${styles.btn} ${styles.btnGhost}`} onClick={cancelMatchmaking}>CANCEL</button>
              </div>
            )}
          </div>
        )}

        <p className={styles.footer}>POWERED BY FLASK · SOCKET.IO · GROQ AI</p>
      </div>
    </div>
  )
}
