import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import socket from '../socket'
import sfx from '../sfx'
import AvatarSelect from '../components/AvatarSelect'
import styles from './Lobby.module.css'

const AI_AGENTS = [
  { id: 'kairos', name: 'KAIROS', title: 'The Rage Monster',     avatar: 'rage',     color: '#ff4400', desc: 'Pure unfiltered rage. Goes full CAPS. Personal and brutal.' },
  { id: 'kira',   name: 'KIRA',   title: 'The Cold Genius',      avatar: 'genius',   color: '#00e5ff', desc: 'Surgical precision. Calm, calculated, and completely devastating.' },
  { id: 'jinx',   name: 'JINX',   title: 'The Unhinged Wildcard', avatar: 'wildcard', color: '#b388ff', desc: 'Chaotic and unpredictable. Funny AND genuinely savage.' },
]

export default function Lobby() {
  const { state, dispatch } = useGame()
  const navigate = useNavigate()
  const [hostName, setHostName] = useState('')
  const [joinName, setJoinName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [mmName, setMmName] = useState('')
  const [aiName, setAiName] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('kairos')
  const [tab, setTab] = useState('create')
  const [copied, setCopied] = useState(false)
  const [selectedMode, setSelectedMode] = useState('standard')
  const [bgOn, setBgOn] = useState(() => localStorage.getItem('kw_bg') !== 'off')

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

  const MODES = [
    { key: 'blitz',     label: '⚡ BLITZ',     desc: '20s · First to 2 rounds', color: '#f0c040' },
    { key: 'standard',  label: '⚔️ STANDARD',  desc: '45s · First to 3 rounds', color: '#00e5ff' },
    { key: 'big_brain', label: '🧠 BIG BRAIN', desc: '90s · First to 2 rounds', color: '#b388ff' },
  ]

  useEffect(() => {
    if (state.screen === 'battle') navigate('/battle')
  }, [state.screen])

  function unlock() { sfx.unlock() }

  function createRoom() {
    if (!hostName.trim()) { dispatch({ type: 'SET_STATUS', msg: 'ENTER YOUR FIGHTER NAME', stype: 'err' }); return }
    socket.emit('create_room', { name: hostName.trim(), avatar: state.myAvatar, mode: selectedMode })
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

  function joinAiBattle() {
    if (!aiName.trim()) { dispatch({ type: 'SET_STATUS', msg: 'ENTER YOUR FIGHTER NAME', stype: 'err' }); return }
    socket.emit('join_ai_battle', {
      name: aiName.trim(), avatar: state.myAvatar,
      agent_id: selectedAgent, mode: selectedMode,
    })
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
          <div className={styles.onlineBar}>
            <span className={styles.onlineDot} />
            <span className={styles.onlineCount}>
              {state.onlineCount} {state.onlineCount === 1 ? 'WARRIOR' : 'WARRIORS'} ONLINE
            </span>
            <button onClick={toggleBg} style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: `1px solid ${bgOn ? 'rgba(0,245,255,0.4)' : 'rgba(255,255,255,0.15)'}`,
              color: bgOn ? 'var(--neon-cyan)' : 'var(--dim)',
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: 9, letterSpacing: 1,
              padding: '3px 10px', cursor: 'pointer',
            }}>♪ {bgOn ? 'MUSIC ON' : 'MUSIC OFF'}</button>
          </div>
          {!state.connected && <p className={styles.connecting}>⚡ CONNECTING TO SERVER...</p>}
        </header>

        {state.statusMsg && (
          <div className={`${styles.status} ${styles[state.statusType]}`}>{state.statusMsg}</div>
        )}

        <div className={styles.tabs}>
          {['create','join','matchmaking','ai'].map(t => (
            <button key={t} className={`${styles.tab} ${tab===t?styles.tabActive:''}`} onClick={() => setTab(t)}>
              {t==='create'?'⚡ CREATE':t==='join'?'🔥 JOIN':t==='matchmaking'?'🎯 FIND':'🤖 VS AI'}
            </button>
          ))}
        </div>

        {tab === 'create' && (
          <div className={`${styles.panel} ${styles.cyan}`}>
            {!isWaiting ? (
              <>
                <label className={styles.label}>YOUR FIGHTER NAME</label>
                <input className={styles.input} value={hostName} onChange={e=>setHostName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createRoom()} placeholder="e.g. ChadGPT" maxLength={20} disabled={!state.connected} />
                <AvatarSelect selected={state.myAvatar} onSelect={av => dispatch({ type: 'SET_AVATAR', avatar: av })} />
                <label className={styles.label} style={{marginTop:8}}>CHOOSE MATCH MODE</label>
                <div style={{display:'flex', gap:8, marginBottom:8}}>
                  {MODES.map(m => (
                    <button key={m.key} onClick={() => setSelectedMode(m.key)} style={{
                      flex:1, padding:'10px 4px', cursor:'pointer',
                      background: selectedMode === m.key ? `${m.color}18` : 'transparent',
                      border: `1px solid ${selectedMode === m.key ? m.color : 'rgba(255,255,255,0.1)'}`,
                      color: selectedMode === m.key ? m.color : 'var(--dim)',
                      fontFamily:"'Share Tech Mono',monospace",
                      fontSize:10, letterSpacing:1, lineHeight:1.6,
                      transition:'all 0.15s', textAlign:'center'
                    }}>
                      <div style={{fontSize:14}}>{m.label.split(' ')[0]}</div>
                      <div style={{fontSize:9, marginTop:2}}>{m.label.split(' ').slice(1).join(' ')}</div>
                      <div style={{fontSize:8, color:'var(--dim)', marginTop:3}}>{m.desc}</div>
                    </button>
                  ))}
                </div>
                <button className={`${styles.btn} ${styles.btnCyan}`} onClick={createRoom} disabled={!state.connected}>CREATE ROOM</button>
              </>
            ) : (
              <div className={styles.waitingPanel}>
                <div style={{
                  fontFamily:"'Share Tech Mono',monospace", fontSize:10,
                  color: MODES.find(m=>m.key===selectedMode)?.color || 'var(--neon-cyan)',
                  border: `1px solid ${MODES.find(m=>m.key===selectedMode)?.color || 'var(--neon-cyan)'}`,
                  padding:'4px 12px', marginBottom:8, letterSpacing:2
                }}>
                  {MODES.find(m=>m.key===selectedMode)?.label} · {MODES.find(m=>m.key===selectedMode)?.desc}
                </div>
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

        {tab === 'matchmaking' && (
          <div className={`${styles.panel} ${styles.purple}`}>
            {!state.matchmaking ? (
              <>
                <label className={styles.label}>YOUR FIGHTER NAME</label>
                <input className={styles.input} value={mmName} onChange={e=>setMmName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&joinMatchmaking()} placeholder="e.g. TrashTalkGod" maxLength={20} disabled={!state.connected} />
                <AvatarSelect selected={state.myAvatar} onSelect={av => dispatch({ type: 'SET_AVATAR', avatar: av })} />
                <button className={`${styles.btn} ${styles.btnPurple}`} onClick={joinMatchmaking} disabled={!state.connected}>FIND OPPONENT</button>
                <p className={styles.hint}>⚔️ STANDARD mode · Matched with a random player</p>
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

        {tab === 'ai' && (
          <div className={`${styles.panel} ${styles.red}`}>
            <label className={styles.label}>YOUR FIGHTER NAME</label>
            <input
              className={styles.input}
              value={aiName}
              onChange={e => setAiName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && joinAiBattle()}
              placeholder="e.g. KeyboardKing"
              maxLength={20}
              disabled={!state.connected}
            />
            <AvatarSelect selected={state.myAvatar} onSelect={av => dispatch({ type: 'SET_AVATAR', avatar: av })} />

            <label className={styles.label} style={{ marginTop: 8 }}>CHOOSE YOUR OPPONENT</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              {AI_AGENTS.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    background: selectedAgent === agent.id ? `${agent.color}14` : 'transparent',
                    border: `1px solid ${selectedAgent === agent.id ? agent.color : 'rgba(255,255,255,0.08)'}`,
                    color: selectedAgent === agent.id ? agent.color : 'var(--dim)',
                    fontFamily: "'Share Tech Mono',monospace",
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, letterSpacing: 2, fontFamily: "'Black Ops One',cursive", color: selectedAgent === agent.id ? agent.color : 'var(--fg)' }}>
                      {agent.name}
                    </div>
                    <div style={{ fontSize: 8, letterSpacing: 1, color: 'var(--dim)', marginTop: 2 }}>{agent.title}</div>
                    <div style={{ fontSize: 9, marginTop: 4, color: selectedAgent === agent.id ? `${agent.color}cc` : 'rgba(255,255,255,0.3)' }}>{agent.desc}</div>
                  </div>
                  {selectedAgent === agent.id && (
                    <div style={{ fontSize: 16, flexShrink: 0 }}>◀</div>
                  )}
                </button>
              ))}
            </div>

            <label className={styles.label}>CHOOSE MATCH MODE</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {MODES.map(m => (
                <button key={m.key} onClick={() => setSelectedMode(m.key)} style={{
                  flex: 1, padding: '10px 4px', cursor: 'pointer',
                  background: selectedMode === m.key ? `${m.color}18` : 'transparent',
                  border: `1px solid ${selectedMode === m.key ? m.color : 'rgba(255,255,255,0.1)'}`,
                  color: selectedMode === m.key ? m.color : 'var(--dim)',
                  fontFamily: "'Share Tech Mono',monospace",
                  fontSize: 10, letterSpacing: 1, lineHeight: 1.6,
                  transition: 'all 0.15s', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 14 }}>{m.label.split(' ')[0]}</div>
                  <div style={{ fontSize: 9, marginTop: 2 }}>{m.label.split(' ').slice(1).join(' ')}</div>
                  <div style={{ fontSize: 8, color: 'var(--dim)', marginTop: 3 }}>{m.desc}</div>
                </button>
              ))}
            </div>

            <button className={`${styles.btn} ${styles.btnRed}`} onClick={joinAiBattle} disabled={!state.connected}>
              FIGHT AI
            </button>
            <p className={styles.hint}>No waiting. Instant battle. AI responds in real-time.</p>
          </div>
        )}

        <div className={styles.footer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span>POWERED BY FLASK · SOCKET.IO · GROQ AI</span>
          <a
            href="https://x.com/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--dim)',
              textDecoration: 'none',
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: 9,
              letterSpacing: 1,
              borderBottom: '1px solid rgba(255,255,255,0.15)',
              paddingBottom: 1,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--neon-cyan)'}
            onMouseLeave={e => e.target.style.color = 'var(--dim)'}
          >
            𝕏 @yourusername · report a bug
          </a>
        </div>
      </div>
    </div>
  )
}
