# Chat Layout Fix Report

## Root Cause

The chat input composer was hidden behind the bottom tab bar due to a combination of three layout issues:

### 1. `SafeAreaProvider` not wrapping `AppNavigator` (App.tsx)
`SafeAreaProvider` only wrapped auth/setup screens, NOT the main `AppNavigator`. This caused `useSafeAreaInsets()` to return `{bottom: 0}` everywhere in the main app flow, making it impossible to account for device notches, home indicators, or system navigation bars.

### 2. Custom `BottomNav` used hardcoded `bottom: 24` with no safe area awareness
The floating nav bar was positioned at `bottom: 24` regardless of device safe areas. On devices with a home indicator (iPhone X+), the nav could overlap the system gesture area.

### 3. Chat input container used hardcoded pixel values instead of derived layout constants
- ChatbotScreen: `keyboardOffset` initialized to `100` (magic number), `paddingBottom: 140` on input container, `paddingBottom: 310` on scroll content
- AITutorScreen: no bottom clearance at all — the input row was in the flex flow but BottomNav (absolutely positioned) rendered on top

## Affected Components

| Component | File | Issue |
|-----------|------|-------|
| `App` (root) | `App.tsx` | `SafeAreaProvider` not wrapping `AppNavigator` |
| `BottomNav` | `src/components/BottomNav.tsx` | Hardcoded `bottom: 24`, no exported dimension constants |
| `ChatbotScreen` | `src/screens/ChatbotScreen.tsx` | Hardcoded `100` for composer offset, `140` for input padding, `310` for scroll padding |
| `AITutorScreen` | `src/screens/AITutorScreen.tsx` | No bottom clearance, BottomNav overlapped input row |

## Changes Made

### 1. `App.tsx`
- Extracted main logic into `AppContent` component
- Wrapped everything in `GestureHandlerRootView > SafeAreaProvider > StatusBar > AppContent`
- Ensures `useSafeAreaInsets()` returns correct values everywhere

### 2. `src/components/BottomNav.tsx`
- Exported constants: `BOTTOM_NAV_HEIGHT` (72), `BOTTOM_NAV_BOTTOM_OFFSET` (24), `TAB_BAR_TOTAL_HEIGHT` (96)
- Uses `useSafeAreaInsets()` — nav position: `bottom: BOTTOM_NAV_BOTTOM_OFFSET + insets.bottom`

### 3. `src/screens/ChatbotScreen.tsx`
- Added `useSafeAreaInsets()` from `react-native-safe-area-context`
- Imported tab bar constants from `BottomNav`
- Defined layout constants: `INPUT_CONTAINER_TOP_PADDING` (16), `INPUT_ROW_HEIGHT` (44), `ACTION_ROW_HEIGHT` (56), `COMPOSER_VISUAL_MARGIN` (4)
- `composerClearance` = `TAB_BAR_TOTAL_HEIGHT + insets.bottom + COMPOSER_VISUAL_MARGIN`
- `scrollBottomPadding` = `composerClearance + composerHeight + COMPOSER_VISUAL_MARGIN`
- `keyboardOffset` initialized to `composerClearance` (no hardcoded magic number)
- Keyboard show: `e.endCoordinates.height + clearanceRef.current`
- Keyboard hide: `clearanceRef.current`
- Scroll views use `paddingBottom: scrollBottomPadding` instead of hardcoded `310`
- Removed `bottom: 0` from inputContainer static style (animated value is sole source)

### 4. `src/screens/AITutorScreen.tsx`
- Added `useSafeAreaInsets()`
- Imported tab bar constants from `BottomNav`
- `KeyboardAvoidingView` wrapper has `paddingBottom: bottomClearance` = `TAB_BAR_TOTAL_HEIGHT + insets.bottom + 4`
- `chatContent` uses `paddingBottom: bottomClearance`

## Layout Formula

```
composerClearance    = TAB_BAR_TOTAL_HEIGHT + insets.bottom + COMPOSER_VISUAL_MARGIN
composerHeight       = INPUT_CONTAINER_TOP_PADDING + INPUT_ROW_HEIGHT + GAP + ACTION_ROW_HEIGHT
scrollPaddingBottom  = composerClearance + composerHeight + COMPOSER_VISUAL_MARGIN
                     ≥ inputHeight + tabBarHeight + insets.bottom  ✓
```

Where:
- `TAB_BAR_TOTAL_HEIGHT` = `BOTTOM_NAV_HEIGHT` (72) + `BOTTOM_NAV_BOTTOM_OFFSET` (24) = 96
- `insets.bottom` = safe area bottom inset (0 on most Androids, ~34 on iPhone X+)

## Platform Coverage

| Platform | Status |
|----------|--------|
| Web | ✅ `SafeAreaProvider` + computed padding |
| iOS | ✅ `SafeAreaProvider` + `KeyboardAvoidingView` + insets |
| Android | ✅ `SafeAreaProvider` + computed padding |

## Verification Checklist

- [ ] Input composer visible above BottomNav on web
- [ ] Input composer visible above BottomNav on iOS simulator
- [ ] Input composer visible above BottomNav on Android emulator
- [ ] Keyboard pushes composer up, doesn't cover it
- [ ] Last message scrolls above composer, not behind it
- [ ] BottomNav respects safe area on notched devices
- [ ] No hardcoded pixel values (all derived from tab bar height constants + insets)
