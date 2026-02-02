# Creative Palette: Elite Fonts + 40-Color System

> Curated combos first. Rule-based variation built in.

---

## Part 1: Elite Font Combos

### Tier 1: The Untouchables (Modern Classics)

| Combo | Display | Body | Mono | Vibe |
|-------|---------|------|------|------|
| **Tech Flagship** | Space Grotesk 700 | Inter 400/500 | JetBrains Mono | Clean, future-forward, trustworthy |
| **Editorial Premium** | Playfair Display 700 | Source Serif 4 400 | IBM Plex Mono | Sophisticated, authoritative, timeless |
| **Startup Energy** | Satoshi 900 | Satoshi 400/500 | Fira Code | Sharp, modern, approachable |
| **Swiss Precision** | Helvetica Neue 700 | Helvetica Neue 400 | SF Mono | Neutral, professional, bulletproof |
| **Creative Studio** | Clash Display 600 | General Sans 400 | Space Mono | Bold, artistic, confident |

### Tier 2: Power Pairs (High Impact)

| Combo | Display | Body | Use Case |
|-------|---------|------|----------|
| **Neo Brutalist** | Bebas Neue | Work Sans | Bold statements, manifesto content |
| **Luxury Minimal** | Cormorant Garamond 600 | Lato 400 | High-end brands, premium content |
| **Developer Docs** | Manrope 700 | Manrope 400 | Technical content, SaaS, dashboards |
| **Motion Graphics** | Outfit 800 | Outfit 400 | Video, animation, dynamic content |
| **Geometric Clean** | Poppins 700 | Nunito Sans 400 | Friendly tech, education, apps |

### Tier 3: Specialty Weapons

| Font | Weight | When to Deploy |
|------|--------|----------------|
| **Archivo Black** | 900 | Headlines that punch through noise |
| **Cabinet Grotesk** | 800 | Premium SaaS, fintech |
| **Syne** | 700-800 | Creative/experimental projects |
| **Plus Jakarta Sans** | 600-800 | Modern Indonesian/SEA aesthetic |
| **Red Hat Display** | 700 | Open source / developer brands |
| **DM Sans** | 500-700 | Google-esque clean UI |
| **Geist** | 400-700 | Vercel-style minimalism |
| **Instrument Sans** | 500-600 | Refined, European feel |

### Font Variation Rules

```yaml
font_variation:
  weight_shift:
    emphasis: +200  # 400 → 600 for emphasis
    deemphasis: -100  # 400 → 300 for captions

  size_scale:
    ratio: 1.25  # Major Third
    levels: [12, 15, 19, 24, 30, 37, 47, 59]

  tracking:
    display_tight: -0.02em
    body_normal: 0
    mono_wide: 0.05em
    uppercase: 0.1em

  line_height:
    display: 1.1
    body: 1.6
    tight: 1.3
```

---

## Part 2: The 40-Color Palette

### Source Philosophy

| Source | What It Gives |
|--------|---------------|
| **Bauhaus** | Primary purity, confident primaries, functional neutrals |
| **Swiss/International** | Precise reds, clean blacks, rational grays |
| **Nature** | Organic warmth, sky blues, earth tones, forest depths |
| **Web/Digital** | Accessible contrast, screen-optimized, vibrant accents |

---

### The 40 Colors

#### Blacks & Whites (8)

| ID | Name | Hex | Source | Use |
|----|------|-----|--------|-----|
| N01 | Void | `#000000` | Universal | True black, maximum contrast |
| N02 | Obsidian | `#0A0A0A` | Digital | Rich black, less harsh |
| N03 | Charcoal | `#1A1A1A` | Swiss | Dark backgrounds |
| N04 | Graphite | `#2D2D2D` | Digital | Elevated surfaces |
| N05 | Slate | `#4A4A4A` | Nature | Secondary text |
| N06 | Stone | `#6B6B6B` | Nature | Muted elements |
| N07 | Silver | `#A0A0A0` | Swiss | Disabled states |
| N08 | Pearl | `#F5F5F5` | Digital | Off-white backgrounds |
| N09 | Pure | `#FFFFFF` | Universal | True white |

