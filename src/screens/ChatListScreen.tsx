import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useAppStore } from '../stores/useAppStore';
import { theme } from '../constants/theme';
import { nostrService } from '../services/nostr';
import { Settings, MessageCirclePlus } from 'lucide-react-native';
import { nip19 } from 'nostr-tools';

export default function ChatListScreen({ navigation }: any) {
  const { privateKey, publicKey, relays, conversations, profiles } = useAppStore();
  const [newChatNpub, setNewChatNpub] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('RelayManager')} style={{ marginRight: theme.spacing.md }}>
          <Settings color={theme.colors.text} size={24} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (!privateKey || !publicKey) return;
    const relayUrls = relays.map(r => r.url);
    if (relayUrls.length === 0) return;

    const sub = nostrService.subscribeDMs(privateKey, publicKey, relayUrls);
    return () => {
      sub.close();
    };
  }, [privateKey, publicKey, relays.length]);

  useEffect(() => {
    const peerPubkeys = Object.keys(conversations);
    if (peerPubkeys.length === 0 || relays.length === 0) return;
    const relayUrls = relays.map(r => r.url);
    const sub = nostrService.subscribeProfiles(peerPubkeys, relayUrls);
    // @ts-ignore
    return () => sub.close();
  }, [Object.keys(conversations).join(','), relays.length]);

  const sortedSubkeys = React.useMemo(() => {
    return Object.keys(conversations).sort(
      (a, b) => conversations[b].lastMessageAt - conversations[a].lastMessageAt
    );
  }, [conversations]);

  const handleStartChat = () => {
    try {
      if (!newChatNpub.startsWith('npub1')) throw new Error('Invalid npub');
      const { type, data } = nip19.decode(newChatNpub);
      if (type !== 'npub') throw new Error('Not an npub');
      
      const peerPubkey = data as string;
      setShowNewChat(false);
      setNewChatNpub('');
      navigation.navigate('ChatDetail', { peerPubkey });
    } catch (e) {
      Alert.alert('Error', 'Invalid npub format');
    }
  };

  const renderItem = ({ item }: { item: string }) => {
    const conv = conversations[item];
    const lastMsg = conv.messages[conv.messages.length - 1];
    
    // Convert hex to npub for display
    const npub = nip19.npubEncode(item);
    const profile = profiles[item];
    const displayName = profile?.name || npub.slice(0, 16) + '...';
    const displayInitial = profile?.name ? profile.name.slice(0, 2).toUpperCase() : npub.slice(5, 7).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.chatRow}
        onPress={() => navigation.navigate('ChatDetail', { peerPubkey: item })}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayInitial}</Text>
        </View>
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>{displayName}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMsg ? lastMsg.content : 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.myKeyContainer}>
        <Text style={styles.myKeyLabel}>Your public key (Share to chat):</Text>
        <Text style={styles.myKeyText} selectable={true}>
          {publicKey ? nip19.npubEncode(publicKey) : ''}
        </Text>
      </View>

      {showNewChat && (
        <View style={styles.newChatContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter contact npub1..."
            placeholderTextColor={theme.colors.textSecondary}
            value={newChatNpub}
            onChangeText={setNewChatNpub}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.button} onPress={handleStartChat}>
            <Text style={styles.buttonText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setShowNewChat(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {sortedSubkeys.length === 0 && !showNewChat ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No secret chats yet.</Text>
        </View>
      ) : (
        <FlatList
          data={sortedSubkeys}
          keyExtractor={(item) => item}
          renderItem={renderItem}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowNewChat(true)}
      >
        <MessageCirclePlus color="#FFF" size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  myKeyContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  myKeyLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  myKeyText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  newChatContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  input: {
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  cancelText: {
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  chatRow: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lastMessage: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
