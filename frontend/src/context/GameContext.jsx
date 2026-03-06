import { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import socket from '../socket'

const GameContext = createContext(null)

const initialState = {
  // Connection
  connected: false,
  // Lobby
  screen: 'lobby', // lobby | battle | finished
  // Player info
  myName: '',
  myRole: '',   // p1 | p2
  roomId: '',
  // Opponent
  oppName: '',
  // Battle state
  round: 1,
  timer: 30,
  p1Score: 0,
  p2Score: 0,
  p1RoundWins: 0,
  p2RoundWins: 0,
  roundActive: false,
  matchOver: false,
  matchWinner: '',
  // Messages [{id, role, name, text, scores, scoring}]
  messages: [],
  // Status messages
  statusMsg: '',
  statusType: '', // ok | err | warn
  // Matchmaking
  matchmaking: false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CONNECTED': return { ...state, connected: action.value }
    case 'SET_STATUS': return { ...state, statusMsg: action.msg, statusType: action.stype || '' }
    case 'SET_MATCHMAKING': return { ...state, matchmaking: action.value }

    case 'ROOM_CREATED':
      return { ...state, myName: action.name, myRole: 'p1', roomId: action.room_id, statusMsg: '' }

    case 'ROOM_JOINED':
      return {
        ...state,
        myName: action.name,
        myRole: action.role,
        roomId: action.room_id,
        oppName: action.opponent_name,
        statusMsg: ''
      }

    case 'MATCHED':
      return {
        ...state,
        myRole: action.role,
        roomId: action.room_id,
        oppName: action.opponent_name,
        matchmaking: false
      }

    case 'OPPONENT_JOINED':
      return { ...state, oppName: action.opponent_name }

    case 'BATTLE_START':
      return {
        ...state,
        screen: 'battle',
        round: action.round,
        roundActive: true,
        timer: 30,
        p1Score: 0,
        p2Score: 0,
        p1RoundWins: 0,
        p2RoundWins: 0,
        messages: [],
        matchOver: false,
        matchWinner: '',
        ...(action.p1_name && state.myRole === 'p1' ? {} : {}),
      }

    case 'TIMER_TICK':
      return { ...state, timer: action.seconds }

    case 'NEW_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, {
          id: action.msg_id,
          role: action.role,
          name: action.name,
          text: action.text,
          scores: null,
          scoring: true
        }]
      }

    case 'SCORE_RESULT':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === action.msg_id
            ? { ...m, scores: action.scores, scoring: false }
            : m
        ),
        p1Score: action.role === 'p1' ? state.p1Score + action.scores.total : state.p1Score,
        p2Score: action.role === 'p2' ? state.p2Score + action.scores.total : state.p2Score,
      }

    case 'ROUND_END':
      return {
        ...state,
        roundActive: false,
        p1RoundWins: action.p1_round_wins,
        p2RoundWins: action.p2_round_wins,
      }

    case 'ROUND_START':
      return {
        ...state,
        round: action.round,
        roundActive: true,
        timer: 30,
        p1Score: 0,
        p2Score: 0,
        p1RoundWins: action.p1_round_wins,
        p2RoundWins: action.p2_round_wins,
        messages: [...state.messages, {
          id: 'sys-' + action.round,
          role: 'system',
          name: 'SYSTEM',
          text: `⚔️ ROUND ${action.round} — FIGHT!`,
          scores: null,
          scoring: false
        }]
      }

    case 'MATCH_END':
      return {
        ...state,
        matchOver: true,
        matchWinner: action.winner,
        roundActive: false,
        screen: 'finished'
      }

    case 'SYSTEM_MSG':
      return {
        ...state,
        messages: [...state.messages, {
          id: 'sys-' + Date.now(),
          role: 'system',
          name: 'SYSTEM',
          text: action.text,
          scores: null,
          scoring: false
        }]
      }

    case 'RESET':
      return { ...initialState, connected: state.connected }

    default: return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    socket.connect()

    socket.on('connect', () => dispatch({ type: 'SET_CONNECTED', value: true }))
    socket.on('disconnect', () => dispatch({ type: 'SET_CONNECTED', value: false }))

    socket.on('room_created', (data) => {
      dispatch({ type: 'ROOM_CREATED', ...data })
    })

    socket.on('join_error', (data) => {
      dispatch({ type: 'SET_STATUS', msg: data.message, stype: 'err' })
    })

    socket.on('room_joined', (data) => {
      dispatch({ type: 'ROOM_JOINED', ...data })
    })

    socket.on('opponent_joined', (data) => {
      dispatch({ type: 'OPPONENT_JOINED', ...data })
    })

    socket.on('matched', (data) => {
      dispatch({ type: 'MATCHED', ...data })
    })

    socket.on('matchmaking_waiting', () => {
      dispatch({ type: 'SET_MATCHMAKING', value: true })
    })

    socket.on('matchmaking_cancelled', () => {
      dispatch({ type: 'SET_MATCHMAKING', value: false })
    })

    socket.on('battle_start', (data) => {
      dispatch({ type: 'BATTLE_START', ...data })
    })

    socket.on('timer_tick', (data) => {
      dispatch({ type: 'TIMER_TICK', seconds: data.seconds })
    })

    socket.on('new_message', (data) => {
      dispatch({ type: 'NEW_MESSAGE', ...data })
    })

    socket.on('score_result', (data) => {
      dispatch({ type: 'SCORE_RESULT', ...data })
    })

    socket.on('round_end', (data) => {
      dispatch({ type: 'ROUND_END', ...data })
    })

    socket.on('round_start', (data) => {
      dispatch({ type: 'ROUND_START', ...data })
    })

    socket.on('match_end', (data) => {
      dispatch({ type: 'MATCH_END', ...data })
    })

    socket.on('player_disconnected', (data) => {
      dispatch({ type: 'SYSTEM_MSG', text: `⚠️ ${data.message}` })
    })

    socket.on('rematch_requested', () => {
      dispatch({ type: 'SYSTEM_MSG', text: '🔄 OPPONENT WANTS A REMATCH...' })
    })

    return () => socket.removeAllListeners()
  }, [])

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  return useContext(GameContext)
}
