import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useAppStore } from '../stores/useAppStore';
import { theme } from '../constants/theme';
import { nostrService } from '../services/nostr';
import { notifyNtfy } from '../services/notifications';
import { Send } from 'lucide-react-native';
import { nip19 } from 'nostr-tools';

export default function ChatDetailScreen({ route, navigation }: any) {
  const { peerPubkey } = route.params;
  const { privateKey, publicKey, relays, conversations, profiles } = useAppStore();
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  React.useLayoutEffect(() => {
    const profile = profiles[peerPubkey];
    const npub = nip19.npubEncode(peerPubkey);
    const displayName = profile?.name || npub.slice(0, 16) + '...';
    
    navigation.setOptions({
      title: displayName,
    });
  }, [navigation, peerPubkey, profiles]);

  const conversation = conversations[peerPubkey] || { messages: [] };
  const messages = conversation.messages;

  const handleSend = async () => {
    if (!text.trim() || !privateKey) return;

    const messageText = text.trim();
    setText(''); // Optimistic UI clear
    
    try {
      const relayUrls = relays.map(r => r.url);
      await nostrService.publishMessage(privateKey, peerPubkey, messageText, relayUrls);
      
      // Notify via Ntfy (simple hardcoded ping or customized via env)
      await notifyNtfy('stealth_dms_ping', 'New incoming Nostr DM');
      
    } catch (e) {
      console.warn('Failed to send', e);
    }
  };

  const renderItem = ({ item }: any) => {
    const isSelf = item.pubkey === publicKey;
    return (
      <View style={[styles.bubbleContainer, isSelf ? styles.bubbleSelf : styles.bubblePeer]}>
        <Text style={styles.messageText}>{item.content}</Text>
        <Text style={styles.timeText}>
          {new Date(item.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="New message..."
          placeholderTextColor={theme.colors.textSecondary}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Send color="#FFF" size={20} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  bubbleContainer: {
    maxWidth: '80%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
  },
  bubbleSelf: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.bubbleSelf,
    borderBottomRightRadius: 4,
  },
  bubblePeer: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.bubblePeer,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  timeText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
    paddingBottom: Platform.OS === 'android' ? 30 : theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
});
