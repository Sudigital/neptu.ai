# AR Energy Aura Scanner — Development Plan

> **Status**: Planning
> **Effort**: 2 weeks
> **Depends on**: Existing Wariga energy system, `@reactvision/react-viro`

---

## Overview

Point the front camera at yourself → see your **Wuku energy aura** overlaid on your body. The 5 Wariga dimensions (Cipta, Rasa, Karsa, Tindakan, Frekuensi) from the existing `SoulRadarChart` become **glowing zone-mapped auras** on the camera feed. Screenshot/share → earn 0.5 NEPTU.

---

## Aura Zone Mapping

| Dimension             | Emoji | Zone         | Color            | Body Area     |
| --------------------- | ----- | ------------ | ---------------- | ------------- |
| Cipta (thought)       | 🧠    | Crown        | Blue `#0EA5E9`   | Above head    |
| Rasa (emotion)        | 💗    | Heart        | Pink `#EC4899`   | Chest         |
| Karsa (willpower)     | 🤝    | Solar Plexus | Gold `#F59E0B`   | Stomach       |
| Tindakan (action)     | ⚡    | Hands        | Red `#EF4444`    | Arms/hands    |
| Frekuensi (frequency) | 📊    | Full Body    | Purple `#A855F7` | Pulse overlay |

Intensity of each zone = today's Peluang score for that dimension (already computed by `computeLocalReading()` in `apps/mobile/src/utils/energy-helpers.ts`).

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  ViroARSceneNavigator (front camera)                 │
│  ├─ ViroARScene                                      │
│  │   └─ ViroARImageMarker / body tracking proxy      │
│  │       ├─ ViroNode (crown zone)                    │
│  │       │   └─ ViroParticleEmitter (blue glow)      │
│  │       ├─ ViroNode (heart zone)                    │
│  │       │   └─ ViroParticleEmitter (pink glow)      │
│  │       ├─ ViroNode (solar plexus zone)             │
│  │       │   └─ ViroParticleEmitter (gold glow)      │
│  │       ├─ ViroNode (hands zone)                    │
│  │       │   └─ ViroParticleEmitter (red glow)       │
│  │       └─ ViroNode (full body pulse)               │
│  │           └─ ViroParticleEmitter (purple pulse)   │
│  │                                                    │
│  └─ AR Front Camera (live feed)                      │
├──────────────────────────────────────────────────────┤
│  RN Overlay (pointerEvents="box-none")               │
│  ├─ AuraDimensionLabels                              │
│  │   └─ 5 dimension badges showing name + score      │
│  ├─ DualitasIndicator (YIN/YANG badge)               │
│  ├─ ScreenshotButton → share → earn 0.5 NEPTU        │
│  └─ BackButton (return to AR list)                   │
└──────────────────────────────────────────────────────┘
```

---

## Navigation Change

Replace the center **Oracle** tab with a raised **AR** center button. Oracle voice AI moves inside the AR screen as a sub-feature.

**Before**: Home | Habits | **Oracle** | Wallet | Profile
**After**: Home | Habits | **[ AR ]** | Wallet | Profile

The AR tab opens a feature list screen with sub-navigation:

```
AR Tab (center button)
  ├─ Feature List (default view)
  │   ├─ Energy Aura Scanner (active)
  │   ├─ Neptu Orb 3D (coming soon)
  │   └─ Habit Garden (coming soon)
  ├─ Aura Scanner (full-screen AR)
  └─ Oracle Voice (bottom sheet, reuses useNeptuOracle)
