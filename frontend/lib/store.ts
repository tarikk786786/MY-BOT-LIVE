import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Auth Store ────────────────────────────────────────────────────────────
interface AuthUser {
  id: string;
  username: string;
  role?: string;
}

interface AuthStore {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    { name: 'auth-store' }
  )
);

// ── WhatsApp Store ────────────────────────────────────────────────────────
interface WAStatus {
  connected: boolean;
  qr: string | null;
  phone: string | null;
  battery?: number;
  lastSeen?: string;
}

interface WAStore {
  status: WAStatus;
  setStatus: (status: Partial<WAStatus>) => void;
}

export const useWAStore = create<WAStore>()((set) => ({
  status: { connected: false, qr: null, phone: null },
  setStatus: (status) =>
    set((s) => ({ status: { ...s.status, ...status } })),
}));

// ── Chat Store ────────────────────────────────────────────────────────────
interface Message {
  id: string;
  body: string;
  fromMe: boolean;
  timestamp: number;
  type: string;
  hasMedia?: boolean;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  unreadCount?: number;
  lastMessage?: string;
  lastTimestamp?: number;
  mood?: string;
}

interface ChatStore {
  selectedContact: Contact | null;
  messages: Record<string, Message[]>;
  typingContacts: Set<string>;
  setSelectedContact: (contact: Contact | null) => void;
  addMessage: (contactId: string, message: Message) => void;
  setMessages: (contactId: string, messages: Message[]) => void;
  setTyping: (contactId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatStore>()((set) => ({
  selectedContact: null,
  messages: {},
  typingContacts: new Set(),
  setSelectedContact: (contact) => set({ selectedContact: contact }),
  addMessage: (contactId, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [contactId]: [...(s.messages[contactId] || []), message],
      },
    })),
  setMessages: (contactId, messages) =>
    set((s) => ({
      messages: { ...s.messages, [contactId]: messages },
    })),
  setTyping: (contactId, isTyping) =>
    set((s) => {
      const next = new Set(s.typingContacts);
      isTyping ? next.add(contactId) : next.delete(contactId);
      return { typingContacts: next };
    }),
}));

// ── UI Store ──────────────────────────────────────────────────────────────
interface UIStore {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
