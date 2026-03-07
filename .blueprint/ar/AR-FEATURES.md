# AR Features — Neptu

> **Status**: Planning
> **Priority**: Post-habits completion
> **Target**: v2+

---

## Overview

AR features that enhance Neptu's spiritual wellness experience by bringing Wuku energy, oracle interactions, and habit gamification into the user's physical space.

**Tech stack**: `@reactvision/react-viro` (ARKit + ARCore), existing `react-native-reanimated`, `@shopify/react-native-skia`, `expo-haptics`, `expo-av`.

---

## Features

### 1. AR Neptu Orb — Full 3D (Flagship)

**Impact**: High | **Effort**: 3-4 weeks

The NeptuOrb currently lives as a 2D Skia animation on the OracleScreen. For AR, build a **full 3D orb** that exists in real-world space — true depth, parallax, occlusion — while keeping all interaction logic (voice recording, audio playback, state machine, haptics, rewards).

#### Architecture

```
┌──────────────────────────────────────────────────┐
│  ViroARSceneNavigator                            │
│  ├─ ViroARScene                                  │
│  │   ├─ ViroNode (surface anchor)                │
│  │   │   ├─ ViroSphere (core orb, custom GLSL)   │  ← Full 3D orb with shader-driven blob deformation
│  │   │   ├─ ViroSphere × 8 (layered shells)      │  ← Translucent outer layers = blob effect
│  │   │   ├─ ViroParticleEmitter (ambient)         │  ← Floating particles around orb
│  │   │   ├─ ViroParticleEmitter (speaking)        │  ← Ripple particles into real space
│  │   │   └─ ViroSpotLight (surface glow)          │  ← Colored light cast on real surface
│  │   ├─ ViroAmbientLight                         │
│  │   └─ ViroOmniLight (orb core light)           │  ← Point light inside orb, illuminates room
│  │                                               │
│  └─ AR Camera (live feed)                        │
├──────────────────────────────────────────────────┤
│  RN Overlay (pointerEvents="box-none")           │
│  ├─ ConversationHistory                          │  ← Existing text UI
│  ├─ MicButton                                    │  ← Existing tap-to-record
│  ├─ RewardToast                                  │  ← Existing reward notifications
│  └─ OrbStateIndicator                            │  ← Status text (listening/thinking/speaking)
└──────────────────────────────────────────────────┘
```

#### 3D Orb Rendering

The 2D Skia orb uses 8 blob layers built from cubic Bézier paths with audio-reactive wobble. The 3D equivalent:

- **Core sphere**: `ViroSphere` with custom vertex shader that displaces vertices using the same sine-wave wobble logic from `buildBlobPath` — two frequencies per vertex, amplitude-driven distortion
- **8 translucent shells**: Concentric `ViroSphere` layers at increasing radii with decreasing opacity (0.6 → 0.05), each with slightly offset wobble phase — reproduces the layered blob depth effect
- **Neon bloom**: `ViroOmniLight` placed at orb center with high intensity + color matching Wuku energy. Combined with shell translucency, this creates the glow-through effect (replaces Skia `Shadow`)
- **Surface glow**: `ViroSpotLight` pointing down from orb → casts colored light on real-world surface
- **Orbiting dot**: `ViroSphere` (small) animated on a circular path around the core via `ViroAnimations`

#### State Machine (same logic, 3D output)

| State         | 3D Behavior                                                                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **idle**      | Gentle scale pulse (0.95–1.05), slow rotation, ambient particles float                                                                              |
| **listening** | Shells expand/contract with audio amplitude via spring physics, core glows brighter, particles accelerate inward                                    |
| **thinking**  | Orb rotates faster, shells orbit independently, pulsing scale, particles spiral                                                                     |
| **speaking**  | Audio amplitude drives shell distortion + `ViroParticleEmitter` bursts ripple outward into real space, `ViroOmniLight` intensity pulses with speech |
| **error**     | Shells collapse inward, red tint, light dims                                                                                                        |

#### Interaction Layer (unchanged)

All interaction logic stays in React Native — **not inside ViroARScene**:

