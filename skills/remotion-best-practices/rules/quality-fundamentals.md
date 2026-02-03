---
name: quality-fundamentals
description: Typography, pacing, and visual richness fundamentals for high-quality video
metadata:
  tags: typography, themes, pacing, transitions, quality
---

# Quality Fundamentals for Remotion Video

> Hard-won lessons from production projects. These rules prevent flat, rushed, or confusing output.

---

## 1. Complete Theme Interface

A theme is not just fonts + colors. Complete themes require all five components:

```typescript
interface VideoTheme {
  // 1. Colors - MINIMUM 5
  colors: {
    bg: string;        // Background
    fg: string;        // Primary text
    accent: string;    // Highlights, emphasis
    highlight: string; // Speaker names, labels
    muted: string;     // Secondary text, captions - OFTEN FORGOTTEN
  };

  // 2. Typography - sizes AND spacing
  typography: {
    displaySize: number;   // ≥64px for video
    bodySize: number;      // ≥46px for video
    lineHeight: number;    // 1.3-1.6 for readability
    letterSpacing: string; // '-0.02em' to '0.05em'
    textTransform?: 'uppercase' | 'none';
  };

  // 3. Effects - depth and visual richness
  effects: {
    textShadow?: string;   // '2px 2px 4px rgba(0,0,0,0.3)'
    dropShadow?: string;   // For containers
    glowColor?: string;    // For dark themes
  };

  // 4. Layout - screen utilization
  layout: {
    style: 'centered' | 'left-aligned' | 'asymmetric';
    padding: number;       // ≤60px for 1080p
    maxWidth: number;      // ≥1400px for 1080p
  };

  // 5. Distinctiveness - what makes this theme unique
  distinctiveness: {
    backgroundAnimation?: string;  // 'floating-particles' | 'gradient-shift' | 'none'
    highlightStyle?: string;       // 'underline' | 'box' | 'glow' | 'bracket'
    entranceAnimation?: string;    // 'fade' | 'slide-up' | 'typewriter'
  };
}
```

**Rule**: If you can't fill out all 5 sections, the theme is incomplete.

---

## 2. Video Typography Minimums

Video is NOT web. Viewers are 6-10 feet from screens. These minimums are non-negotiable:

| Property | Minimum | Recommended | Web Comparison |
|----------|---------|-------------|----------------|
| Body text | 46px | 48-52px | Web uses 16-18px |
| Display text | 64px | 72-96px | Web uses 32-48px |
| maxWidth | 1400px | 1500px | Web uses 800-1000px |
| padding | ≤60px | 50px | Web uses 80-120px |
| lineHeight | 1.3 | 1.4-1.5 | Same |

### Why These Numbers?

```
1920x1080 at 46px body:
- ~35-40 characters per line (optimal for reading)
- Readable at 6-10 feet viewing distance
- Leaves room for speaker labels, timestamps

1920x1080 at 32px body (WRONG):
- ~50-60 characters per line (too dense)
- Requires squinting on TV
- Feels like a webpage, not a video
```

**Rule**: If body text is under 46px, you're making a webpage, not a video.

---

## 3. Readable Pacing Rules

At 30fps, these frame counts produce comfortable reading:

| Timing Type | Frames | Seconds | Purpose |
|-------------|--------|---------|---------|
| Word duration | 18-24 | 0.6-0.8 | Time per word on screen |
| Line pause | 30-40 | 1.0-1.3 | Pause after sentence/line ends |
| Speaker change | 45-55 | 1.5-1.8 | Pause when speaker changes |
| Section transition | 60-90 | 2.0-3.0 | Between major sections |
| Dramatic pause | 70+ | 2.3+ | After impactful content |

### Anti-Pattern: Rush Pacing

```typescript
// WRONG - feels frantic
const FRAMES_PER_WORD = 12;  // 0.4 seconds

// RIGHT - comfortable reading
const FRAMES_PER_WORD = 20;  // 0.67 seconds
const LINE_PAUSE = 35;
const SPEAKER_PAUSE = 50;
```

### Pacing Formula

```typescript
function calculateLineDuration(wordCount: number, fps: number = 30): number {
  const FRAMES_PER_WORD = 20;
  const LINE_PAUSE = 35;
  return (wordCount * FRAMES_PER_WORD) + LINE_PAUSE;
}

function calculateSectionDuration(lines: Line[], fps: number = 30): number {
  let total = 0;
  for (const line of lines) {
    total += calculateLineDuration(line.words.length);
    if (line.speakerChange) total += 50;  // SPEAKER_PAUSE
    if (line.dramatic) total += 70;        // DRAMATIC_PAUSE
  }
  return total;
}
```

**Rule**: If viewers can't finish reading before text changes, pacing is too fast.

---

## 4. Transition Clarity

Transitions must be unambiguous. The viewer should never see two unrelated elements at the same time.

### Anti-Pattern: Overlapping Transitions

```typescript
// WRONG - outro starts while content is still visible
<Sequence from={contentEnd - 30}>
  <Outro />
</Sequence>
```

