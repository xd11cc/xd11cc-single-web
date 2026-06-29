import { useWebSocket } from '@@/composables/useWebSocket'
import { useUserStore } from '@/pinia/stores/user'
import { onlineUserList } from '@/views/system/onlineUser/apis'

export interface ChatMessage {
  id: string
  senderId: number
  senderName: string
  text: string
  timestamp: number
  isSelf: boolean
}

export interface ChatContact {
  userId: number
  username: string
  unread: number
  lastMessage?: string
  lastTime?: number
}

const panelVisible = ref(false)
const activeContactId = ref<number | null>(null)
const contacts = ref<ChatContact[]>([])
const messagesMap = reactive<Record<number, ChatMessage[]>>({})

const totalUnread = computed(() => contacts.value.reduce((sum, c) => sum + c.unread, 0))

let initialized = false

export function useChat() {
  const { sendMessage, on, off } = useWebSocket()
  const userStore = useUserStore()

  function init() {
    if (initialized) return
    initialized = true
    on('BUSINESS', handleBusinessMessage)
  }

  function destroy() {
    if (!initialized) return
    initialized = false
    off('BUSINESS', handleBusinessMessage)
  }

  function handleBusinessMessage(data: any) {
    if (!data?.content) return
    try {
      const payload = JSON.parse(data.content)
      if (payload.type !== 'CHAT') return

      const { senderId, senderName, text, timestamp } = payload
      if (!senderId || senderId === userStore.userId) return

      const msg: ChatMessage = {
        id: `${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
        senderId,
        senderName,
        text,
        timestamp,
        isSelf: false,
      }

      if (!messagesMap[senderId]) {
        messagesMap[senderId] = []
      }
      messagesMap[senderId].push(msg)

      let contact = contacts.value.find((c) => c.userId === senderId)
      if (!contact) {
        contact = { userId: senderId, username: senderName, unread: 0 }
        contacts.value.unshift(contact)
      }
      contact.lastMessage = text
      contact.lastTime = timestamp

      if (activeContactId.value !== senderId || !panelVisible.value) {
        contact.unread++
      }

      moveContactToTop(senderId)
    } catch {
      // not a chat message
    }
  }

  function send(targetUserId: number, text: string) {
    const timestamp = Date.now()
    const content = JSON.stringify({
      type: 'CHAT',
      senderId: userStore.userId,
      senderName: userStore.username,
      text,
      timestamp,
    })

    const success = sendMessage({
      webSocketEnum: 'USER',
      userId: targetUserId,
      content,
    })

    if (success) {
      const msg: ChatMessage = {
        id: `${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
        senderId: userStore.userId,
        senderName: userStore.username,
        text,
        timestamp,
        isSelf: true,
      }

      if (!messagesMap[targetUserId]) {
        messagesMap[targetUserId] = []
      }
      messagesMap[targetUserId].push(msg)

      const contact = contacts.value.find((c) => c.userId === targetUserId)
      if (contact) {
        contact.lastMessage = text
        contact.lastTime = timestamp
        moveContactToTop(targetUserId)
      }
    }

    return success
  }

  function markAsRead(userId: number) {
    const contact = contacts.value.find((c) => c.userId === userId)
    if (contact) {
      contact.unread = 0
    }
  }

  function setActiveContact(userId: number | null) {
    activeContactId.value = userId
    if (userId !== null) {
      markAsRead(userId)
    }
  }

  function openChat(userId: number, username: string) {
    panelVisible.value = true
    let contact = contacts.value.find((c) => c.userId === userId)
    if (!contact) {
      contact = { userId, username, unread: 0 }
      contacts.value.unshift(contact)
    }
    setActiveContact(userId)
  }

  async function refreshOnlineUsers() {
    try {
      const { data } = await onlineUserList()
      const onlineIds = new Set(data.map((u) => u.userId))
      data.forEach((user) => {
        if (user.userId === userStore.userId) return
        const existing = contacts.value.find((c) => c.userId === user.userId)
        if (!existing) {
          contacts.value.push({
            userId: user.userId!,
            username: user.username!,
            unread: 0,
          })
        }
      })
      contacts.value = contacts.value.filter(
        (c) => onlineIds.has(c.userId) || (messagesMap[c.userId] && messagesMap[c.userId].length > 0),
      )
    } catch {
      // silent
    }
  }

  function moveContactToTop(userId: number) {
    const idx = contacts.value.findIndex((c) => c.userId === userId)
    if (idx > 0) {
      const [contact] = contacts.value.splice(idx, 1)
      contacts.value.unshift(contact)
    }
  }

  function getMessages(userId: number): ChatMessage[] {
    return messagesMap[userId] || []
  }

  return {
    panelVisible,
    activeContactId,
    contacts,
    totalUnread,
    init,
    destroy,
    send,
    markAsRead,
    setActiveContact,
    openChat,
    refreshOnlineUsers,
    getMessages,
  }
}
