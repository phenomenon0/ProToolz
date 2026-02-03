// Command medialab provides CLI control for the multi-screen media player.
//
// Usage:
//
//	medialab play <url> [--screen N]
//	medialab search <query> [--play] [--screen N]
//	medialab pause [--screen N]
//	medialab play [--screen N]
//	medialab toggle [--screen N]
//	medialab stop [--screen N]
//	medialab next [--screen N]
//	medialab prev [--screen N]
//	medialab volume <0-100> [--screen N]
//	medialab seek <seconds> [--relative] [--screen N]
//	medialab info [--screen N]
//	medialab list
//	medialab setup  # Generate mpv config and shell scripts
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/phenomenon0/Agent-GO/pkg/medialab"
)

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	lab := medialab.New(nil)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	cmd := os.Args[1]
	args := os.Args[2:]

	switch cmd {
	case "play":
		cmdPlay(ctx, lab, args)
	case "search":
		cmdSearch(ctx, lab, args)
	case "pause":
		cmdControl(lab, "pause", args)
	case "resume":
		cmdControl(lab, "play", args)
	case "toggle", "playpause":
		cmdControl(lab, "playpause", args)
	case "stop", "quit":
		cmdControl(lab, "stop", args)
	case "next":
		cmdControl(lab, "next", args)
	case "prev", "previous":
		cmdControl(lab, "prev", args)
	case "fullscreen", "fs":
		cmdControl(lab, "fullscreen", args)
	case "volume", "vol":
		cmdVolume(lab, args)
	case "seek":
		cmdSeek(lab, args)
	case "info", "status":
		cmdInfo(lab, args)
	case "list", "ls":
		cmdList(lab)
	case "setup":
		cmdSetup()
	case "help", "--help", "-h":
		printUsage()
	default:
		fmt.Fprintf(os.Stderr, "unknown command: %s\n", cmd)
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Println(`medialab - Multi-screen media player control

USAGE:
    medialab <command> [options]

COMMANDS:
    play <url>              Play URL/file (YouTube URLs work directly)
    search <query>          Search YouTube
    pause                   Pause playback
    resume                  Resume playback
    toggle                  Toggle play/pause
    stop                    Stop playback
    next                    Next in playlist
    prev                    Previous in playlist
    fullscreen              Toggle fullscreen
    volume <0-100>          Set volume
    seek <seconds>          Seek to position
    info                    Show playback info
    list                    List active players
    setup                   Generate mpv config and scripts

OPTIONS:
    --screen N, -s N        Target screen (1-4, default: 1)
    --play, -p              Play first search result
    --relative, -r          Seek relative to current position

EXAMPLES:
    medialab play "https://youtube.com/watch?v=..."
    medialab play "lofi hip hop" --screen 2
    medialab search "synthwave mix" --play
    medialab volume 50 --screen 1
    medialab seek -30 --relative
    medialab toggle --screen 2`)
}

func parseScreen(args []string) (medialab.Screen, []string) {
	screen := medialab.Screen1
	remaining := make([]string, 0, len(args))

	for i := 0; i < len(args); i++ {
		arg := args[i]
		if arg == "--screen" || arg == "-s" {
			if i+1 < len(args) {
				n, err := strconv.Atoi(args[i+1])
				if err == nil && n >= 1 && n <= 4 {
					screen = medialab.Screen(n - 1)
				}
				i++
			}
		} else {
			remaining = append(remaining, arg)
		}
	}
	return screen, remaining
}

func hasFlag(args []string, flags ...string) bool {
	for _, arg := range args {
		for _, flag := range flags {
			if arg == flag {
				return true
			}
		}
	}
	return false
}

