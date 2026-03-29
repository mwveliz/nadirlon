import { create } from 'zustand';

export interface Message {
  id: string;
  pubkey: string; // sender
  content: string; // decrypted content
  created_at: number;
  kind: number;
}

export interface Conversation {
  pubkey: string;
  messages: Message[];
  lastMessageAt: number;
}

interface AppState {
  privateKey: Uint8Array | null;
  publicKey: string | null;
  relays: { url: string; connected: boolean }[];
  conversations: Record<string, Conversation>;
  profiles: Record<string, any>;
  setKeys: (privateKey: Uint8Array, publicKey: string) => void;
  clearKeys: () => void;
  addRelay: (url: string) => void;
  removeRelay: (url: string) => void;
  updateRelayStatus: (url: string, connected: boolean) => void;
  addMessage: (peerPubkey: string, message: Message) => void;
  addProfile: (pubkey: string, profile: any) => void;
}

export const useAppStore = create<AppState>((set) => ({
  privateKey: null,
  publicKey: null,
  relays: [
    { url: 'wss://nadirlon.onrender.com', connected: false },
  ],
  conversations: {},
  profiles: {},
  setKeys: (privateKey, publicKey) => set({ privateKey, publicKey }),
  clearKeys: () => set({ privateKey: null, publicKey: null, conversations: {}, profiles: {} }),
  addRelay: (url) => set((state) => ({ relays: [...state.relays, { url, connected: false }] })),
  removeRelay: (url) => set((state) => ({ relays: state.relays.filter((r) => r.url !== url) })),
  updateRelayStatus: (url, connected) =>
    set((state) => ({
      relays: state.relays.map((r) => (r.url === url ? { ...r, connected } : r)),
    })),
  addMessage: (peerPubkey, message) =>
    set((state) => {
      const conv = state.conversations[peerPubkey] || {
        pubkey: peerPubkey,
        messages: [],
        lastMessageAt: 0,
      };

      // Prevent duplicates
      if (conv.messages.some((m) => m.id === message.id)) return state;

      const newMessages = [...conv.messages, message].sort((a, b) => a.created_at - b.created_at);
      return {
        conversations: {
          ...state.conversations,
          [peerPubkey]: {
            ...conv,
            messages: newMessages,
            lastMessageAt: Math.max(conv.lastMessageAt, message.created_at),
          },
        },
      };
    }),
  addProfile: (pubkey, profile) =>
    set((state) => ({
      profiles: { ...state.profiles, [pubkey]: profile }
    })),
}));
