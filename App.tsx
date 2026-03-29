import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { storage } from './src/utils/storage';
import { useAppStore } from './src/stores/useAppStore';
import KeyManagerScreen from './src/screens/KeyManagerScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatDetailScreen from './src/screens/ChatDetailScreen';
import RelayManagerScreen from './src/screens/RelayManagerScreen';
import { theme } from './src/constants/theme';
import { View, ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator();

export default function App() {
  const { privateKey, publicKey, setKeys } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const pk = await storage.getItemAsync('publicKey');
        const skStr = await storage.getItemAsync('privateKey');
        if (pk && skStr) {
          const sk = new Uint8Array(skStr.split(',').map(Number));
          setKeys(sk, pk);
        }
      } catch (e) {
        console.warn('No keys found');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const MyTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      primary: theme.colors.primary,
    },
  };

  return (
    <NavigationContainer theme={MyTheme}>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text }}>
        {!publicKey ? (
          <Stack.Screen name="KeyManager" component={KeyManagerScreen} options={{ title: 'Welcome to Stealth' }} />
        ) : (
          <>
            <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Secret Chats' }} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} options={{ title: 'Chat' }} />
            <Stack.Screen name="RelayManager" component={RelayManagerScreen} options={{ title: 'Network Setup' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
