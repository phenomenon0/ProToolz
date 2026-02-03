package medialab

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/phenomenon0/Agent-GO/core"
)

// RegisterSkills registers all medialab skills with the tool registry
func RegisterSkills(registry *core.ToolRegistry, lab *MediaLab) {
	defaultPolicy := core.ToolPolicy{
		DefaultTimeout: 30 * time.Second,
		Retriable:      true,
		MaxRetries:     2,
	}

	registry.Register(&MediaPlayTool{lab: lab}, defaultPolicy, nil)
	registry.Register(&MediaControlTool{lab: lab}, defaultPolicy, nil)
	registry.Register(&MediaVolumeTool{lab: lab}, defaultPolicy, nil)
	registry.Register(&MediaSeekTool{lab: lab}, defaultPolicy, nil)
	registry.Register(&MediaInfoTool{lab: lab}, defaultPolicy, nil)
	registry.Register(&MediaSearchTool{lab: lab}, defaultPolicy, nil)
	registry.Register(&MediaListTool{lab: lab}, defaultPolicy, nil)
}

// === media.play ===

type MediaPlayTool struct {
	lab *MediaLab
}

func (t *MediaPlayTool) Name() string { return "media.play" }

func (t *MediaPlayTool) Execute(ctx *core.ToolContext) *core.ToolExecResult {
	var input struct {
		URL    string `json:"url"`
		Query  string `json:"query"`  // YouTube search query (alternative to URL)
		Screen int    `json:"screen"` // 1, 2, 3, or 4 (default: 1)
	}

	if err := extractInput(ctx, &input); err != nil {
		return failResult(err.Error())
	}

	screen := Screen(input.Screen - 1)
	if screen < Screen1 || screen > Screen4 {
		screen = Screen1
	}

	var instance *PlayerInstance
	var err error

	if input.URL != "" {
		instance, err = t.lab.Play(ctx.Ctx, input.URL, screen)
	} else if input.Query != "" {
		instance, err = t.lab.PlayYouTubeSearch(ctx.Ctx, input.Query, screen)
	} else {
		return failResult("either 'url' or 'query' is required")
	}

	if err != nil {
		return failResult(fmt.Sprintf("playback failed: %v", err))
	}

	return &core.ToolExecResult{
		Status: core.ToolComplete,
		Output: map[string]any{
			"success": true,
			"screen":  int(screen) + 1,
			"pid":     instance.PID,
			"url":     instance.URL,
			"socket":  instance.Socket,
		},
	}
}

func (t *MediaPlayTool) InputSchema() []byte {
	return []byte(`{
		"type": "object",
		"properties": {
			"url": {"type": "string", "description": "URL or file path to play (YouTube URLs work directly)"},
			"query": {"type": "string", "description": "YouTube search query (plays first result)"},
			"screen": {"type": "integer", "minimum": 1, "maximum": 4, "default": 1, "description": "Target screen (1-4)"}
		},
		"oneOf": [
			{"required": ["url"]},
			{"required": ["query"]}
		]
	}`)
}

func (t *MediaPlayTool) OutputSchema() []byte { return nil }

func (t *MediaPlayTool) Manifest() *core.ToolManifest {
	return &core.ToolManifest{
		Name:        "media.play",
		Version:     "1.0.0",
		Description: "Play media (URL, file, or YouTube search) on a specific screen",
		Category:    "media",
		Tags:        []string{"media", "video", "youtube", "mpv"},
		InputSchema: t.InputSchema(),
	}
}

// === media.control ===

type MediaControlTool struct {
	lab *MediaLab
}

func (t *MediaControlTool) Name() string { return "media.control" }

