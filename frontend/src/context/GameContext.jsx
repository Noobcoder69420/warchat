import { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import socket from '../socket'
import sfx from '../sfx'

const GameContext = createContext(null)

const initialState = {
  connected: false,
  screen: 'lobby',
  myName: '', myRole: '', roomId: '',
  oppName: '',
  myAvatar: 'rage', oppAvatar: 'skull',
  round: 1, timer: 30,
  p1Score: 0, p2Score: 0,
  p1RoundWins: 0, p2RoundWins: 0,
  roundActive: false,
  showCountdown: false,
  matchOver: false, matchWinner: '',
  messages: [],
  statusMsg: '', statusType: '',
  matchmaking: false,
  lastHit: null, // { role, total } for powerbar flash
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CONNECTED':    return { ...state, connected: action.value }
    case 'SET_STATUS':       return { ...state, statusMsg: action.msg, statusType: action.stype || '' }
    case 'SET_MATCHMAKING':  return { ...state, matchmaking: action.value }
    case 'SET_AVATAR':       return { ...state, myAvatar: action.avatar }

    case 'ROOM_CREATED':
      return { ...state, myName: action.name, myRole: 'p1', roomId: action.room_id, statusMsg: '' }

    case 'ROOM_JOINED':
      return { ...state, myName: action.name, myRole: action.role, roomId: action.room_id, oppName: action.opponent_name, statusMsg: '' }

    case 'MATCHED':
      return { ...state, myRole: action.role, roomId: action.room_id, oppName: action.opponent_name, matchmaking: false }

    case 'OPPONENT_JOINED':
      return { ...state, oppName: action.opponent_name }

    case 'BATTLE_START':
      return {
        ...state, screen: 'battle',
        round: action.round, roundActive: false,
        showCountdown: true,
        timer: 30, p1Score: 0, p2Score: 0,
        p1RoundWins: 0, p2RoundWins: 0,
        messages: [], matchOver: false, matchWinner: '',
        lastHit: null
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
          avatar: action.role === (state.myRole) ? state.myAvatar : state.oppAvatar,
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
        timer: 30, p1Score: 0, p2Score: 0,
        p1RoundWins: action.p1_round_wins,
        p2RoundWins: action.p2_round_wins,
        lastHit: null,
        messages: [...state.messages, {
          id: 'sys-' + action.round, role: 'system', name: 'SYSTEM',
          text: `⚔️ ROUND ${action.round} — GET READY!`,
          scores: null, scoring: false
        }]
      }

    case 'MATCH_END':
      return { ...state, matchOver: true, matchWinner: action.winner, roundActive: false, screen: 'finished' }

    case 'SYSTEM_MSG':
      return {
        ...state,
        messages: [...state.messages, {
          id: 'sys-' + Date.now(), role: 'system', name: 'SYSTEM',
          text: action.text, scores: null, scoring: false
        }]
      }

    case 'RESET':
      return { ...initialState, connected: state.connected }

    default: return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    socket.connect()

    socket.on('connect',    () => dispatch({ type: 'SET_CONNECTED', value: true }))
    socket.on('disconnect', () => dispatch({ type: 'SET_CONNECTED', value: false }))
    socket.on('room_created',       d => dispatch({ type: 'ROOM_CREATED', ...d }))
    socket.on('join_error',         d => dispatch({ type: 'SET_STATUS', msg: d.message, stype: 'err' }))
    socket.on('room_joined',        d => dispatch({ type: 'ROOM_JOINED', ...d }))
    socket.on('opponent_joined',    d => dispatch({ type: 'OPPONENT_JOINED', ...d }))
    socket.on('matched',            d => dispatch({ type: 'MATCHED', ...d }))
    socket.on('matchmaking_waiting',() => dispatch({ type: 'SET_MATCHMAKING', value: true }))
    socket.on('matchmaking_cancelled',() => dispatch({ type: 'SET_MATCHMAKING', value: false }))
    socket.on('battle_start',       d => dispatch({ type: 'BATTLE_START', ...d }))
    socket.on('timer_tick',         d => { dispatch({ type: 'TIMER_TICK', seconds: d.seconds }); if (d.seconds <= 5 && d.seconds > 0) sfx.tick() })
    socket.on('new_message',        d => { dispatch({ type: 'NEW_MESSAGE', ...d }); sfx.messageSent() })
    socket.on('score_result',       d => dispatch({ type: 'SCORE_RESULT', ...d }))
    socket.on('round_end',          d => { dispatch({ type: 'ROUND_END', ...d }); sfx.roundEnd() })
    socket.on('round_start',        d => dispatch({ type: 'ROUND_START', ...d }))
    socket.on('match_end',          d => dispatch({ type: 'MATCH_END', ...d }))
    socket.on('player_disconnected',d => dispatch({ type: 'SYSTEM_MSG', text: `⚠️ ${d.message}` }))
    socket.on('rematch_requested',  () => dispatch({ type: 'SYSTEM_MSG', text: '🔄 OPPONENT WANTS A REMATCH...' }))

    return () => socket.removeAllListeners()
  }, [])

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() { return useContext(GameContext) }
