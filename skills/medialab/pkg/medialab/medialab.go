// Package medialab provides agent-controllable media playback across multiple screens.
//
// Architecture:
//   - mpv instances per screen with IPC sockets (/tmp/mpv-screen{N})
//   - MPRIS integration via mpv-mpris plugin
//   - playerctl for generic media control
//   - JSON IPC for precise per-instance control
//
// Skills exposed:
//   - media.play: Play URL/file on specified screen
//   - media.control: Playback control (pause/play/stop/next/prev)
//   - media.volume: Volume control
//   - media.seek: Seek to position
//   - media.info: Get current playback info
//   - media.search: Search YouTube (via yt-dlp)
package medialab

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"
)

// Screen identifies a display target
type Screen int

const (
	Screen1 Screen = 0
	Screen2 Screen = 1
	Screen3 Screen = 2
	Screen4 Screen = 3
)

// SocketPath returns the IPC socket path for a screen
func (s Screen) SocketPath() string {
	return fmt.Sprintf("/tmp/mpv-screen%d", s+1)
}

// ProfileName returns the mpv profile name for a screen
func (s Screen) ProfileName() string {
	return fmt.Sprintf("screen%d", s+1)
}

// Config holds media lab configuration
type Config struct {
	MPVBinary     string
	MPVConfigDir  string
	DefaultScreen Screen
	Profiles      map[Screen]string
	YTDLPBinary   string
	PlayerctlPath string
	IPCTimeout    time.Duration
	DefaultVolume int
}

// DefaultConfig returns sensible defaults
func DefaultConfig() *Config {
	homeDir, _ := os.UserHomeDir()
	return &Config{
		MPVBinary:     "mpv",
		MPVConfigDir:  filepath.Join(homeDir, ".config", "mpv"),
		DefaultScreen: Screen1,
		Profiles:      make(map[Screen]string),
		YTDLPBinary:   "yt-dlp",
		PlayerctlPath: "playerctl",
		IPCTimeout:    5 * time.Second,
		DefaultVolume: 80,
	}
}

// MediaLab manages multi-screen media playback
type MediaLab struct {
	config  *Config
	mu      sync.RWMutex
	players map[Screen]*PlayerInstance
}

// PlayerInstance tracks an active mpv instance
type PlayerInstance struct {
	Screen    Screen
	PID       int
	Socket    string
	URL       string
	StartedAt time.Time
	cmd       *exec.Cmd
}

// New creates a new MediaLab instance
func New(config *Config) *MediaLab {
	if config == nil {
		config = DefaultConfig()
	}
	return &MediaLab{
		config:  config,
		players: make(map[Screen]*PlayerInstance),
	}
}

// Play starts playback of a URL/file on the specified screen
func (m *MediaLab) Play(ctx context.Context, url string, screen Screen) (*PlayerInstance, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if existing, ok := m.players[screen]; ok {
		m.stopLocked(existing)
	}

	args := []string{
		"--profile=" + screen.ProfileName(),
		"--input-ipc-server=" + screen.SocketPath(),
		"--volume=" + strconv.Itoa(m.config.DefaultVolume),
		"--", url,
	}

	cmd := exec.CommandContext(ctx, m.config.MPVBinary, args...)
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("failed to start mpv: %w", err)
	}

	instance := &PlayerInstance{
		Screen:    screen,
		PID:       cmd.Process.Pid,
		Socket:    screen.SocketPath(),
		URL:       url,
		StartedAt: time.Now(),
		cmd:       cmd,
	}
	m.players[screen] = instance

	if err := m.waitForSocket(ctx, screen.SocketPath()); err != nil {
		cmd.Process.Kill()
		delete(m.players, screen)
		return nil, fmt.Errorf("mpv IPC socket not available: %w", err)
	}

	return instance, nil
}

func (m *MediaLab) waitForSocket(ctx context.Context, socketPath string) error {
	deadline := time.Now().Add(5 * time.Second)
	for time.Now().Before(deadline) {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}
		if _, err := os.Stat(socketPath); err == nil {
			conn, err := net.DialTimeout("unix", socketPath, 100*time.Millisecond)
			if err == nil {
				conn.Close()
				return nil
			}
		}
		time.Sleep(100 * time.Millisecond)
	}
	return errors.New("timeout waiting for IPC socket")
}