func (t *MediaControlTool) Execute(ctx *core.ToolContext) *core.ToolExecResult {
	var input struct {
		Action string `json:"action"` // playpause, pause, play, stop, next, prev, fullscreen
		Screen int    `json:"screen"`
	}

	if err := extractInput(ctx, &input); err != nil {
		return failResult(err.Error())
	}

	screen := Screen(input.Screen - 1)
	if screen < Screen1 || screen > Screen4 {
		screen = Screen1
	}

	var err error
	switch input.Action {
	case "playpause", "toggle":
		err = t.lab.PlayPause(screen)
	case "pause":
		err = t.lab.Pause(screen)
	case "play", "resume":
		err = t.lab.Resume(screen)
	case "stop", "quit":
		err = t.lab.Stop(screen)
	case "next":
		err = t.lab.Next(screen)
	case "prev", "previous":
		err = t.lab.Prev(screen)
	case "fullscreen", "fs":
		err = t.lab.Fullscreen(screen)
	default:
		return failResult(fmt.Sprintf("unknown action: %s", input.Action))
	}

	if err != nil {
		return failResult(fmt.Sprintf("control failed: %v", err))
	}

	return &core.ToolExecResult{
		Status: core.ToolComplete,
		Output: map[string]any{"success": true, "action": input.Action, "screen": int(screen) + 1},
	}
}

func (t *MediaControlTool) InputSchema() []byte {
	return []byte(`{
		"type": "object",
		"required": ["action"],
		"properties": {
			"action": {"type": "string", "enum": ["playpause", "pause", "play", "stop", "next", "prev", "fullscreen"], "description": "Control action"},
			"screen": {"type": "integer", "minimum": 1, "maximum": 4, "default": 1, "description": "Target screen"}
		}
	}`)
}

func (t *MediaControlTool) OutputSchema() []byte { return nil }

func (t *MediaControlTool) Manifest() *core.ToolManifest {
	return &core.ToolManifest{
		Name:        "media.control",
		Version:     "1.0.0",
		Description: "Control media playback (play/pause/stop/next/prev/fullscreen)",
		Category:    "media",
		Tags:        []string{"media", "control", "playback"},
		InputSchema: t.InputSchema(),
	}
}

// === media.volume ===

type MediaVolumeTool struct {
	lab *MediaLab
}

func (t *MediaVolumeTool) Name() string { return "media.volume" }

func (t *MediaVolumeTool) Execute(ctx *core.ToolContext) *core.ToolExecResult {
	var input struct {
		Volume int `json:"volume"` // 0-100
		Screen int `json:"screen"`
	}

	if err := extractInput(ctx, &input); err != nil {
		return failResult(err.Error())
	}

	screen := Screen(input.Screen - 1)
	if screen < Screen1 || screen > Screen4 {
		screen = Screen1
	}

	if err := t.lab.SetVolume(screen, input.Volume); err != nil {
		return failResult(fmt.Sprintf("volume change failed: %v", err))
	}

	return &core.ToolExecResult{
		Status: core.ToolComplete,
		Output: map[string]any{"success": true, "volume": input.Volume, "screen": int(screen) + 1},
	}
}

func (t *MediaVolumeTool) InputSchema() []byte {
	return []byte(`{
		"type": "object",
		"required": ["volume"],
		"properties": {
			"volume": {"type": "integer", "minimum": 0, "maximum": 100, "description": "Volume level (0-100)"},
			"screen": {"type": "integer", "minimum": 1, "maximum": 4, "default": 1, "description": "Target screen"}
		}
	}`)
}

func (t *MediaVolumeTool) OutputSchema() []byte { return nil }

func (t *MediaVolumeTool) Manifest() *core.ToolManifest {
	return &core.ToolManifest{
		Name:        "media.volume",
		Version:     "1.0.0",
		Description: "Set volume level for a screen's player",
		Category:    "media",
		Tags:        []string{"media", "volume", "audio"},
		InputSchema: t.InputSchema(),
	}
}

// === media.seek ===

type MediaSeekTool struct {
	lab *MediaLab
}

func (t *MediaSeekTool) Name() string { return "media.seek" }