- `useNeptuOracle` hook — full oracle lifecycle (recording → API → playback → history → rewards)
- `useAudioRecorder` — audio recording with silence detection
- `useAudioPlayer` — TTS audio playback
- `useSoundEffects` — chime/error sounds on state transitions
- `expo-haptics` — haptic feedback on tap, state changes
- `useVisualizerData` — Reanimated shared values feed into Viro node properties via bridge
- Conversation history, reward toasts, mic button — RN overlay on top of AR scene

#### Data Bridge: Reanimated → Viro

The existing `useVisualizerData` outputs `scale`, `glowRadius`, `rotation`, `color`. These drive the 3D orb:

```
useVisualizerData (Reanimated SharedValues)
  │
  ├─ scale       → ViroNode transform scale
  ├─ glowRadius  → ViroOmniLight attenuationEndDistance
  ├─ rotation    → ViroNode rotation [0, rotY, 0]
  ├─ color       → ViroMaterial diffuseColor + ViroLight color
  └─ amplitude   → Vertex shader uniform (shell distortion amount)
```

State passed via React props/context — Viro components re-render on state change.

#### How it works

1. User opens Oracle tab → `ViroARSceneNavigator` activates camera
2. AR detects a flat surface → shows placement indicator ring
3. User taps surface → 3D orb materializes with spawn animation (scale 0 → 1 with particle burst)
4. Orb floats at anchor point — user can walk around it, see parallax and real-world occlusion
5. Tap orb (or mic button) → starts voice recording, orb enters `listening` state
6. Audio sent to API → orb enters `thinking` state (orbital rotation, spiral particles)
7. Response received → `speaking` state (amplitude-driven shells, particle ripples into room, surface light pulses)
8. Conversation text appears in RN overlay with typing effect
9. Rewards toast shows on completion

#### Why full 3D

- True parallax — walk around the orb, it has real depth and perspective
- Real-world occlusion — orb can be partially hidden behind physical objects
- `ViroOmniLight` illuminates the actual room surface — the orb "exists" in the space, not floating on screen
- Particle effects fly into real 3D space with depth, not flat 2D sprites
- More impressive for hackathon demo — judges can physically walk around the oracle

#### Skia orb remains for non-AR mode

The existing `NeptuOrb.tsx` stays untouched as the **default Oracle screen** for devices without ARCore or when users prefer 2D mode. AR mode is an opt-in toggle.

---

### 2. AR Energy Aura Scanner

**Impact**: High | **Effort**: 2 weeks

Point camera at yourself (front camera) → see your Wuku energy aura overlaid on your body.

#### How it works

- Uses front camera + body/face detection
- Renders a glowing aura around the user's silhouette
- Aura colors map to Wariga dimensions:
  - **Cipta** (thought) → blue crown above head
  - **Rasa** (emotion) → pink chest glow
  - **Karsa** (willpower) → gold solar plexus
  - **Tindakan** (action) → red hands/arms
  - **Frekuensi** (frequency) → purple full-body pulse
- Intensity of each zone = today's Peluang score for that dimension
- Screenshot/share → earns 0.5 NEPTU (social share reward already exists)

#### Why

The Soul Radar Chart already visualizes these 5 dimensions as data. AR makes it visceral — "see your energy" instead of reading a chart. High viral/social share potential.

---

### 3. AR Wuku Calendar Mandala

**Impact**: Medium | **Effort**: 1.5 weeks

Place a 3D sacred geometry mandala on a flat surface that represents the 210-day Wuku cycle.

#### How it works

- AR detects a table/floor → places a circular mandala
- 30 Wuku periods arranged in a ring, each as a glowing glyph
- Current Wuku lights up and rotates to the top
- User's birth Wuku glows gold (Potensi)
- Touch any Wuku glyph → shows its name, energy characteristics, SaptaWara/PancaWara
- Today's energy line connects birth Wuku → current Wuku, showing compatibility score
- On auspicious days (2x multiplier), the mandala blooms with particles

#### Why

The Wuku calendar is the app's unique differentiator. Most users don't understand the 210-day cycle. A 3D mandala makes it intuitive and shareable.

---

### 4. AR Habit Garden

**Impact**: High | **Effort**: 2 weeks

Habits grow as 3D plants/trees in AR space.

#### How it works

- Each habit = a plant placed on a surface
- Growth stages map to streak length:
  - Days 1-6 → seedling
  - Days 7-29 → sprout (first milestone = 1 NEPTU)
  - Days 30-99 → flowering plant (5 NEPTU)
  - Days 100+ → full tree with glowing fruit (20 NEPTU)