#### Bauhaus Primaries (6)

| ID | Name | Hex | Source | Use |
|----|------|-----|--------|-----|
| B01 | Bauhaus Red | `#E53935` | Bauhaus | Primary action, alerts |
| B02 | Bauhaus Blue | `#1E88E5` | Bauhaus | Links, info, trust |
| B03 | Bauhaus Yellow | `#FDD835` | Bauhaus | Highlights, warnings |
| B04 | Itten Orange | `#FB8C00` | Itten wheel | Energy, CTAs |
| B05 | Kandinsky Violet | `#7B1FA2` | Bauhaus | Premium, creative |
| B06 | Klee Green | `#43A047` | Bauhaus | Success, growth |

#### Swiss Precision (6)

| ID | Name | Hex | Source | Use |
|----|------|-----|--------|-----|
| S01 | Swiss Red | `#FF0000` | Swiss posters | Bold statements |
| S02 | Helvetica Black | `#121212` | Swiss type | Headlines |
| S03 | Grid Gray | `#E0E0E0` | Swiss grids | Borders, dividers |
| S04 | Signal Yellow | `#FFEB3B` | Swiss signage | Attention |
| S05 | Akzidenz Blue | `#0D47A1` | Swiss corporate | Authority |
| S06 | Neutral Warm | `#FAFAFA` | Swiss paper | Clean backgrounds |

#### Nature Organic (10)

| ID | Name | Hex | Source | Use |
|----|------|-----|--------|-----|
| T01 | Ocean Deep | `#1565C0` | Sea | Depth, calm |
| T02 | Sky Clear | `#64B5F6` | Sky | Open, friendly |
| T03 | Forest | `#2E7D32` | Trees | Natural, sustainable |
| T04 | Sage | `#81C784` | Herbs | Soft success |
| T05 | Earth | `#795548` | Soil | Grounded, organic |
| T06 | Sand | `#D7CCC8` | Desert | Warm neutral |
| T07 | Sunset | `#FF7043` | Dusk | Warm energy |
| T08 | Coral | `#FF8A80` | Reef | Soft accent |
| T09 | Midnight | `#0D1B2A` | Night | Deep dark mode |
| T10 | Aurora | `#00E676` | Northern lights | Electric accent |

#### Web/Digital Native (10)

| ID | Name | Hex | Source | Use |
|----|------|-----|--------|-----|
| W01 | Link Blue | `#2563EB` | Web standard | Links |
| W02 | Success | `#22C55E` | UI pattern | Confirmations |
| W03 | Warning | `#F59E0B` | UI pattern | Cautions |
| W04 | Error | `#EF4444` | UI pattern | Errors |
| W05 | Info | `#3B82F6` | UI pattern | Information |
| W06 | Vercel Black | `#000000` | Vercel | Modern dark |
| W07 | Discord Purple | `#5865F2` | Discord | Community |
| W08 | Stripe Purple | `#635BFF` | Stripe | Fintech |
| W09 | Linear Blue | `#5E6AD2` | Linear | Product |
| W10 | Figma Gradient Start | `#F24E1E` | Figma | Creative tools |

---

### Rule-Based Variation System

#### Color Modifiers

```yaml
color_modifiers:
  # Opacity variants (apply to any color)
  opacity:
    solid: 1.0
    high: 0.87
    medium: 0.60
    low: 0.38
    ghost: 0.12
    hint: 0.05

  # Lightness shift (HSL manipulation)
  lightness:
    lighter_3: +30%
    lighter_2: +20%
    lighter_1: +10%
    base: 0
    darker_1: -10%
    darker_2: -20%
    darker_3: -30%

  # Saturation shift
  saturation:
    vivid: +20%
    base: 0
    muted: -20%
    desaturated: -40%
    gray: -100%
```

#### Semantic Mapping