func (t *MediaSeekTool) Execute(ctx *core.ToolContext) *core.ToolExecResult {
	var input struct {
		Position float64 `json:"position"` // seconds
		Relative bool    `json:"relative"` // if true, position is offset from current
		Screen   int     `json:"screen"`
	}

	if err := extractInput(ctx, &input); err != nil {
		return failResult(err.Error())
	}

	screen := Screen(input.Screen - 1)
	if screen < Screen1 || screen > Screen4 {
		screen = Screen1
	}

	if err := t.lab.Seek(screen, input.Position, input.Relative); err != nil {
		return failResult(fmt.Sprintf("seek failed: %v", err))
	}

	return &core.ToolExecResult{
		Status: core.ToolComplete,
		Output: map[string]any{"success": true, "position": input.Position, "relative": input.Relative, "screen": int(screen) + 1},
	}
}

func (t *MediaSeekTool) InputSchema() []byte {
	return []byte(`{
		"type": "object",
		"required": ["position"],
		"properties": {
			"position": {"type": "number", "description": "Position in seconds (absolute or relative offset)"},
			"relative": {"type": "boolean", "default": false, "description": "If true, seek relative to current position"},
			"screen": {"type": "integer", "minimum": 1, "maximum": 4, "default": 1, "description": "Target screen"}
		}
	}`)
}

func (t *MediaSeekTool) OutputSchema() []byte { return nil }

func (t *MediaSeekTool) Manifest() *core.ToolManifest {
	return &core.ToolManifest{
		Name:        "media.seek",
		Version:     "1.0.0",
		Description: "Seek to position in media (absolute or relative)",
		Category:    "media",
		Tags:        []string{"media", "seek", "position"},
		InputSchema: t.InputSchema(),
	}
}

// === media.info ===

type MediaInfoTool struct {
	lab *MediaLab
}

func (t *MediaInfoTool) Name() string { return "media.info" }

func (t *MediaInfoTool) Execute(ctx *core.ToolContext) *core.ToolExecResult {
	var input struct {
		Screen int `json:"screen"`
	}

	if err := extractInput(ctx, &input); err != nil {
		return failResult(err.Error())
	}

	screen := Screen(input.Screen - 1)
	if screen < Screen1 || screen > Screen4 {
		screen = Screen1
	}

	info, err := t.lab.GetPlaybackInfo(screen)
	if err != nil {
		return failResult(fmt.Sprintf("failed to get info: %v", err))
	}

	return &core.ToolExecResult{
		Status: core.ToolComplete,
		Output: map[string]any{
			"screen":      int(info.Screen) + 1,
			"playing":     info.Playing,
			"paused":      info.Paused,
			"position":    info.Position,
			"duration":    info.Duration,
			"volume":      info.Volume,
			"filename":    info.Filename,
			"media_title": info.MediaTitle,
			"fullscreen":  info.Fullscreen,
			"percent":     info.PercentPos,
		},
	}
}

func (t *MediaInfoTool) InputSchema() []byte {
	return []byte(`{
		"type": "object",
		"properties": {
			"screen": {"type": "integer", "minimum": 1, "maximum": 4, "default": 1, "description": "Target screen"}
		}
	}`)
}

func (t *MediaInfoTool) OutputSchema() []byte { return nil }

func (t *MediaInfoTool) Manifest() *core.ToolManifest {
	return &core.ToolManifest{
		Name:        "media.info",
		Version:     "1.0.0",
		Description: "Get current playback information for a screen",
		Category:    "media",
		Tags:        []string{"media", "info", "status"},
		InputSchema: t.InputSchema(),
	}
}

// === media.search ===

type MediaSearchTool struct {
	lab *MediaLab
}

func (t *MediaSearchTool) Name() string { return "media.search" }