- Plants are color-coded by category (8 habit categories: health=green, mindfulness=purple, fitness=red, etc.)
- Missed days → plant wilts slightly
- Completing today's habit → brief bloom animation with haptic feedback
- Walk around your garden in AR, see all habits as a spatial landscape

#### Why

Habit tracking is abstract. Seeing a garden grow (or wilt) in your physical space creates emotional attachment. The streak/reward system maps perfectly to growth stages.

---

### 5. AR Token Rain (Quick Win)

**Impact**: Medium | **Effort**: 3-5 days

When claiming rewards on the Wallet screen, NEPTU tokens rain down in AR.

#### How it works

- User taps "Claim All" → camera opens briefly
- 3D NEPTU coins with the logo fall from above in AR space, bouncing on detected surfaces
- Coin count matches actual reward amount
- Coins dissolve into golden particles

#### Why

Crypto reward claiming feels anticlimactic (just a number changing). AR makes it a moment. Highly shareable on social media.

---

### 6. AR Kanda Pat Guardian

**Impact**: High | **Effort**: 3-4 weeks

The Wariga system includes Kanda Pat (four guardian spirits). Visualize your guardian in AR.

#### How it works

- Based on birth Wuku calculation, user has a Kanda Pat guardian
- AR places a stylized spirit figure in the room
- Guardian's pose/expression changes based on today's energy alignment
- During oracle conversations, guardian reacts to the oracle's advice (nods, glows)
- Unlockable guardian skins via streak milestones

#### Why

Deeply Balinese cultural element that's currently just data in the calculator. Making it visual connects Western users to the tradition. Good candidate for premium/paid feature.

---

## Roadmap

| Phase    | Feature                | Timeline  | Value                                          |
| -------- | ---------------------- | --------- | ---------------------------------------------- |
| **v2.0** | AR Token Rain          | 1 week    | Quick win — prove AR pipeline, shareable       |
| **v2.0** | AR Neptu Orb (full 3D) | 3-4 weeks | Flagship differentiator — 3D orb + voice in AR |
| **v2.1** | AR Energy Aura         | 2 weeks   | Social/viral — "see your aura" screenshots     |
| **v2.1** | AR Habit Garden        | 2 weeks   | Retention driver — emotional habit attachment  |
| **v3.0** | AR Wuku Mandala        | 1.5 weeks | Educational — makes calendar system accessible |
| **v3.0** | AR Kanda Pat Guardian  | 3-4 weeks | Deepest cultural integration — premium feature |

---

## Technical Requirements

### Dependencies

```
@reactvision/react-viro     → AR scene rendering, surface detection, 3D objects
```

### Already Installed (reuse)

```
react-native-reanimated     → AR UI transitions
@shopify/react-native-skia  → 2D overlays on AR camera
expo-haptics                → AR interaction feedback
expo-av                     → Oracle audio in AR mode
```

### Android Requirements

- `minSdkVersion >= 24` (ARCore requirement)
- Camera permission (already present for audio)
- Physical device with ARCore support (no emulator)
- `expo run:android` rebuild required after adding AR native deps

### Project Structure (proposed)

```
apps/mobile/src/
  components/
    ar/
      ARNeptuOrb.tsx
      ARAuraScanner.tsx
      ARWukuMandala.tsx
      ARHabitGarden.tsx
      ARTokenRain.tsx
      ARKandaPatGuardian.tsx
  hooks/
    useARScene.ts
  assets/
    models/           ← 3D models (.obj, .gltf, .glb, .vrx)
    textures/         ← AR textures (.png, .jpg)
    shaders/          ← Custom GLSL vertex/fragment shaders
```

---

## 3D Assets — What to Provide vs What's Generated in Code

### Generated Procedurally (no external assets needed)

