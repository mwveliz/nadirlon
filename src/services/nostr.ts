import 'react-native-get-random-values';
import { generateSecretKey, getPublicKey, finalizeEvent, nip44, SimplePool, Filter } from 'nostr-tools';
import { useAppStore } from '../stores/useAppStore';

const pool = new SimplePool();

export const nostrService = {
  generateKeys: () => {
    const sk = generateSecretKey();
    const pk = getPublicKey(sk);
    return { sk, pk };
  },

  getPublicKey: (sk: Uint8Array) => {
    return getPublicKey(sk);
  },

  encryptDM: (senderSk: Uint8Array, receiverPk: string, text: string) => {
    const conversationKey = nip44.getConversationKey(senderSk, receiverPk);
    return nip44.encrypt(text, conversationKey);
  },

  decryptDM: (receiverSk: Uint8Array, senderPk: string, ciphertext: string) => {
    try {
      const conversationKey = nip44.getConversationKey(receiverSk, senderPk);
      return nip44.decrypt(ciphertext, conversationKey);
    } catch (e) {
      console.warn('Failed to decrypt DM', e);
      return '[Message decryption failed]';
    }
  },

  publishMessage: async (senderSk: Uint8Array, receiverPk: string, text: string, relays: string[]) => {
    const encryptedText = nostrService.encryptDM(senderSk, receiverPk, text);
    
    // Using kind 4 for simplified MVP DM
    const template = {
      kind: 4,
      tags: [['p', receiverPk]],
      content: encryptedText,
      created_at: Math.floor(Date.now() / 1000),
    };
    
    const event = finalizeEvent(template, senderSk);
    
    const pubs = pool.publish(relays, event);
    return Promise.all(pubs);
  },

  subscribeDMs: (sk: Uint8Array, pk: string, relays: string[]) => {
    const filter: Filter = {
      kinds: [4],
      '#p': [pk], // messages to me
    };
    const filterFromMe: Filter = {
      kinds: [4],
      authors: [pk], // messages from me
    };
    
    const sub = pool.subscribeMany(relays, [filter, filterFromMe] as any, {
      onevent(event) {
        // Is it to me or from me?
        const isFromMe = event.pubkey === pk;
        const peerPubkey = isFromMe ? event.tags.find((t) => t[0] === 'p')?.[1] : event.pubkey;
        
        if (!peerPubkey) return;

        const decrypted = nostrService.decryptDM(
          sk,
          isFromMe ? peerPubkey : event.pubkey,
          event.content
        );

        useAppStore.getState().addMessage(peerPubkey, {
          id: event.id,
          pubkey: event.pubkey,
          content: decrypted,
          created_at: event.created_at,
          kind: event.kind,
        });
      },
    });
    
    return sub;
  },

  publishProfile: async (sk: Uint8Array, nickname: string, relays: string[]) => {
    const template = {
      kind: 0,
      tags: [],
      content: JSON.stringify({ name: nickname }),
      created_at: Math.floor(Date.now() / 1000),
    };
    const event = finalizeEvent(template, sk);
    return Promise.all(pool.publish(relays, event));
  },

  subscribeProfiles: (pubkeys: string[], relays: string[]) => {
    if (!pubkeys.length || !relays.length) return { close: () => {} };
    const filter: Filter = { kinds: [0], authors: pubkeys };
    const sub = pool.subscribeMany(relays, [filter] as any, {
      onevent(event) {
        try {
          const profile = JSON.parse(event.content);
          useAppStore.getState().addProfile(event.pubkey, profile);
        } catch (e) {}
      }
    });
    return sub;
  },

  closePool: () => {
    pool.close(useAppStore.getState().relays.map(r => r.url));
  }
};