```

---

## Task Breakdown

### Phase 1 — Foundation (Days 1–3)

| #   | Task                              | Files                                | Details                                                                                                                                                                                                                                                       |
| --- | --------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Install `@reactvision/react-viro` | `apps/mobile/package.json`           | Add dep + native rebuild. `minSdkVersion: 24` already set in `android/app/build.gradle` (ARCore requires ≥24)                                                                                                                                                 |
| 1.2 | Create `useARScene` hook          | `src/hooks/useARScene.ts` (**new**)  | AR session lifecycle: init, camera permission check, ARCore availability detection, front/back camera toggle, cleanup. Returns `{ isARAvailable, hasPermission, requestPermission, cameraPosition, toggleCamera }`. Graceful fallback when ARCore unavailable |
| 1.3 | Update navigation types           | `src/types/index.ts`                 | Change `MainTab`: `"oracle"` → `"ar"`. Add `ARView = "list" \| "aura" \| "orb"` sub-navigation type                                                                                                                                                           |
| 1.4 | Update BottomTabBar               | `src/components/BottomTabBar.tsx`    | Replace Oracle tab → raised AR center button. Icon: `scan-outline` / `scan`. Elevated style: larger size, glowing border, slight translateY up                                                                                                                |
| 1.5 | Create ARScreen shell             | `src/screens/ARScreen.tsx` (**new**) | Landing screen with feature list cards + sub-navigation state. Cards: "Energy Aura" (active, tappable), "Neptu Orb 3D" (locked/coming soon), "Habit Garden" (locked/coming soon). Oracle floating button at bottom                                            |
| 1.6 | Update App.tsx                    | `src/App.tsx`                        | Replace `OracleScreen` import/render → `ARScreen`. Change `activeTab === "oracle"` → `activeTab === "ar"`                                                                                                                                                     |

### Phase 2 — Aura Scanner Core (Days 4–7)

| #   | Task                          | Files                                                  | Details                                                                                                                                                                                                                                                                                                                                                   |
| --- | ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | Create aura constants         | `src/constants/aura.ts` (**new**)                      | `AURA_ZONES` array: `{ key, label, emoji, color, bodyOffset: [x, y, z] }` for each dimension. Particle emitter configs per zone: particle count (proportional to score), lifetime, velocity, spawn area shape. Extract `DIMENSION_LABELS`, `DIMENSION_EMOJIS`, `DIM_KEYS` from `SoulRadarChart.tsx` into shared constants (avoid duplication)             |
| 2.2 | Create `useAuraData` hook     | `src/hooks/useAuraData.ts` (**new**)                   | Computes aura zone intensities from existing `computeLocalReading()` + `mapToDimensions()`. Returns `{ zones: AuraZone[], dualitas, afirmasi, totalEnergy }`. `AuraZone = { key, label, emoji, color, score, intensity (0–1 normalized), particleConfig }`. Zero new calculation logic — reuses `energy-helpers.ts`                                       |
| 2.3 | Create `ARAuraScanner`        | `src/components/ar/ARAuraScanner.tsx` (**new**)        | `ViroARSceneNavigator` with `cameraPosition="front"`. Places 5 `ViroParticleEmitter` nodes at body zone positions. Particle color/count/intensity driven by `useAuraData` scores. `ViroAmbientLight` + `ViroOmniLight` for glow-through. Face detection as anchor + offset body zones relative to face (crown = face + Y up, heart = face + Y down, etc.) |
| 2.4 | Create `AuraDimensionOverlay` | `src/components/ar/AuraDimensionOverlay.tsx` (**new**) | RN overlay on AR camera: 5 floating badges at screen edges showing dimension emoji + name + score. Animated entrance with Reanimated `FadeInUp`. Dualitas (YIN/YANG) badge at top center                                                                                                                                                                  |
| 2.5 | Integrate into ARScreen       | `src/screens/ARScreen.tsx`                             | Tap "Energy Aura" card → opens `ARAuraScanner` full-screen with overlay. Back button returns to AR list                                                                                                                                                                                                                                                   |

### Phase 3 — Polish + UX (Days 8–10)

| #   | Task                 | Files               | Details                                                                                                                                                                           |
| --- | -------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | Aura pulse animation | `ARAuraScanner.tsx` | Frekuensi dimension drives a full-body pulse: periodic `ViroParticleEmitter` burst at interval inversely proportional to score. Higher score = faster pulse = more intense energy |
| 3.2 | Screenshot/share     | `ARAuraScanner.tsx` | Add `react-native-view-shot` dep. Capture AR + overlay → share sheet via `Share.share()`. On successful share → call reward API for 0.5 NEPTU                                     |
| 3.3 | Haptic feedback      | `ARAuraScanner.tsx` | `expo-haptics`: light on scan start, medium on aura materializing, heavy on screenshot capture                                                                                    |
| 3.4 | Sound effects        | `ARAuraScanner.tsx` | Reuse `useSoundEffects` hook: ambient chime when aura materializes                                                                                                                |
| 3.5 | Oracle integration   | `ARScreen.tsx`      | "Ask Oracle" floating button → bottom sheet with existing voice interaction. Reuse `useNeptuOracle` hook, `MicButton`, `ConversationHistory` — zero new oracle logic              |

### Phase 4 — Fallback + Testing (Days 11–14)

| #   | Task                      | Files                                         | Details                                                                                                                                                                                         |
| --- | ------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | ARCore fallback           | `useARScene.ts`, `ARAuraScanner.tsx`          | Detect ARCore availability. If unavailable → show 2D Skia aura overlay on `expo-camera` feed instead of ViroReact. Reuse `SoulRadarChart` visual style for the 2D fallback                      |
| 4.2 | Write tests               | `__tests__/ar-aura-scanner.test.ts` (**new**) | Test `useAuraData` hook (dimension mapping, intensity normalization, edge cases). Test `useARScene` (permission states, fallback detection). Mock `@reactvision/react-viro` for component tests |
| 4.3 | Lint + typecheck + build  | —                                             | `bun run lint`, `bun run typecheck`, `bun run build` — zero errors, zero warnings                                                                                                               |
| 4.4 | APK rebuild + device test | —                                             | `expo run:android` on physical device with ARCore. Verify front camera aura scanning, zone positioning, screenshot, share, Oracle bottom sheet                                                  |

---

## New Files

```
apps/mobile/src/
  components/
    ar/
      ARAuraScanner.tsx          ← ViroARScene + particle emitters for 5 aura zones
      AuraDimensionOverlay.tsx   ← RN overlay badges (dimension name + emoji + score)
  constants/
    aura.ts                     ← Zone colors, body offsets, particle configs
  hooks/
    useARScene.ts               ← AR session lifecycle, permission, camera toggle, fallback
    useAuraData.ts              ← Compute aura zone intensities from Wariga reading
  screens/
    ARScreen.tsx                ← AR feature list + sub-navigation
  __tests__/
    ar-aura-scanner.test.ts    ← Tests for useAuraData + useARScene
