---
name: medialab
description: Multi-screen media player control for agents. Play YouTube/files on specific screens, control playback (pause/play/volume/seek), search YouTube, and manage multiple simultaneous players via mpv IPC.
version: 1.0.0
---

# MediaLab Skill

Control media playback across multiple screens. Built on mpv + yt-dlp with JSON IPC for precise per-instance control.

---

## When I activate

Activate when you:
- need to **play media** (YouTube, local files, streams) on a specific screen
- want to **control playback** (pause, resume, volume, seek, next/prev)
- need to **search YouTube** and play results
- want to **manage multiple players** across screens simultaneously
- hear "play music", "put video on screen 2", "pause the video", "turn down volume"

---

## What I can do

### Play media
```bash
# Play YouTube URL on screen 1
medialab play "https://youtube.com/watch?v=..." --screen 1

# Search YouTube and play (first result)
medialab play "lofi hip hop" --screen 2

# Play local file
medialab play "/path/to/video.mp4"
```

### Control playback
```bash
medialab pause --screen 1      # Pause
medialab resume --screen 1     # Resume
medialab toggle --screen 1     # Toggle play/pause
medialab stop --screen 1       # Stop and close
medialab next --screen 1       # Next in playlist
medialab prev --screen 1       # Previous
medialab fullscreen --screen 1 # Toggle fullscreen
```

### Volume control
```bash
medialab volume 50 --screen 1  # Set to 50%
medialab volume 0 --screen 1   # Mute
```

### Seek
```bash
medialab seek 120 --screen 1           # Jump to 2:00
medialab seek 30 --relative --screen 1 # Skip forward 30s
medialab seek -10 --relative --screen 1 # Rewind 10s
```

### Get info
```bash
medialab info --screen 1  # Current track, position, volume, etc.
medialab list             # All active players
```

### Search YouTube
```bash
medialab search "synthwave mix"           # List results
medialab search "jazz" --play --screen 2  # Search and play first result
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      MediaLab                                │
│  Go library + CLI + HTTP server + Agent skills              │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
        ┌───────▼───────┐             ┌───────▼───────┐
        │   mpv (IPC)   │             │   yt-dlp      │
        │ /tmp/mpv-*    │             │   YouTube     │
        │ per-screen    │             │   search      │
        └───────────────┘             └───────────────┘
```

Each screen gets its own:
- mpv instance with dedicated IPC socket (`/tmp/mpv-screen1`, etc.)
- Independent playback state
- Separate volume/position control

---

## Screen mapping (X11)

On X11, screens map to monitor indices:
- `--screen 1` → fs-screen=0 (typically primary/left)
- `--screen 2` → fs-screen=1 (secondary/right)

On Wayland, screen targeting is compositor-dependent. The playback and control features work regardless.

---

## Dependencies

| Tool | Purpose | Install |
|------|---------|---------|
| mpv | Media player | `dnf install mpv` |
| yt-dlp | YouTube support | `pip install yt-dlp` |
| socat | Shell IPC scripts | `dnf install socat` |
| playerctl | MPRIS integration | `dnf install playerctl` |

---

## Setup

Run once to generate mpv config and shell shortcuts:
```bash
medialab setup
```

Creates:
- `~/.config/mpv/mpv.conf` with screen profiles
- `~/bin/yt1` - `~/bin/yt4` (play shortcuts)
- `~/bin/mpv1ctl` - `~/bin/mpv4ctl` (control scripts)

---

## Agent skills (Go integration)

Register with Agent-GO's tool registry:

```go
import "github.com/phenomenon0/Agent-GO/pkg/medialab"

lab := medialab.New(nil)
medialab.RegisterSkills(registry, lab)
```

Exposes these tools:
- `media.play` - Play URL/query on screen
- `media.control` - Playback control
- `media.volume` - Volume control
- `media.seek` - Seek position
- `media.info` - Get playback info
- `media.search` - YouTube search
- `media.list` - List active players

---

## HTTP API

Start the HTTP server:
```go
server := medialab.NewServer(lab)
server.Start(":8090")
```

Endpoints:
- `POST /play` - `{"url": "...", "screen": 1}` or `{"query": "...", "screen": 1}`
- `POST /control` - `{"action": "pause", "screen": 1}`
- `POST /volume` - `{"volume": 50, "screen": 1}`
- `POST /seek` - `{"position": 120, "relative": false, "screen": 1}`
- `GET /info?screen=1` - Playback info
- `GET /search?q=lofi&max=5` - YouTube search
- `GET /list` - Active players
- `GET /health` - Health check

---

## Examples for agents

**User says:** "Play some chill music on my second monitor"
```bash
medialab play "chill lofi beats" --screen 2
```

**User says:** "Pause the video"
```bash
medialab pause --screen 1
# or if multiple screens active:
medialab pause --screen 1 && medialab pause --screen 2
```

**User says:** "Turn down the volume a bit"
```bash
# Get current, reduce by ~20
medialab volume 60 --screen 1
```

**User says:** "Skip forward 30 seconds"
```bash
medialab seek 30 --relative --screen 1
```

**User says:** "What's playing?"
```bash
medialab info --screen 1
```

---

## Source code

- Package: `/home/omen/Documents/Project/Agent-GO/pkg/medialab/`
- CLI: `/home/omen/Documents/Project/Agent-GO/cmd/medialab/`
- Binary: `/home/omen/Documents/Project/Agent-GO/bin/medialab`
