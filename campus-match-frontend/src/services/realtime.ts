import { io, type Socket } from 'socket.io-client'

import { API_ORIGIN, getStoredToken } from './api'

interface ChatUpdatedPayload {
  connectionId: number
  conversationId: number | null
  targetUserIds: number[]
}

type ChatUpdatedListener = (payload: ChatUpdatedPayload) => void

let socket: Socket | null = null
const listeners = new Set<ChatUpdatedListener>()

function ensureSocket() {
  const token = getStoredToken()
  if (!token) return null

  if (socket) {
    if (!socket.connected) socket.connect()
    return socket
  }

  socket = io(API_ORIGIN, {
    transports: ['websocket'],
    autoConnect: true,
    auth: {
      token,
    },
  })

  socket.on('chat:updated', payload => {
    listeners.forEach(listener => listener(payload as ChatUpdatedPayload))
  })

  return socket
}

export function connectRealtime() {
  return ensureSocket()
}

export function disconnectRealtimeIfIdle() {
  if (listeners.size === 0 && socket) {
    socket.disconnect()
    socket = null
  }
}

export function subscribeChatUpdates(listener: ChatUpdatedListener) {
  const activeSocket = ensureSocket()
  if (!activeSocket) {
    return () => {}
  }

  listeners.add(listener)

  return () => {
    listeners.delete(listener)
    disconnectRealtimeIfIdle()
  }
}