// Stop stops playback on the specified screen
func (m *MediaLab) Stop(screen Screen) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if instance, ok := m.players[screen]; ok {
		return m.stopLocked(instance)
	}
	return nil
}

func (m *MediaLab) stopLocked(instance *PlayerInstance) error {
	_, _ = m.sendIPCCommand(instance.Socket, map[string]any{"command": []string{"quit"}})
	time.Sleep(100 * time.Millisecond)
	if instance.cmd != nil && instance.cmd.Process != nil {
		instance.cmd.Process.Kill()
	}
	delete(m.players, instance.Screen)
	return nil
}

// StopAll stops all active players
func (m *MediaLab) StopAll() {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, instance := range m.players {
		m.stopLocked(instance)
	}
}

// IPCCommand sends a raw IPC command to a screen's player
func (m *MediaLab) IPCCommand(screen Screen, command map[string]any) (json.RawMessage, error) {
	return m.sendIPCCommand(screen.SocketPath(), command)
}

func (m *MediaLab) sendIPCCommand(socketPath string, command map[string]any) (json.RawMessage, error) {
	conn, err := net.DialTimeout("unix", socketPath, m.config.IPCTimeout)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to IPC socket: %w", err)
	}
	defer conn.Close()
	conn.SetDeadline(time.Now().Add(m.config.IPCTimeout))

	data, _ := json.Marshal(command)
	data = append(data, '\n')
	if _, err := conn.Write(data); err != nil {
		return nil, fmt.Errorf("failed to send command: %w", err)
	}

	buf := make([]byte, 4096)
	n, err := conn.Read(buf)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}
	return json.RawMessage(buf[:n]), nil
}

// PlayPause toggles play/pause
func (m *MediaLab) PlayPause(screen Screen) error {
	_, err := m.IPCCommand(screen, map[string]any{"command": []string{"cycle", "pause"}})
	return err
}

// Pause pauses playback
func (m *MediaLab) Pause(screen Screen) error {
	_, err := m.IPCCommand(screen, map[string]any{"command": []any{"set_property", "pause", true}})
	return err
}

// Resume resumes playback
func (m *MediaLab) Resume(screen Screen) error {
	_, err := m.IPCCommand(screen, map[string]any{"command": []any{"set_property", "pause", false}})
	return err
}

// Next plays next item in playlist
func (m *MediaLab) Next(screen Screen) error {
	_, err := m.IPCCommand(screen, map[string]any{"command": []string{"playlist-next", "weak"}})
	return err
}

// Prev plays previous item in playlist
func (m *MediaLab) Prev(screen Screen) error {
	_, err := m.IPCCommand(screen, map[string]any{"command": []string{"playlist-prev", "weak"}})
	return err
}

// SetVolume sets volume (0-100)
func (m *MediaLab) SetVolume(screen Screen, volume int) error {
	if volume < 0 {
		volume = 0
	}
	if volume > 100 {
		volume = 100
	}
	_, err := m.IPCCommand(screen, map[string]any{"command": []any{"set_property", "volume", volume}})
	return err
}

// Seek seeks to position (seconds) or relative offset
func (m *MediaLab) Seek(screen Screen, position float64, relative bool) error {
	mode := "absolute"
	if relative {
		mode = "relative"
	}
	_, err := m.IPCCommand(screen, map[string]any{"command": []any{"seek", position, mode}})
	return err
}

// Fullscreen toggles fullscreen
func (m *MediaLab) Fullscreen(screen Screen) error {
	_, err := m.IPCCommand(screen, map[string]any{"command": []string{"cycle", "fullscreen"}})
	return err
}

// GetProperty retrieves a property from the player
func (m *MediaLab) GetProperty(screen Screen, property string) (any, error) {
	resp, err := m.IPCCommand(screen, map[string]any{"command": []string{"get_property", property}})
	if err != nil {
		return nil, err
	}
	var result struct {
		Data  any    `json:"data"`
		Error string `json:"error"`
	}
	if err := json.Unmarshal(resp, &result); err != nil {
		return nil, err
	}
	if result.Error != "" && result.Error != "success" {
		return nil, errors.New(result.Error)
	}
	return result.Data, nil
}

