import { createContext, useContext, useReducer, useEffect } from 'react'
import socket from '../socket'
import sfx from '../sfx'

const GameContext = createContext(null)

const initialState = {
  connected: false,
  onlineCount: 0,
  screen: 'lobby',
  myName: '', myRole: '', roomId: '',
  oppName: '',
  myAvatar: 'rage', oppAvatar: 'skull',
  mode: 'standard', modeLabel: '⚔️ STANDARD', roundTime: 45, roundsToWin: 3,
  round: 1, timer: 45,
  p1Score: 0, p2Score: 0,
  p1RoundWins: 0, p2RoundWins: 0,
  roundActive: false,
  showCountdown: false,
  matchOver: false, matchWinner: '', matchWinnerRole: '',
  messages: [],
  statusMsg: '', statusType: '',
  matchmaking: false,
  lastHit: null,
  oppDisconnected: false,
  oppReconnecting: false,
}

function reducer(state, action) {
  switch (action.type) {

    case 'SET_CONNECTED':    return { ...state, connected: action.value }
    case 'SET_ONLINE_COUNT': return { ...state, onlineCount: action.count }
    case 'SET_STATUS':       return { ...state, statusMsg: action.msg, statusType: action.stype || '' }
    case 'SET_MATCHMAKING':  return { ...state, matchmaking: action.value }
    case 'SET_AVATAR':       return { ...state, myAvatar: action.avatar }

    case 'ROOM_CREATED':
      return { ...state, myName: action.name, myRole: 'p1', roomId: action.room_id,
               mode: action.mode || 'standard', modeLabel: action.mode_label || '⚔️ STANDARD',
               roundTime: action.round_time || 45, roundsToWin: action.rounds_to_win || 3,
               timer: action.round_time || 45, statusMsg: '' }

    case 'ROOM_JOINED':
      return { ...state, myName: action.name, myRole: action.role, roomId: action.room_id,
               oppName: action.opponent_name, oppAvatar: action.opponent_avatar || 'skull',
               mode: action.mode || 'standard', modeLabel: action.mode_label || '⚔️ STANDARD',
               roundTime: action.round_time || 45, roundsToWin: action.rounds_to_win || 3,
               timer: action.round_time || 45, statusMsg: '' }

    case 'MATCHED':
      return { ...state, myRole: action.role, roomId: action.room_id,
               oppName: action.opponent_name, oppAvatar: action.opponent_avatar || 'skull',
               mode: action.mode || 'standard', modeLabel: action.mode_label || '⚔️ STANDARD',
               roundTime: action.round_time || 45, roundsToWin: action.rounds_to_win || 3,
               timer: action.round_time || 45, matchmaking: false }

    case 'OPPONENT_JOINED':
      return { ...state, oppName: action.opponent_name, oppAvatar: action.opponent_avatar || 'skull' }

    case 'BATTLE_START':
      return {
        ...state, screen: 'battle',
        round: action.round, roundActive: false,
        showCountdown: true,
        mode: action.mode || state.mode,
        modeLabel: action.mode_label || state.modeLabel,
        roundTime: action.round_time || state.roundTime,
        timer: action.round_time || state.roundTime,
        p1Score: 0, p2Score: 0,
        p1RoundWins: 0, p2RoundWins: 0,
        messages: [], matchOver: false, matchWinner: '', matchWinnerRole: '',
        lastHit: null, oppDisconnected: false, oppReconnecting: false,
      }

    case 'COUNTDOWN_DONE':
      return { ...state, showCountdown: false, roundActive: true }

    case 'TIMER_TICK':
      return { ...state, timer: action.seconds }

    case 'NEW_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, {
          id: action.msg_id, role: action.role,
          name: action.name, text: action.text,
          avatar: action.avatar || (action.role === state.myRole ? state.myAvatar : state.oppAvatar),
          scores: null, scoring: true
        }]
      }

    case 'SCORE_RESULT':
      return {
        ...state,
        lastHit: { role: action.role, total: action.scores.total },
        messages: state.messages.map(m =>
          m.id === action.msg_id ? { ...m, scores: action.scores, scoring: false } : m
        ),
        p1Score: action.role === 'p1' ? state.p1Score + action.scores.total : state.p1Score,
        p2Score: action.role === 'p2' ? state.p2Score + action.scores.total : state.p2Score,
      }

    case 'ROUND_END':
      return { ...state, roundActive: false, p1RoundWins: action.p1_round_wins, p2RoundWins: action.p2_round_wins }

    case 'ROUND_START':
      return {
        ...state, round: action.round,
        roundActive: false, showCountdown: true,
        timer: action.round_time || state.roundTime,
        p1Score: 0, p2Score: 0,
        p1RoundWins: action.p1_round_wins,
        p2RoundWins: action.p2_round_wins,
        lastHit: null,
        messages: [...state.messages, {
          id: 'sys-r' + action.round + '-' + Date.now(),
          role: 'system', name: 'SYSTEM',
          text: `⚔️ ROUND ${action.round} — GET READY!`,
          scores: null, scoring: false
        }]
      }

    case 'MATCH_END':
      return { ...state, matchOver: true, matchWinner: action.winner, matchWinnerRole: action.winner_role, roundActive: false, screen: 'finished' }

    case 'OPP_DISCONNECTED':
      return { ...state, oppDisconnected: true, roundActive: false, oppReconnecting: false }

    case 'SET_OPP_RECONNECTING':
      return { ...state, oppDisconnected: false, oppReconnecting: true }

    case 'OPP_RECONNECTED':
      return { ...state, oppReconnecting: false, oppDisconnected: false }

    case 'REJOIN_SUCCESS':
      return {
        ...state,
        screen: 'battle',
        roomId: action.room_id,
        myRole: action.role,
        myName: action.name,
        myAvatar: action.avatar || state.myAvatar,
        oppName: action.role === 'p1' ? action.p2_name : action.p1_name,
        oppAvatar: action.role === 'p1' ? action.p2_avatar : action.p1_avatar,
        round: action.round,
        roundActive: action.round_active,
        showCountdown: false,
        p1Score: action.p1_score,
        p2Score: action.p2_score,
        p1RoundWins: action.p1_round_wins,
        p2RoundWins: action.p2_round_wins,
        oppDisconnected: false,
        oppReconnecting: false,
        messages: [...state.messages, {
          id: 'sys-rejoin-' + Date.now(), role: 'system', name: 'SYSTEM',
          text: "📶 RECONNECTED — YOU'RE BACK IN THE FIGHT!",
          scores: null, scoring: false
        }]
      }

    case 'SYSTEM_MSG': {
      const last = state.messages[state.messages.length - 1]
      if (last && last.role === 'system' && last.text === action.text) return state
      return {
        ...state,
        messages: [...state.messages, {
          id: 'sys-' + Date.now() + '-' + Math.random(),
          role: 'system', name: 'SYSTEM',
          text: action.text, scores: null, scoring: false
        }]
      }
    }

    case 'RESET':
      return {
        ...initialState,
        connected: state.connected,
        onlineCount: state.onlineCount,
        myAvatar: state.myAvatar,
      }

    default: return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    socket.connect()

    const onConnect = () => {
      dispatch({ type: 'SET_CONNECTED', value: true })
      const saved = sessionStorage.getItem('kw_session')
      if (saved) {
        try {
          const { roomId, role } = JSON.parse(saved)
          if (roomId && role) socket.emit('rejoin_room', { room_id: roomId, role })
        } catch (e) { sessionStorage.removeItem('kw_session') }
      }
    }

    socket.on('connect',    onConnect)
    socket.on('disconnect', () => dispatch({ type: 'SET_CONNECTED', value: false }))
    socket.on('online_count', d => dispatch({ type: 'SET_ONLINE_COUNT', count: d.count }))

    socket.on('room_created', d => {
      sessionStorage.setItem('kw_session', JSON.stringify({ roomId: d.room_id, role: 'p1' }))
      dispatch({ type: 'ROOM_CREATED', ...d })
    })
    socket.on('join_error',   d => dispatch({ type: 'SET_STATUS', msg: d.message, stype: 'err' }))
    socket.on('room_joined',  d => {
      sessionStorage.setItem('kw_session', JSON.stringify({ roomId: d.room_id, role: d.role }))
      dispatch({ type: 'ROOM_JOINED', ...d })
    })
    socket.on('opponent_joined',    d => dispatch({ type: 'OPPONENT_JOINED', ...d }))
    socket.on('matched', d => {
      sessionStorage.setItem('kw_session', JSON.stringify({ roomId: d.room_id, role: d.role }))
      dispatch({ type: 'MATCHED', ...d })
    })
    socket.on('matchmaking_waiting',   () => dispatch({ type: 'SET_MATCHMAKING', value: true }))
    socket.on('matchmaking_cancelled', () => dispatch({ type: 'SET_MATCHMAKING', value: false }))

    socket.on('battle_start', d => dispatch({ type: 'BATTLE_START', ...d }))
    socket.on('timer_tick',   d => {
      dispatch({ type: 'TIMER_TICK', seconds: d.seconds })
      if (d.seconds <= 5 && d.seconds > 0) sfx.tick()
    })
    socket.on('new_message',  d => { dispatch({ type: 'NEW_MESSAGE', ...d }); sfx.messageSent() })
    socket.on('score_result', d => dispatch({ type: 'SCORE_RESULT', ...d }))
    socket.on('round_end',    d => { dispatch({ type: 'ROUND_END', ...d }); sfx.roundEnd() })
    socket.on('round_start',  d => dispatch({ type: 'ROUND_START', ...d }))
    socket.on('match_end',    d => {
      sessionStorage.removeItem('kw_session')
      dispatch({ type: 'MATCH_END', ...d })
    })

    socket.on('player_disconnected', d => {
      dispatch({ type: 'OPP_DISCONNECTED' })
      dispatch({ type: 'SYSTEM_MSG', text: `⚠️ ${d.message}` })
    })
    socket.on('opp_reconnecting', d => {
      dispatch({ type: 'SET_OPP_RECONNECTING' })
      dispatch({ type: 'SYSTEM_MSG', text: `📶 ${d.message}` })
    })
    socket.on('opp_reconnected', d => {
      dispatch({ type: 'OPP_RECONNECTED' })
      dispatch({ type: 'SYSTEM_MSG', text: `✅ ${d.message}` })
    })
    socket.on('rejoin_success', d => dispatch({ type: 'REJOIN_SUCCESS', ...d }))
    socket.on('rejoin_failed',  () => {
      sessionStorage.removeItem('kw_session')
      dispatch({ type: 'RESET' })
    })
    socket.on('rematch_requested', () => dispatch({ type: 'SYSTEM_MSG', text: '🔄 OPPONENT WANTS A REMATCH...' }))

    return () => socket.removeAllListeners()
  }, [])

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() { return useContext(GameContext) }
