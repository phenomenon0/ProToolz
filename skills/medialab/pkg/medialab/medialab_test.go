package medialab

import (
	"testing"
)

func TestScreenSocketPath(t *testing.T) {
	tests := []struct {
		screen Screen
		want   string
	}{
		{Screen1, "/tmp/mpv-screen1"},
		{Screen2, "/tmp/mpv-screen2"},
		{Screen3, "/tmp/mpv-screen3"},
		{Screen4, "/tmp/mpv-screen4"},
	}

	for _, tt := range tests {
		got := tt.screen.SocketPath()
		if got != tt.want {
			t.Errorf("Screen(%d).SocketPath() = %q, want %q", tt.screen, got, tt.want)
		}
	}
}

func TestScreenProfileName(t *testing.T) {
	tests := []struct {
		screen Screen
		want   string
	}{
		{Screen1, "screen1"},
		{Screen2, "screen2"},
		{Screen3, "screen3"},
		{Screen4, "screen4"},
	}

	for _, tt := range tests {
		got := tt.screen.ProfileName()
		if got != tt.want {
			t.Errorf("Screen(%d).ProfileName() = %q, want %q", tt.screen, got, tt.want)
		}
	}
}

func TestDefaultConfig(t *testing.T) {
	cfg := DefaultConfig()

	if cfg.MPVBinary != "mpv" {
		t.Errorf("MPVBinary = %q, want %q", cfg.MPVBinary, "mpv")
	}

	if cfg.YTDLPBinary != "yt-dlp" {
		t.Errorf("YTDLPBinary = %q, want %q", cfg.YTDLPBinary, "yt-dlp")
	}

	if cfg.DefaultVolume != 80 {
		t.Errorf("DefaultVolume = %d, want %d", cfg.DefaultVolume, 80)
	}

	if cfg.DefaultScreen != Screen1 {
		t.Errorf("DefaultScreen = %d, want %d", cfg.DefaultScreen, Screen1)
	}
}

func TestNew(t *testing.T) {
	lab := New(nil)
	if lab == nil {
		t.Fatal("New(nil) returned nil")
	}

	if lab.config == nil {
		t.Error("config is nil")
	}

	if lab.players == nil {
		t.Error("players map is nil")
	}
}

func TestListPlayersEmpty(t *testing.T) {
	lab := New(nil)
	players := lab.ListPlayers()

	if len(players) != 0 {
		t.Errorf("ListPlayers() returned %d players, want 0", len(players))
	}
}

func TestIsPlayingEmpty(t *testing.T) {
	lab := New(nil)

	for _, screen := range []Screen{Screen1, Screen2, Screen3, Screen4} {
		if lab.IsPlaying(screen) {
			t.Errorf("IsPlaying(%d) = true, want false", screen)
		}
	}
}

func TestGetPlayerEmpty(t *testing.T) {
	lab := New(nil)

	for _, screen := range []Screen{Screen1, Screen2, Screen3, Screen4} {
		_, ok := lab.GetPlayer(screen)
		if ok {
			t.Errorf("GetPlayer(%d) found player, want none", screen)
		}
	}
}

func TestFormatDuration(t *testing.T) {
	tests := []struct {
		seconds int
		want    string
	}{
		{0, "?"},
		{-1, "?"},
		{30, "0:30"},
		{60, "1:00"},
		{90, "1:30"},
		{3600, "60:00"},
		{3661, "61:01"},
	}

	for _, tt := range tests {
		got := formatDuration(tt.seconds)
		if got != tt.want {
			t.Errorf("formatDuration(%d) = %q, want %q", tt.seconds, got, tt.want)
		}
	}
}