```

## Modified Files

| File                                | Change                                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/types/index.ts`                | `MainTab`: `"oracle"` → `"ar"`, add `ARView` type                                                    |
| `src/components/BottomTabBar.tsx`   | Oracle tab → raised AR center button with `scan` icon                                                |
| `src/components/SoulRadarChart.tsx` | Extract `DIMENSION_LABELS`, `DIMENSION_EMOJIS`, `DIM_KEYS` to `constants/aura.ts`, import from there |
| `src/App.tsx`                       | Replace `OracleScreen` import/render → `ARScreen`, `"oracle"` → `"ar"`                               |
| `apps/mobile/package.json`          | Add `@reactvision/react-viro`, `react-native-view-shot`                                              |

---

## Dependencies

### To Install

| Package                   | Purpose                                                               |
| ------------------------- | --------------------------------------------------------------------- |
| `@reactvision/react-viro` | AR scene rendering, particle emitters, 3D lighting, surface detection |
| `react-native-view-shot`  | Screenshot capture for share feature                                  |

### Already Installed (reuse)

| Package                      | Used For                                       |
| ---------------------------- | ---------------------------------------------- |
| `react-native-reanimated`    | Overlay animations (FadeIn, FadeInUp)          |
| `@shopify/react-native-skia` | 2D fallback aura overlay if ARCore unavailable |
| `expo-haptics`               | Haptic feedback on scan/screenshot             |
| `expo-av`                    | Oracle audio in AR screen                      |
| `expo-linear-gradient`       | AR list screen card backgrounds                |

---

## Existing Code Reused (no duplication)