| Feature             | Asset                          | How                                                                                                           |
| ------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **AR Neptu Orb**    | Core sphere + 8 shell layers   | `ViroSphere` primitives — radius, segments, opacity set in code. Vertex displacement via GLSL shader uniforms |
| **AR Neptu Orb**    | Particles (ambient + speaking) | `ViroParticleEmitter` — config-driven (count, velocity, lifetime, color). No model file needed                |
| **AR Neptu Orb**    | Orbiting dot                   | Small `ViroSphere` animated on circular path                                                                  |
| **AR Token Rain**   | NEPTU coins                    | `ViroSphere` or `ViroCylinder` with flat ratio + texture. OR a simple coin `.glb`                             |
| **AR Token Rain**   | Golden dissolve particles      | `ViroParticleEmitter` — procedural                                                                            |
| **AR Wuku Mandala** | 30 glyphs in ring              | `ViroText` or `ViroImage` nodes positioned in circle via math                                                 |
| **AR Wuku Mandala** | Connection lines               | `ViroPolyline` — procedural                                                                                   |
| **AR Habit Garden** | Seedling (days 1-6)            | Simple `ViroCylinder` stem + `ViroSphere` leaf — procedural geometry                                          |

### You Need to Provide (external 3D assets)

| Feature                   | Asset                        | Format                  | Why                                                                                                                                                                                       |
| ------------------------- | ---------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AR Neptu Orb**          | Holographic pedestal/base    | `.glb` or `.obj`        | Stylized base under the orb — needs artistic design. Can skip for v1                                                                                                                      |
| **AR Token Rain**         | NEPTU coin with logo         | `.glb` + texture `.png` | Flat cylinder is fine for v1, but a proper coin model with the Neptu logo embossed looks better. **Alternative**: use a flat `ViroImage` billboard with the coin PNG — no 3D model needed |
| **AR Habit Garden**       | Sprout model (days 7-29)     | `.glb`                  | Low-poly stylized plant                                                                                                                                                                   |
| **AR Habit Garden**       | Flowering plant (days 30-99) | `.glb`                  | Low-poly with color variants per category                                                                                                                                                 |
| **AR Habit Garden**       | Full tree (days 100+)        | `.glb`                  | Low-poly tree with glowing fruit attachment points                                                                                                                                        |
| **AR Kanda Pat Guardian** | 4 guardian spirit models     | `.glb` with animations  | Rigged characters with idle, nod, glow poses. **Highest effort** — needs character design + modeling + rigging                                                                            |
| **AR Energy Aura**        | None                         | —                       | Aura is shader-driven overlay on body segmentation mask — no 3D model                                                                                                                     |

### Options for Sourcing 3D Assets

| Option                                             | Cost            | Quality                  | Speed                                               |
| -------------------------------------------------- | --------------- | ------------------------ | --------------------------------------------------- |
| **Procedural / primitives**                        | Free            | Basic, clean             | Fastest — ship v1 with this                         |
| **AI-generated** (Meshy, Tripo3D, Luma Genie)      | Free-$20/mo     | Medium, may need cleanup | Fast — generate `.glb` from text prompts in minutes |
| **Asset stores** (Sketchfab, TurboSquid, CGTrader) | $0-50 per model | High, production-ready   | Medium — browse + adapt                             |
| **Custom Blender/Maya**                            | Time-intensive  | Highest, brand-matched   | Slow — need 3D artist                               |

### Recommended Approach Per Phase

| Phase                         | Strategy                                                                                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **v2.0 — Token Rain**         | Use `ViroImage` billboard with existing coin PNG or flat `ViroCylinder` + texture. **No external 3D assets needed**                      |
| **v2.0 — Neptu Orb**          | 100% procedural `ViroSphere` shells + GLSL shaders + `ViroParticleEmitter`. **No external 3D assets needed**. Skip pedestal for v1       |
| **v2.1 — Energy Aura**        | Shader-driven overlay. **No external 3D assets needed**                                                                                  |
| **v2.1 — Habit Garden**       | v1: procedural primitives (cylinders + spheres). v2: swap in AI-generated `.glb` plants for polish                                       |
| **v3.0 — Wuku Mandala**       | Procedural geometry + `ViroText`. **No external 3D assets needed**. Optional: glyph icon PNGs for visual richness                        |
| **v3.0 — Kanda Pat Guardian** | **Requires external 3D models** — either AI-generated or commissioned. This is the only feature that cannot ship without prepared assets |

---

## Notes

- Current setup is Expo bare workflow with full `android/` native access — zero blockers for AR
- New Architecture + Hermes enabled — compatible with ViroReact community fork
- AR features should be opt-in (graceful fallback when device lacks ARCore)
- Consider AR as premium-tier feature tied to subscription plans