```yaml
semantic_colors:
  # Map abstract roles to palette IDs
  primary: W01      # Link Blue
  secondary: N05    # Slate
  accent: W08       # Stripe Purple

  success: W02      # Success Green
  warning: W03      # Warning Amber
  error: W04        # Error Red
  info: W05         # Info Blue

  background:
    light: N08      # Pearl
    dark: N03       # Charcoal

  text:
    primary:
      light: N02    # Obsidian on light bg
      dark: N08     # Pearl on dark bg
    secondary:
      light: N05    # Slate
      dark: N06     # Stone
    muted:
      light: N06    # Stone
      dark: N07     # Silver
```

#### Theme Presets

```yaml
themes:
  bauhaus_bold:
    bg: N09
    fg: N01
    accent: B01
    secondary: B02
    highlight: B03

  swiss_clean:
    bg: S06
    fg: S02
    accent: S01
    secondary: S05
    highlight: S04

  nature_calm:
    bg: T06
    fg: T09
    accent: T01
    secondary: T03
    highlight: T07

  dark_mode_pro:
    bg: N03
    fg: N08
    accent: W08
    secondary: W01
    highlight: T10

  midnight_aurora:
    bg: T09
    fg: N08
    accent: T10
    secondary: W07
    highlight: T02
```

#### Contrast Rules

```yaml
contrast_rules:
  # WCAG AA requirements
  minimum_ratio:
    normal_text: 4.5
    large_text: 3.0
    ui_components: 3.0

  # Auto-select text color
  text_on_color:
    light_threshold: 0.55  # If luminance > 0.55, use dark text
    dark_text: N02
    light_text: N08

  # Safe pairs (pre-validated)
  guaranteed_pairs:
    - [N08, N02]   # Pearl on Obsidian
    - [N08, T09]   # Pearl on Midnight
    - [N02, N08]   # Obsidian on Pearl
    - [B03, N02]   # Yellow on dark
    - [T10, T09]   # Aurora on Midnight
    - [W01, N08]   # Link Blue on Pearl
```

---

## Part 3: Quick Reference Combos

### Ready-to-Use Stacks

```yaml
# Tech SaaS Dark
tech_saas_dark:
  fonts:
    display: "Space Grotesk 700"
    body: "Inter 400"
    mono: "JetBrains Mono 400"
  colors:
    bg: "#0A0A0A"
    fg: "#F5F5F5"
    accent: "#635BFF"  # Stripe Purple
    success: "#22C55E"
    muted: "#6B6B6B"

# Editorial Light
editorial_light:
  fonts:
    display: "Playfair Display 700"
    body: "Source Serif 4 400"
    mono: "IBM Plex Mono 400"
  colors:
    bg: "#FAFAFA"
    fg: "#1A1A1A"
    accent: "#0D47A1"  # Akzidenz Blue
    highlight: "#FDD835"
    muted: "#6B6B6B"

# Startup Bold
startup_bold:
  fonts:
    display: "Satoshi 900"
    body: "Satoshi 400"
    mono: "Fira Code 400"
  colors:
    bg: "#FFFFFF"
    fg: "#0A0A0A"
    accent: "#E53935"  # Bauhaus Red
    secondary: "#1E88E5"
    highlight: "#FDD835"

# Creative Studio
creative_studio:
  fonts:
    display: "Clash Display 600"
    body: "General Sans 400"
    mono: "Space Mono 400"
  colors:
    bg: "#0D1B2A"  # Midnight
    fg: "#F5F5F5"
    accent: "#00E676"  # Aurora
    secondary: "#5865F2"  # Discord Purple
    highlight: "#FF7043"  # Sunset
```

---

## Sources

- [Typewolf - Space Grotesk Combinations](https://www.typewolf.com/space-grotesk)
- [Medium - Best Google Font Pairings 2025](https://medium.com/design-bootcamp/best-google-font-pairings-for-ui-design-in-2025-ba8d006aa03d)
- [Bauhaus Colour Theory - IMM Cologne](https://www.imm-cologne.com/magazine-archive/design-and-architecture/bauhaus-colour/)
- [Swiss Design History - Big Human](https://www.bighuman.com/blog/guide-to-swiss-design-style)