// PlaybackInfo contains current playback state
type PlaybackInfo struct {
	Screen     Screen  `json:"screen"`
	Playing    bool    `json:"playing"`
	Paused     bool    `json:"paused"`
	Position   float64 `json:"position"`
	Duration   float64 `json:"duration"`
	Volume     float64 `json:"volume"`
	Filename   string  `json:"filename"`
	MediaTitle string  `json:"media_title"`
	Fullscreen bool    `json:"fullscreen"`
	PercentPos float64 `json:"percent_pos"`
}

// GetPlaybackInfo returns current playback information
func (m *MediaLab) GetPlaybackInfo(screen Screen) (*PlaybackInfo, error) {
	info := &PlaybackInfo{Screen: screen}
	props := []string{"pause", "time-pos", "duration", "volume", "filename", "media-title", "fullscreen", "percent-pos"}

	for _, prop := range props {
		val, err := m.GetProperty(screen, prop)
		if err != nil {
			continue
		}
		switch prop {
		case "pause":
			info.Paused, _ = val.(bool)
			info.Playing = !info.Paused
		case "time-pos":
			info.Position, _ = val.(float64)
		case "duration":
			info.Duration, _ = val.(float64)
		case "volume":
			info.Volume, _ = val.(float64)
		case "filename":
			info.Filename, _ = val.(string)
		case "media-title":
			info.MediaTitle, _ = val.(string)
		case "fullscreen":
			info.Fullscreen, _ = val.(bool)
		case "percent-pos":
			info.PercentPos, _ = val.(float64)
		}
	}
	return info, nil
}

// YouTubeResult represents a search result
type YouTubeResult struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Channel  string `json:"channel"`
	Duration string `json:"duration"`
	URL      string `json:"url"`
}

// SearchYouTube searches YouTube and returns results
func (m *MediaLab) SearchYouTube(ctx context.Context, query string, maxResults int) ([]YouTubeResult, error) {
	if maxResults <= 0 {
		maxResults = 10
	}
	args := []string{
		"ytsearch" + strconv.Itoa(maxResults) + ":" + query,
		"--flat-playlist", "--dump-json", "--no-download",
	}
	cmd := exec.CommandContext(ctx, m.config.YTDLPBinary, args...)
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("yt-dlp search failed: %w", err)
	}

	var results []YouTubeResult
	for _, line := range strings.Split(string(output), "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		var entry struct {
			ID         string `json:"id"`
			Title      string `json:"title"`
			Channel    string `json:"channel"`
			Duration   int    `json:"duration"`
			WebpageURL string `json:"webpage_url"`
		}
		if err := json.Unmarshal([]byte(line), &entry); err != nil {
			continue
		}
		results = append(results, YouTubeResult{
			ID:       entry.ID,
			Title:    entry.Title,
			Channel:  entry.Channel,
			Duration: formatDuration(entry.Duration),
			URL:      entry.WebpageURL,
		})
	}
	return results, nil
}

func formatDuration(seconds int) string {
	if seconds <= 0 {
		return "?"
	}
	m := seconds / 60
	s := seconds % 60
	return fmt.Sprintf("%d:%02d", m, s)
}

// PlayYouTubeSearch searches and plays the first result
func (m *MediaLab) PlayYouTubeSearch(ctx context.Context, query string, screen Screen) (*PlayerInstance, error) {
	results, err := m.SearchYouTube(ctx, query, 1)
	if err != nil {
		return nil, err
	}
	if len(results) == 0 {
		return nil, errors.New("no results found")
	}
	return m.Play(ctx, results[0].URL, screen)
}

// ListPlayers returns all active player instances
func (m *MediaLab) ListPlayers() []*PlayerInstance {
	m.mu.RLock()
	defer m.mu.RUnlock()
	players := make([]*PlayerInstance, 0, len(m.players))
	for _, p := range m.players {
		players = append(players, p)
	}
	return players
}

// GetPlayer returns the player instance for a screen
func (m *MediaLab) GetPlayer(screen Screen) (*PlayerInstance, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	p, ok := m.players[screen]
	return p, ok
}

// IsPlaying checks if a screen has an active player
func (m *MediaLab) IsPlaying(screen Screen) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	_, ok := m.players[screen]
	return ok
}
