# MediaPack1 Creative Leverage Pipeline

> Turn installed tools into compounding creative output: consistent style + infinite reuse + fast variant minting.

## Workspace Structure

```
~/MediaPack/
├── assets/
│   ├── _incoming/
│   ├── _cache/
│   └── by_hash/<sha256>/
├── manifests/
│   ├── assets.ledger.yaml
│   ├── style.dna.yaml
│   └── blueprints/*.yaml
├── templates/
│   ├── style/
│   └── compositions/
├── projects/<name>/
├── renders/<name>/<variant>/
└── reports/
```

---

## Module 1: Asset Ledger

**Leverage:** Every asset becomes reusable capital; no more folder-chaos.

### Schema

```yaml
asset_record:
  id: "slug or uuid"
  sha256: "content hash"
  kind: "broll|sfx|music|font|lut|icon|overlay|model|hdr|texture|caption"
  source:
    url: ""
    author: ""
    license: ""
    attribution: ""
    notes: ""
  tags: ["mood:dark", "tempo:fast", "brand:safe", "use:endcard"]
  tech:
    duration_s: 0
    fps: 0
    w: 0
    h: 0
    codec: ""
    alpha: false
  status: "approved|needs_review|banned"
```

### Commands

```bash
mediapack1 pack add <path> --kind <kind> --tags ... --license ... --source <url>
mediapack1 pack verify
mediapack1 pack search <query>
```

### Acceptance Criteria

- `pack verify` returns 0
- Every asset has license + status
- No duplicate sha256 records

---

## Module 2: Style DNA Pack

**Leverage:** You stop designing from scratch. You "sample your own taste" deterministically.

A compact token system for visual + motion + audio identity. Your agent can generate cohesive visuals without debating fonts/colors every time.

### Schema

```yaml
style_dna:
  fonts:
    primary: {name: "Inter", weights: [400, 600, 800]}
    display: {name: "Space Grotesk", weights: [400, 600, 700]}
    mono: {name: "JetBrains Mono", weights: [400, 600]}

  color:
    bg: ["#0A0A0A", "#101010"]
    fg: ["#FAFAFA", "#D8D8D8"]
    accent: ["#7C3AED", "#22C55E", "#06B6D4"]
    danger: ["#EF4444"]

  layout_tokens:
    safe_margin_px: 72
    corner_radius_px: [18, 28]
    shadow: ["soft", "medium"]
    grid: {cols: 12, gutter_px: 24}

  motion_tokens:
    easing: ["expoOut", "quadOut", "backOut"]
    durations_ms:
      micro: 120
      short: 220
      medium: 360
      long: 600
    transitions:
      allowed: ["fade", "push", "mask_wipe", "scale_in"]
      max_per_minute: 6
    typography:
      title_anim: "rise+blur"
      lowerthird_anim: "slide+settle"

  audio_tokens:
    loudness_target_lufs: -14
    sfx_density: "low|medium"
    music_bpm_bands: [80, 95, 120]
    stingers:
      intro: "asset_id"
      outro: "asset_id"

  caption_tokens:
    style: "karaoke|word_pop|clean_subs"
    max_chars_per_line: 32
    highlight_color: "#22C55E"
    box:
      enabled: true
      padding_px: 18
      blur_bg: 14
```

### Commands

```bash
mediapack1 style init
mediapack1 style apply --project <name> --dna manifests/style.dna.yaml
mediapack1 style lint --dna manifests/style.dna.yaml
```

### Acceptance Criteria

- Style lint passes (fonts exist, colors valid, motion presets defined)
- At least 1 caption style + 1 title style + 1 endcard style defined
- Agent can render 3 different videos that still look like the same "brand"

---

## Module 3: Template Forge

**Leverage:** You mint videos like software builds: one blueprint produces infinite outputs.

A minimal "video blueprint" file compiles into a project scaffold (Remotion or ffmpeg script), then produces platform variants (9:16 / 1:1 / 16:9, captions-on/off, CTA swaps).

### Blueprint Schema

```yaml
blueprint:
  meta:
    id: "slug"
    title: ""
    fps: 30
    duration_s: 30
    aspect: "9:16"

  inputs:
    data: "path/to/data.json"
    voiceover: {optional: true, asset_id: ""}
    music: {optional: true, asset_id: ""}
    captions: {optional: true, srt: "path/to.srt"}
    visuals:
      - {slot: "hero", kind: "image|video|model", asset_id: ""}
      - {slot: "broll", kind: "video", asset_id: ""}

  structure:
    - {t: 0.0,  type: "title_card",  duration: 2.0}
    - {t: 2.0,  type: "explainer",   duration: 18.0}
    - {t: 20.0, type: "demo",        duration: 7.0}
    - {t: 27.0, type: "endcard_cta", duration: 3.0}

  style:
    dna_ref: "manifests/style.dna.yaml"
    caption_style: "clean_subs"

  variants:
    - {name: "shorts_9x16", aspect: "9:16", captions: true,  cta: "follow"}
    - {name: "square_1x1",  aspect: "1:1",  captions: true,  cta: "link"}
    - {name: "yt_16x9",     aspect: "16:9", captions: false, cta: "subscribe"}
```

### Commands

```bash
mediapack1 forge compile manifests/blueprints/<id>.yaml
mediapack1 forge render <project> --all-variants
mediapack1 forge batch <folder_of_blueprints>
```

### Acceptance Criteria

- Compile is idempotent (running twice yields same scaffold)
- Renders produce 3 variants with correct aspect + safe margins
- Captions never exceed max_chars_per_line; endcard always visible

---

## Design Principles

| Principle | Why |
|-----------|-----|
| **Style DNA: small + strict** | Small enough to memorize, strict enough to enforce. Everything looks like "you". |
| **Template Forge: boring + deterministic** | Batch-generate without babysitting. No improvisation. |
| **Asset Ledger: hash-based** | Deduplication, provenance, instant lookup. |

## What This Enables

1. **Consistent aesthetic** (Style DNA) — stop debating fonts/colors
2. **Reusable assets** (Ledger) — no folder chaos, instant search
3. **Mass output** (Forge) — one blueprint → infinite platform variants

Agents stop improvising structure; they execute a spec.