| What                                               | Source File                                                       | Used For                                                       |
| -------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| `computeLocalReading()`                            | `src/utils/energy-helpers.ts`                                     | Get today's Peluang dimension scores                           |
| `mapToDimensions()`                                | `src/utils/energy-helpers.ts`                                     | Map reading → 5 `SoulDimensions`                               |
| `ReadingData`, `SoulDimensions`, `DimValue`        | `src/utils/energy-helpers.ts`                                     | Type interfaces                                                |
| `DIMENSION_LABELS`, `DIMENSION_EMOJIS`, `DIM_KEYS` | `src/components/SoulRadarChart.tsx` → move to `constants/aura.ts` | Dimension metadata, shared across SoulRadarChart + AuraScanner |
| `useNeptuOracle`                                   | `src/hooks/useNeptuOracle.ts`                                     | Oracle voice in AR screen bottom sheet                         |
| `useSoundEffects`                                  | `src/hooks/useSoundEffects.ts`                                    | Aura materialization sound                                     |
| `useTheme`                                         | `src/hooks/useTheme.ts`                                           | Overlay styling                                                |
| `getProfile()`                                     | `src/services/storage.ts`                                         | Birth date for Potensi calculation                             |
| `MicButton`                                        | `src/components/MicButton.tsx`                                    | Oracle recording trigger in AR                                 |
| `ConversationHistory`                              | `src/components/ConversationHistory.tsx`                          | Oracle chat history in AR                                      |

---

## Risk Mitigation

| Risk                                                       | Impact                   | Mitigation                                                                                                                           |
| ---------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| ViroReact incompatible with Expo SDK 54 / New Architecture | Blocks all AR            | Test native build on Day 1. Fallback: use `expo-camera` + Skia overlay (2D aura) as primary approach                                 |
| No body tracking on Android ARCore                         | Aura zones misaligned    | Use face detection as anchor + calculated Y offsets for body zones. Fallback: fixed screen-space positioning with gyroscope parallax |
| Front camera not supported by ViroReact                    | Can't scan self          | ViroReact supports `cameraPosition="front"`. If broken: use `expo-camera` front feed + Skia aura particles                           |
| APK size increase                                          | Larger download          | ARCore is a separate Google Play Services module, not bundled. ViroReact adds ~5-8MB                                                 |
| Performance on low-end devices                             | Laggy particle rendering | Reduce particle count based on device capability. `useAuraData` returns `particleConfig` with quality tiers                          |

---

## Body Zone Positioning Strategy

Since ViroReact on Android doesn't have native body/pose tracking, use **face detection as anchor** with calculated offsets:

```
Face detected at position (fx, fy, fz)

Crown (Cipta):    [fx, fy + 0.15, fz]         ← above head
Heart (Rasa):     [fx, fy - 0.25, fz]         ← chest level
Solar (Karsa):    [fx, fy - 0.40, fz]         ← stomach level
Hands (Tindakan): [fx ± 0.25, fy - 0.30, fz]  ← arm level, spread
Full (Frekuensi): [fx, fy - 0.15, fz]         ← center mass, large radius
```

Offsets are based on average human proportions relative to face position. Fine-tune with device testing.

**Alternative approach (Phase 4 fallback)**: Skip ViroReact entirely, render Skia particles on top of `expo-camera` feed. Simpler but 2D-only — no depth, no occlusion, but works on every device.

---

## Success Criteria

- [ ] AR tab replaces Oracle in bottom bar (center, raised style)
- [ ] AR feature list screen with working sub-navigation
- [ ] Front camera opens with aura particle zones visible
- [ ] 5 aura zones correctly positioned relative to user's body
- [ ] Zone intensity matches today's Peluang dimension scores
- [ ] Frekuensi full-body pulse animation working
- [ ] Dimension badges overlay with scores visible
- [ ] Screenshot capture + share working
- [ ] Share reward (0.5 NEPTU) triggers on successful share
- [ ] Oracle voice accessible from AR screen (bottom sheet)
- [ ] Graceful fallback when ARCore unavailable (2D Skia mode)
- [ ] Zero lint errors, zero type errors, tests passing
- [ ] Physical device tested on ARCore-compatible Android
