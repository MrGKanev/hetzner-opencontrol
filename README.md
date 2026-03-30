# Hetzner OpenControl

An unofficial open-source mobile app for managing Hetzner Cloud — built for Android and iOS with React Native.

No backend, no telemetry, no subscription. Your API key goes directly to Hetzner's API and nowhere else.

---

## Features

**Servers**
- List, create, and delete servers
- Power on/off, reboot, reset, shutdown
- VNC console access from your phone
- CPU, disk, and network metrics with interactive charts
- Change server type, enable rescue mode, attach ISOs

**Networking**
- Firewalls with inbound/outbound rule management
- Private networks with subnet details
- Load balancers — services, targets, health checks
- Floating IPs and Primary IPs

**Storage**
- Volumes — create, attach, detach, resize
- Snapshots and backups

**Dashboard**
- Server map with datacenter locations
- Resource overview across all types

---

## Privacy

The app stores your API key in the system keychain (Keychain on iOS, EncryptedSharedPreferences on Android). It is never sent anywhere other than `api.hetzner.cloud`. There is no backend, no analytics, and no accounts.

---

## Build

**Android APK via GitHub Actions** — push to `master` and download the APK from the Actions artifacts tab.

**Local (Android):**
```bash
npm install
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

**Local (iOS):**
```bash
npm install
cd ios && bundle exec pod install
cd .. && npm run ios
```

---

## Stack

- React Native 0.84
- Zustand — state management
- React Navigation — navigation
- react-native-keychain — secure credential storage
- react-native-gifted-charts — metrics charts
- react-native-maps — dashboard map

---

## Status

Active development. Contributions and issues welcome.