func cmdPlay(ctx context.Context, lab *medialab.MediaLab, args []string) {
	screen, remaining := parseScreen(args)

	if len(remaining) == 0 {
		// No URL = resume
		if err := lab.Resume(screen); err != nil {
			fmt.Fprintf(os.Stderr, "resume failed: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Resumed on screen %d\n", int(screen)+1)
		return
	}

	url := strings.Join(remaining, " ")

	// If it doesn't look like a URL, treat as YouTube search
	if !strings.Contains(url, "://") && !strings.HasPrefix(url, "/") && !strings.HasPrefix(url, ".") {
		instance, err := lab.PlayYouTubeSearch(ctx, url, screen)
		if err != nil {
			fmt.Fprintf(os.Stderr, "play failed: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Playing on screen %d (PID %d): %s\n", int(screen)+1, instance.PID, instance.URL)
		return
	}

	instance, err := lab.Play(ctx, url, screen)
	if err != nil {
		fmt.Fprintf(os.Stderr, "play failed: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Playing on screen %d (PID %d): %s\n", int(screen)+1, instance.PID, url)
}

func cmdSearch(ctx context.Context, lab *medialab.MediaLab, args []string) {
	screen, remaining := parseScreen(args)
	playFirst := hasFlag(args, "--play", "-p")

	// Remove flags from remaining
	query := ""
	for _, arg := range remaining {
		if arg != "--play" && arg != "-p" {
			query += arg + " "
		}
	}
	query = strings.TrimSpace(query)

	if query == "" {
		fmt.Fprintln(os.Stderr, "search query required")
		os.Exit(1)
	}

	results, err := lab.SearchYouTube(ctx, query, 10)
	if err != nil {
		fmt.Fprintf(os.Stderr, "search failed: %v\n", err)
		os.Exit(1)
	}

	if len(results) == 0 {
		fmt.Println("No results found")
		return
	}

	if playFirst {
		instance, err := lab.Play(ctx, results[0].URL, screen)
		if err != nil {
			fmt.Fprintf(os.Stderr, "play failed: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Playing on screen %d: %s\n", int(screen)+1, results[0].Title)
		fmt.Printf("  Channel: %s | Duration: %s\n", results[0].Channel, results[0].Duration)
		fmt.Printf("  PID: %d\n", instance.PID)
		return
	}

	fmt.Printf("YouTube search: %s\n\n", query)
	for i, r := range results {
		fmt.Printf("%2d. %s\n", i+1, r.Title)
		fmt.Printf("    %s | %s\n", r.Channel, r.Duration)
		fmt.Printf("    %s\n\n", r.URL)
	}
}

func cmdControl(lab *medialab.MediaLab, action string, args []string) {
	screen, _ := parseScreen(args)

	var err error
	switch action {
	case "playpause":
		err = lab.PlayPause(screen)
	case "pause":
		err = lab.Pause(screen)
	case "play":
		err = lab.Resume(screen)
	case "stop":
		err = lab.Stop(screen)
	case "next":
		err = lab.Next(screen)
	case "prev":
		err = lab.Prev(screen)
	case "fullscreen":
		err = lab.Fullscreen(screen)
	}

	if err != nil {
		fmt.Fprintf(os.Stderr, "%s failed: %v\n", action, err)
		os.Exit(1)
	}
	fmt.Printf("%s on screen %d\n", action, int(screen)+1)
}

func cmdVolume(lab *medialab.MediaLab, args []string) {
	screen, remaining := parseScreen(args)

	if len(remaining) == 0 {
		// Get current volume
		info, err := lab.GetPlaybackInfo(screen)
		if err != nil {
			fmt.Fprintf(os.Stderr, "failed to get volume: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Volume on screen %d: %.0f\n", int(screen)+1, info.Volume)
		return
	}

	vol, err := strconv.Atoi(remaining[0])
	if err != nil {
		fmt.Fprintf(os.Stderr, "invalid volume: %s\n", remaining[0])
		os.Exit(1)
	}

	if err := lab.SetVolume(screen, vol); err != nil {
		fmt.Fprintf(os.Stderr, "volume failed: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Volume set to %d on screen %d\n", vol, int(screen)+1)
}

func cmdSeek(lab *medialab.MediaLab, args []string) {
	screen, remaining := parseScreen(args)
	relative := hasFlag(args, "--relative", "-r")

	// Remove flags
	var posStr string
	for _, arg := range remaining {
		if arg != "--relative" && arg != "-r" {
			posStr = arg
			break
		}
	}

	if posStr == "" {
		fmt.Fprintln(os.Stderr, "position required")
		os.Exit(1)
	}

	pos, err := strconv.ParseFloat(posStr, 64)
	if err != nil {
		fmt.Fprintf(os.Stderr, "invalid position: %s\n", posStr)
		os.Exit(1)
	}

	if err := lab.Seek(screen, pos, relative); err != nil {
		fmt.Fprintf(os.Stderr, "seek failed: %v\n", err)
		os.Exit(1)
	}

	mode := "absolute"
	if relative {
		mode = "relative"
	}
	fmt.Printf("Seek %s %.1fs on screen %d\n", mode, pos, int(screen)+1)
}

func cmdInfo(lab *medialab.MediaLab, args []string) {
	screen, _ := parseScreen(args)

	info, err := lab.GetPlaybackInfo(screen)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to get info: %v\n", err)
		os.Exit(1)
	}

	data, _ := json.MarshalIndent(info, "", "  ")
	fmt.Println(string(data))
}

func cmdList(lab *medialab.MediaLab) {
	players := lab.ListPlayers()

	if len(players) == 0 {
		fmt.Println("No active players")
		return
	}

	fmt.Println("Active players:")
	for _, p := range players {
		fmt.Printf("  Screen %d: PID %d\n", int(p.Screen)+1, p.PID)
		fmt.Printf("    URL: %s\n", p.URL)
		fmt.Printf("    Socket: %s\n", p.Socket)
		fmt.Printf("    Started: %s\n", p.StartedAt.Format(time.RFC3339))
	}
}

func cmdSetup() {
	home, _ := os.UserHomeDir()
	configDir := filepath.Join(home, ".config", "mpv")
	binDir := filepath.Join(home, "bin")

	// Create directories
	os.MkdirAll(configDir, 0755)
	os.MkdirAll(binDir, 0755)

	// Generate mpv.conf
	mpvConf := `# Agent-GO MediaLab Configuration
# Generated by: medialab setup

##### sensible defaults #####
profile=gpu-hq
hwdec=auto-safe
cache=yes
cache-secs=60
keep-open=yes
save-position-on-quit=yes

# nicer UX in windowed mode
border=no
osd-duration=2000

##### screen profiles #####

[screen1]
fs=yes
fs-screen=0
input-ipc-server=/tmp/mpv-screen1

[screen2]
fs=yes
fs-screen=1
input-ipc-server=/tmp/mpv-screen2

[screen3]
fs=yes
fs-screen=2
input-ipc-server=/tmp/mpv-screen3

[screen4]
fs=yes
fs-screen=3
input-ipc-server=/tmp/mpv-screen4
`

	confPath := filepath.Join(configDir, "mpv.conf")
	if err := os.WriteFile(confPath, []byte(mpvConf), 0644); err != nil {
		fmt.Fprintf(os.Stderr, "failed to write mpv.conf: %v\n", err)
	} else {
		fmt.Printf("Created: %s\n", confPath)
	}

	// Generate yt1, yt2, yt3, yt4 scripts
	for i := 1; i <= 4; i++ {
		script := fmt.Sprintf(`#!/usr/bin/env bash
# Play media on screen %d
exec mpv --profile=screen%d --input-ipc-server=/tmp/mpv-screen%d -- "$@"
`, i, i, i)

		scriptPath := filepath.Join(binDir, fmt.Sprintf("yt%d", i))
		if err := os.WriteFile(scriptPath, []byte(script), 0755); err != nil {
			fmt.Fprintf(os.Stderr, "failed to write %s: %v\n", scriptPath, err)
		} else {
			fmt.Printf("Created: %s\n", scriptPath)
		}
	}

	// Generate mpv control scripts
	for i := 1; i <= 4; i++ {
		script := fmt.Sprintf(`#!/usr/bin/env bash
# Control mpv on screen %d via IPC
sock=/tmp/mpv-screen%d
cmd="$1"

case "$cmd" in
  playpause|toggle) echo '{ "command": ["cycle", "pause"] }' | socat - "$sock" ;;
  pause)            echo '{ "command": ["set_property", "pause", true] }' | socat - "$sock" ;;
  play|resume)      echo '{ "command": ["set_property", "pause", false] }' | socat - "$sock" ;;
  next)             echo '{ "command": ["playlist-next", "weak"] }' | socat - "$sock" ;;
  prev)             echo '{ "command": ["playlist-prev", "weak"] }' | socat - "$sock" ;;
  stop|quit)        echo '{ "command": ["quit"] }' | socat - "$sock" ;;
  fullscreen|fs)    echo '{ "command": ["cycle", "fullscreen"] }' | socat - "$sock" ;;
  vol)              echo "{ \"command\": [\"set_property\", \"volume\", $2] }" | socat - "$sock" ;;
  seek)             echo "{ \"command\": [\"seek\", $2, \"absolute\"] }" | socat - "$sock" ;;
  seekrel)          echo "{ \"command\": [\"seek\", $2, \"relative\"] }" | socat - "$sock" ;;
  info)             echo '{ "command": ["get_property", "media-title"] }' | socat - "$sock" ;;
  *)
    echo "Usage: mpv%dctl {playpause|pause|play|next|prev|stop|fullscreen|vol N|seek N|seekrel N|info}"
    exit 1
    ;;
esac
`, i, i, i)

		scriptPath := filepath.Join(binDir, fmt.Sprintf("mpv%dctl", i))
		if err := os.WriteFile(scriptPath, []byte(script), 0755); err != nil {
			fmt.Fprintf(os.Stderr, "failed to write %s: %v\n", scriptPath, err)
		} else {
			fmt.Printf("Created: %s\n", scriptPath)
		}
	}

	fmt.Println("\nSetup complete!")
	fmt.Println("\nMake sure ~/bin is in your PATH:")
	fmt.Println("  export PATH=\"$HOME/bin:$PATH\"")
	fmt.Println("\nUsage examples:")
	fmt.Println("  yt1 'https://youtube.com/watch?v=...'  # Play on screen 1")
	fmt.Println("  yt2 'lofi hip hop'                     # YouTube search on screen 2")
	fmt.Println("  mpv1ctl playpause                      # Toggle screen 1")
	fmt.Println("  mpv2ctl vol 50                         # Set volume on screen 2")
	fmt.Println("  medialab search 'jazz' --play -s 2     # Search and play")
}