### Correct Pattern: Sequential Transitions

```typescript
// RIGHT - content fades out, THEN outro fades in
const CONTENT_FADE_OUT = 30;
const GAP = 10;

<Sequence durationInFrames={contentEnd}>
  <Content fadeOutDuration={CONTENT_FADE_OUT} />
</Sequence>

<Sequence from={contentEnd + GAP}>
  <Outro fadeInDuration={30} />
</Sequence>
```

### Transition Timing Guidelines

```yaml
content_fade_out: 20-30 frames (0.7-1.0 sec)
gap_before_outro: 10-20 frames (0.3-0.7 sec)
outro_fade_in: 30-45 frames (1.0-1.5 sec)
outro_duration: 90-150 frames (3-5 sec)
```

**Rule**: If two unrelated elements overlap during transition, add a gap.

---

## 5. Theme Distinctiveness

Two themes with the same layout and effects but different colors are the SAME THEME. Distinctiveness requires:

### Distinctiveness Checklist

| Element | Must Differ Between Similar Themes |
|---------|-----------------------------------|
| Background treatment | Static vs animated, solid vs gradient |
| Text effects | Shadow vs glow vs none |
| Highlight style | Underline vs box vs bracket vs color-only |
| Entrance animation | Fade vs slide vs typewriter |
| Layout style | Centered vs left-aligned vs asymmetric |

### Example: Two Light Themes Made Distinct

```typescript
// Light Theme A: "Elegant"
const elegantTheme = {
  colors: { bg: '#F8F8F8', fg: '#1A1A1A', accent: '#C4A052' },
  effects: { textShadow: '1px 1px 2px rgba(0,0,0,0.1)' },
  distinctiveness: {
    backgroundAnimation: 'subtle-gradient-shift',
    highlightStyle: 'thin-underline',
    entranceAnimation: 'fade-up',
  }
};

// Light Theme B: "Minimalist" - MUST differ in effects/animation, not just colors
const minimalistTheme = {
  colors: { bg: '#FFFFFF', fg: '#2D2D2D', accent: '#333333' },
  effects: { textShadow: 'none' },  // Different effect
  distinctiveness: {
    backgroundAnimation: 'none',           // Different background
    highlightStyle: 'bracket',             // Different highlight
    entranceAnimation: 'typewriter',       // Different entrance
  }
};
```

### Distinctiveness Audit Questions

1. **Screenshot test**: Can you tell themes apart in a still frame?
2. **Mute test**: Can you tell themes apart with audio off?
3. **Squint test**: Can you tell themes apart at thumbnail size?

**Rule**: If two themes only differ by hex values, one of them is redundant.

---

## 6. Depth & Visual Richness

Flat design works for web but reads as "cheap" in video. Add depth:

### Light Theme Depth

```typescript
// Subtle shadows for light themes
const lightThemeEffects = {
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)',
  containerShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  highlightGradient: 'linear-gradient(90deg, transparent, rgba(196, 160, 82, 0.2), transparent)',
};
```

### Dark Theme Depth

```typescript
// Glow effects for dark themes
const darkThemeEffects = {
  textGlow: '0 0 20px rgba(255, 255, 255, 0.3)',
  accentGlow: '0 0 30px rgba(0, 230, 118, 0.4)',
  containerBorder: '1px solid rgba(255, 255, 255, 0.1)',
};
```

### Background Richness

```typescript
// Static backgrounds feel dead in video
// Add subtle animation or texture

// Option 1: Animated gradient
background: `linear-gradient(${angle}deg, ${color1}, ${color2})`;
// Animate 'angle' slowly (360° over 60 seconds)

// Option 2: Floating particles
<FloatingParticles count={30} opacity={0.1} />

// Option 3: Texture overlay
<div style={{
  backgroundImage: 'url(noise.png)',
  opacity: 0.03,
  mixBlendMode: 'overlay'
}} />
```

**Rule**: If the background is a solid color with no movement, the video feels static.

---

## Quick Reference: Quality Checklist

Before rendering, verify:

```yaml
Typography:
  [ ] Body text ≥46px
  [ ] Display text ≥64px
  [ ] maxWidth ≥1400px (for 1080p)
  [ ] padding ≤60px

Pacing:
  [ ] Word duration ≥18 frames (0.6 sec)
  [ ] Line pauses included
  [ ] Speaker changes have extra pause
  [ ] Transitions don't overlap

Theme Completeness:
  [ ] 5 colors defined (including muted)
  [ ] Effects specified (shadow OR glow)
  [ ] Layout style chosen
  [ ] Unique visual treatment per theme

Transitions:
  [ ] Content fades out completely
  [ ] Gap before outro
  [ ] Outro fades in separately
```

---

## Sources

- Lessons learned from Macbeth read-along project (2025)
- TV typography standards (minimum 42px for NTSC safe area)
- Reading speed research: 200-250 WPM comfortable, 150 WPM for unfamiliar content
