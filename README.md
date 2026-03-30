# Nadirlon (Stealth Messenger) 🕵️‍♂️

A decentralized, serverless-grade messaging application built on React Native (Expo) and the Nostr protocol. 

[👉 **Download the Android APK**](https://github.com/mwveliz/nadirlon/blob/main/releases/nadirlon.apk)

## Wait, is this a server?
**NO.** Traditional chat apps (WhatsApp, Telegram, Discord) have central servers with proprietary databases storing who you are, who you talk to, and your metadata.

Nadirlon uses **Nostr Relays**, which are mathematical "dumb broadcasters". 
1. Your identity (`nsec`/`npub`) is generated locally on your device.
2. The relay (`wss://nadirlon.onrender.com`) is just a temporary WebSocket reflector. It does not look at your contacts, it does not hold an account for you, and it has no database to store permanent chat history logs.
3. Every single Direct Message is encrypted **before** it leaves your phone using military-grade cryptography (NIP-44).

## Architecture
```text
  📱 Client A (Alice)                      📱 Client B (Bob)
  [ Local nsec/npub ]                      [ Local nsec/npub ]
          │                                        │
          │ NIP-44 E2E Encrypted                   │ NIP-44 E2E Encrypted
          │ (Blob: "?iv=...")                      │ (Blob: "?iv=...")
          ▼                                        ▼
    [ Tor Proxy SOCKS5 ] (Optional)          [ Tor Proxy SOCKS5 ] (Optional)
          │                                        │
          └─────────────┐            ┌─────────────┘
                        ▼            ▼
                     ☁️ "Dumb" Nostr Relay
                    (wss://nadirlon.onrender.com)
                    - No Database
                    - No Accounts
                    - Just Ephemeral WebSockets 
```

## Community Sovereignty (Host Your Own Network)
Nadirlon is not locked into any central relay. Each community, activist group, or open-source collective can host their own private Mini-Relay and deploy their own APKs.

To compile Nadirlon aimed at your community's private relay, use the `.env` variable:
```bash
EXPO_PUBLIC_DEFAULT_RELAY=wss://your-private-relay.com npx expo start
```
Even if a user downloads the default APK, they can freely change the Relay URL inside the app's settings at any time without losing their keys or contacts.

## 🧅 Tor Compatibility (Ultimate Privacy)
Nadirlon is explicitly designed to delegate network proxying to the Operating System. 
To achieve complete IP anonymity (so the Relay doesn't even know your device's IP address):
1. Download **Orbot** (the official Tor proxy for Android).
2. Enable **VPN Mode** and select the Nadirlon app.
3. The app's WebSockets will seamlessly route through the Tor onion network with zero extra code or configuration needed.

## How to Run Locally
1. `npm install`
2. `npx expo start`
3. Press `a` for Android Emulator, or `w` for the Web version.

## Build the Android APK
```bash
eas build -p android --profile preview
```
