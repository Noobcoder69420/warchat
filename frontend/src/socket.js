import { io } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const socket = io(BACKEND_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,   // never give up
  reconnectionDelay: 500,           // fast first retry
  reconnectionDelayMax: 3000,       // cap at 3s
  timeout: 10000,
  transports: ['websocket', 'polling']  // polling fallback for mobile
})

// Reconnect when tab becomes visible again (phone unlock / tab switch back)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !socket.connected) {
      console.log('[socket] Tab visible, reconnecting...')
      socket.connect()
    }
  })
}

// Reconnect on network back online (airplane mode off, wifi reconnect)
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (!socket.connected) {
      console.log('[socket] Network online, reconnecting...')
      socket.connect()
    }
  })
}

export default socket