func (t *MediaSearchTool) Execute(ctx *core.ToolContext) *core.ToolExecResult {
	var input struct {
		Query      string `json:"query"`
		MaxResults int    `json:"max_results"`
	}

	if err := extractInput(ctx, &input); err != nil {
		return failResult(err.Error())
	}

	if input.Query == "" {
		return failResult("query is required")
	}

	if input.MaxResults <= 0 {
		input.MaxResults = 5
	}

	results, err := t.lab.SearchYouTube(ctx.Ctx, input.Query, input.MaxResults)
	if err != nil {
		return failResult(fmt.Sprintf("search failed: %v", err))
	}

	return &core.ToolExecResult{
		Status: core.ToolComplete,
		Output: map[string]any{
			"query":   input.Query,
			"count":   len(results),
			"results": results,
		},
	}
}

func (t *MediaSearchTool) InputSchema() []byte {
	return []byte(`{
		"type": "object",
		"required": ["query"],
		"properties": {
			"query": {"type": "string", "description": "YouTube search query"},
			"max_results": {"type": "integer", "minimum": 1, "maximum": 20, "default": 5, "description": "Maximum results to return"}
		}
	}`)
}

func (t *MediaSearchTool) OutputSchema() []byte { return nil }

func (t *MediaSearchTool) Manifest() *core.ToolManifest {
	return &core.ToolManifest{
		Name:        "media.search",
		Version:     "1.0.0",
		Description: "Search YouTube for videos",
		Category:    "media",
		Tags:        []string{"media", "youtube", "search"},
		InputSchema: t.InputSchema(),
	}
}

// === media.list ===

type MediaListTool struct {
	lab *MediaLab
}

func (t *MediaListTool) Name() string { return "media.list" }

func (t *MediaListTool) Execute(ctx *core.ToolContext) *core.ToolExecResult {
	players := t.lab.ListPlayers()

	list := make([]map[string]any, 0, len(players))
	for _, p := range players {
		list = append(list, map[string]any{
			"screen":     int(p.Screen) + 1,
			"pid":        p.PID,
			"url":        p.URL,
			"socket":     p.Socket,
			"started_at": p.StartedAt.Format(time.RFC3339),
		})
	}

	return &core.ToolExecResult{
		Status: core.ToolComplete,
		Output: map[string]any{
			"count":   len(list),
			"players": list,
		},
	}
}

func (t *MediaListTool) InputSchema() []byte {
	return []byte(`{"type": "object", "properties": {}}`)
}

func (t *MediaListTool) OutputSchema() []byte { return nil }

func (t *MediaListTool) Manifest() *core.ToolManifest {
	return &core.ToolManifest{
		Name:        "media.list",
		Version:     "1.0.0",
		Description: "List all active media players",
		Category:    "media",
		Tags:        []string{"media", "list", "players"},
		InputSchema: t.InputSchema(),
	}
}

// === Helpers ===

func extractInput(ctx *core.ToolContext, v any) error {
	if ctx.Request == nil || ctx.Request.ToolReq == nil {
		return fmt.Errorf("no request context")
	}

	if ctx.Request.ToolReq.Input != nil {
		data, err := json.Marshal(ctx.Request.ToolReq.Input)
		if err != nil {
			return err
		}
		return json.Unmarshal(data, v)
	}

	if ctx.Request.ToolReq.InputRaw != nil {
		return json.Unmarshal(ctx.Request.ToolReq.InputRaw, v)
	}

	return nil
}

func failResult(msg string) *core.ToolExecResult {
	return &core.ToolExecResult{
		Status: core.ToolFailed,
		Error:  msg,
	}
}

