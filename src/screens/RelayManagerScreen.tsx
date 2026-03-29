import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Platform } from 'react-native';
import { useAppStore } from '../stores/useAppStore';
import { theme } from '../constants/theme';
import { LogOut } from 'lucide-react-native';
import { nostrService } from '../services/nostr';
import { storage } from '../utils/storage';

export default function RelayManagerScreen({ navigation }: any) {
  const { relays, addRelay, removeRelay, clearKeys, privateKey, publicKey, profiles, addProfile } = useAppStore();
  const [newRelay, setNewRelay] = useState('wss://');
  const [nickname, setNickname] = useState(profiles[publicKey || '']?.name || '');

  const handleSetNickname = async () => {
    if (!privateKey) return;
    try {
      await nostrService.publishProfile(privateKey, nickname, relays.map(r => r.url));
      if (publicKey) addProfile(publicKey, { name: nickname });
      if (Platform.OS !== 'web') Alert.alert('Success', 'Nickname published to relays!');
    } catch (e) {
      if (Platform.OS !== 'web') Alert.alert('Error', 'Failed to set nickname');
    }
  };

  const handleAdd = () => {
    if (newRelay.startsWith('wss://') && !relays.some(r => r.url === newRelay)) {
      addRelay(newRelay);
      setNewRelay('wss://');
    }
  };

  const handleLogout = async () => {
    await storage.deleteItemAsync('privateKey');
    await storage.deleteItemAsync('publicKey');
    nostrService.closePool();
    clearKeys();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Nickname (Public)</Text>
      <Text style={styles.subtitle}>Set an anonymous nickname for the global room.</Text>
      
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder="Anonymous"
          placeholderTextColor={theme.colors.textSecondary}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleSetNickname}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <Text style={styles.title}>Network Relays</Text>
      <Text style={styles.subtitle}>
        Stealth connects to these Nostr relays to send and receive messages. Tor Proxy compatibility is left to the OS layer (e.g., Orbot VPN).
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={newRelay}
          onChangeText={setNewRelay}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={relays}
        keyExtractor={(item) => item.url}
        renderItem={({ item }) => (
          <View style={styles.relayRow}>
            <View style={styles.relayInfo}>
              <View style={[styles.statusDot, { backgroundColor: item.connected ? theme.colors.success : theme.colors.error }]} />
              <Text style={styles.relayUrl}>{item.url}</Text>
            </View>
            <TouchableOpacity onPress={() => removeRelay(item.url)}>
              <Text style={styles.deleteText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut color={theme.colors.error} size={20} />
        <Text style={styles.logoutText}>Delete Keys & Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  relayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  relayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: theme.spacing.sm,
  },
  relayUrl: {
    color: theme.colors.text,
    fontSize: 16,
  },
  deleteText: {
    color: theme.colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    marginTop: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
  },
  logoutText: {
    color: theme.colors.error,
    marginLeft: theme.spacing.sm,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
