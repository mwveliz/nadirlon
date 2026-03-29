import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { nip19 } from 'nostr-tools';
import { storage } from '../utils/storage';
import { nostrService } from '../services/nostr';
import { useAppStore } from '../stores/useAppStore';
import { theme } from '../constants/theme';

export default function KeyManagerScreen() {
  const { setKeys } = useAppStore();
  const [inputNsec, setInputNsec] = useState('');

  const saveKeys = async (sk: Uint8Array, pk: string) => {
    try {
      await storage.setItemAsync('publicKey', pk);
      await storage.setItemAsync('privateKey', sk.toString());
      setKeys(sk, pk);
    } catch (e) {
      Alert.alert('Error', 'Failed to save keys securely.');
    }
  };

  const handleGenerate = () => {
    const { sk, pk } = nostrService.generateKeys();
    saveKeys(sk, pk);
  };

  const handleImport = () => {
    try {
      if (!inputNsec.startsWith('nsec1')) throw new Error('Invalid format');
      const { type, data } = nip19.decode(inputNsec);
      if (type !== 'nsec') throw new Error('Not an nsec');
      
      const sk = data as Uint8Array;
      const pk = nostrService.getPublicKey(sk);
      saveKeys(sk, pk);
    } catch (e) {
      Alert.alert('Invalid Key', 'Please enter a valid nsec string.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Identity</Text>
      <Text style={styles.subtitle}>
        Stealth uses the Nostr protocol. Keys are generated locally and never leave your device.
      </Text>

      <TouchableOpacity style={styles.buttonPrimary} onPress={handleGenerate}>
        <Text style={styles.buttonText}>Generate New Identity</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.line} />
      </View>

      <Text style={styles.label}>Import existing Private Key (nsec):</Text>
      <TextInput
        style={styles.input}
        placeholder="nsec1..."
        placeholderTextColor={theme.colors.textSecondary}
        value={inputNsec}
        onChangeText={setInputNsec}
        autoCapitalize="none"
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.buttonSecondary} onPress={handleImport}>
        <Text style={styles.buttonTextSecondary}>Import Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  orText: {
    color: theme.colors.textSecondary,
    paddingHorizontal: theme.spacing.md,
  },
  label: {
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
  },
  buttonTextSecondary: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