// CreateSkillManifests returns skill manifests for external registration
func CreateSkillManifests() []*core.SkillManifest {
	return []*core.SkillManifest{
		{
			Name:        "media.play",
			Version:     "1.0.0",
			Description: "Play media (URL, file, or YouTube search) on a specific screen",
			Author:      "Agent-GO",
			License:     "MIT",
			Category:    "media",
			Tags:        []string{"media", "video", "youtube", "mpv", "playback"},
			Runtime:     "native",
			TrustLevel:  3,
			InputSchema: json.RawMessage(`{
				"type": "object",
				"properties": {
					"url": {"type": "string", "description": "URL or file path to play"},
					"query": {"type": "string", "description": "YouTube search query"},
					"screen": {"type": "integer", "minimum": 1, "maximum": 4, "default": 1}
				}
			}`),
		},
		{
			Name:        "media.control",
			Version:     "1.0.0",
			Description: "Control media playback (play/pause/stop/next/prev/fullscreen)",
			Author:      "Agent-GO",
			License:     "MIT",
			Category:    "media",
			Tags:        []string{"media", "control", "playback"},
			Runtime:     "native",
			TrustLevel:  3,
			InputSchema: json.RawMessage(`{
				"type": "object",
				"required": ["action"],
				"properties": {
					"action": {"type": "string", "enum": ["playpause", "pause", "play", "stop", "next", "prev", "fullscreen"]},
					"screen": {"type": "integer", "minimum": 1, "maximum": 4, "default": 1}
				}
			}`),
		},
		{
			Name:        "media.volume",
			Version:     "1.0.0",
			Description: "Set volume level (0-100) for a screen's player",
			Author:      "Agent-GO",
			License:     "MIT",
			Category:    "media",
			Tags:        []string{"media", "volume", "audio"},
			Runtime:     "native",
			TrustLevel:  3,
			InputSchema: json.RawMessage(`{
				"type": "object",
				"required": ["volume"],
				"properties": {
					"volume": {"type": "integer", "minimum": 0, "maximum": 100},
					"screen": {"type": "integer", "minimum": 1, "maximum": 4, "default": 1}
				}
			}`),
		},
		{
			Name:        "media.seek",
			Version:     "1.0.0",
			Description: "Seek to position in media (absolute or relative)",
			Author:      "Agent-GO",
			License:     "MIT",
			Category:    "media",
			Tags:        []string{"media", "seek", "position"},
			Runtime:     "native",
			TrustLevel:  3,
			InputSchema: json.RawMessage(`{
				"type": "object",
				"required": ["position"],
				"properties": {
					"position": {"type": "number"},
					"relative": {"type": "boolean", "default": false},
					"screen": {"type": "integer", "minimum": 1, "maximum": 4, "default": 1}
				}
			}`),
		},
		{
			Name:        "media.info",
			Version:     "1.0.0",
			Description: "Get current playback information for a screen",
			Author:      "Agent-GO",
			License:     "MIT",
			Category:    "media",
			Tags:        []string{"media", "info", "status"},
			Runtime:     "native",
			TrustLevel:  3,
			InputSchema: json.RawMessage(`{
				"type": "object",
				"properties": {
					"screen": {"type": "integer", "minimum": 1, "maximum": 4, "default": 1}
				}
			}`),
		},
		{
			Name:        "media.search",
			Version:     "1.0.0",
			Description: "Search YouTube for videos",
			Author:      "Agent-GO",
			License:     "MIT",
			Category:    "media",
			Tags:        []string{"media", "youtube", "search"},
			Runtime:     "native",
			TrustLevel:  3,
			InputSchema: json.RawMessage(`{
				"type": "object",
				"required": ["query"],
				"properties": {
					"query": {"type": "string"},
					"max_results": {"type": "integer", "minimum": 1, "maximum": 20, "default": 5}
				}
			}`),
		},
		{
			Name:        "media.list",
			Version:     "1.0.0",
			Description: "List all active media players across screens",
			Author:      "Agent-GO",
			License:     "MIT",
			Category:    "media",
			Tags:        []string{"media", "list", "players"},
			Runtime:     "native",
			TrustLevel:  3,
			InputSchema: json.RawMessage(`{"type": "object", "properties": {}}`),
		},
	}
}
