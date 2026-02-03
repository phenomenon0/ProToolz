package medialab

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"
)

// Server provides HTTP API for media control
type Server struct {
	lab    *MediaLab
	mux    *http.ServeMux
	server *http.Server
}

// NewServer creates a new HTTP server for the media lab
func NewServer(lab *MediaLab) *Server {
	s := &Server{
		lab: lab,
		mux: http.NewServeMux(),
	}
	s.registerRoutes()
	return s
}

func (s *Server) registerRoutes() {
	s.mux.HandleFunc("/play", s.handlePlay)
	s.mux.HandleFunc("/control", s.handleControl)
	s.mux.HandleFunc("/volume", s.handleVolume)
	s.mux.HandleFunc("/seek", s.handleSeek)
	s.mux.HandleFunc("/info", s.handleInfo)
	s.mux.HandleFunc("/search", s.handleSearch)
	s.mux.HandleFunc("/list", s.handleList)
	s.mux.HandleFunc("/health", s.handleHealth)
}

// Start starts the HTTP server
func (s *Server) Start(addr string) error {
	s.server = &http.Server{
		Addr:         addr,
		Handler:      s.mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}
	return s.server.ListenAndServe()
}

// Shutdown gracefully shuts down the server
func (s *Server) Shutdown(ctx context.Context) error {
	if s.server != nil {
		return s.server.Shutdown(ctx)
	}
	return nil
}

// Handler returns the HTTP handler for embedding in other servers
func (s *Server) Handler() http.Handler {
	return s.mux
}

func (s *Server) writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

func (s *Server) writeError(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]any{
		"error":   msg,
		"success": false,
	})
}

func (s *Server) parseScreen(r *http.Request) Screen {
	screenStr := r.URL.Query().Get("screen")
	if screenStr == "" {
		screenStr = r.FormValue("screen")
	}
	n, err := strconv.Atoi(screenStr)
	if err != nil || n < 1 || n > 4 {
		return Screen1
	}
	return Screen(n - 1)
}

func (s *Server) handlePlay(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.writeError(w, http.StatusMethodNotAllowed, "POST required")
		return
	}

	var req struct {
		URL    string `json:"url"`
		Query  string `json:"query"`
		Screen int    `json:"screen"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.writeError(w, http.StatusBadRequest, fmt.Sprintf("invalid JSON: %v", err))
		return
	}

	screen := Screen(req.Screen - 1)
	if screen < Screen1 || screen > Screen4 {
		screen = Screen1
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	var instance *PlayerInstance
	var err error

	if req.URL != "" {
		instance, err = s.lab.Play(ctx, req.URL, screen)
	} else if req.Query != "" {
		instance, err = s.lab.PlayYouTubeSearch(ctx, req.Query, screen)
	} else {
		s.writeError(w, http.StatusBadRequest, "url or query required")
		return
	}

	if err != nil {
		s.writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	s.writeJSON(w, map[string]any{
		"success": true,
		"screen":  int(screen) + 1,
		"pid":     instance.PID,
		"url":     instance.URL,
	})
}

func (s *Server) handleControl(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.writeError(w, http.StatusMethodNotAllowed, "POST required")
		return
	}

	var req struct {
		Action string `json:"action"`
		Screen int    `json:"screen"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.writeError(w, http.StatusBadRequest, fmt.Sprintf("invalid JSON: %v", err))
		return
	}

	screen := Screen(req.Screen - 1)
	if screen < Screen1 || screen > Screen4 {
		screen = Screen1
	}

	var err error
	switch req.Action {
	case "playpause", "toggle":
		err = s.lab.PlayPause(screen)
	case "pause":
		err = s.lab.Pause(screen)
	case "play", "resume":
		err = s.lab.Resume(screen)
	case "stop", "quit":
		err = s.lab.Stop(screen)
	case "next":
		err = s.lab.Next(screen)
	case "prev", "previous":
		err = s.lab.Prev(screen)
	case "fullscreen", "fs":
		err = s.lab.Fullscreen(screen)
	default:
		s.writeError(w, http.StatusBadRequest, fmt.Sprintf("unknown action: %s", req.Action))
		return
	}

	if err != nil {
		s.writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	s.writeJSON(w, map[string]any{
		"success": true,
		"action":  req.Action,
		"screen":  int(screen) + 1,
	})
}

func (s *Server) handleVolume(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.writeError(w, http.StatusMethodNotAllowed, "POST required")
		return
	}

	var req struct {
		Volume int `json:"volume"`
		Screen int `json:"screen"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.writeError(w, http.StatusBadRequest, fmt.Sprintf("invalid JSON: %v", err))
		return
	}

	screen := Screen(req.Screen - 1)
	if screen < Screen1 || screen > Screen4 {
		screen = Screen1
	}

	if err := s.lab.SetVolume(screen, req.Volume); err != nil {
		s.writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	s.writeJSON(w, map[string]any{
		"success": true,
		"volume":  req.Volume,
		"screen":  int(screen) + 1,
	})
}

func (s *Server) handleSeek(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.writeError(w, http.StatusMethodNotAllowed, "POST required")
		return
	}

	var req struct {
		Position float64 `json:"position"`
		Relative bool    `json:"relative"`
		Screen   int     `json:"screen"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.writeError(w, http.StatusBadRequest, fmt.Sprintf("invalid JSON: %v", err))
		return
	}

	screen := Screen(req.Screen - 1)
	if screen < Screen1 || screen > Screen4 {
		screen = Screen1
	}

	if err := s.lab.Seek(screen, req.Position, req.Relative); err != nil {
		s.writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	s.writeJSON(w, map[string]any{
		"success":  true,
		"position": req.Position,
		"relative": req.Relative,
		"screen":   int(screen) + 1,
	})
}

func (s *Server) handleInfo(w http.ResponseWriter, r *http.Request) {
	screen := s.parseScreen(r)

	info, err := s.lab.GetPlaybackInfo(screen)
	if err != nil {
		s.writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	s.writeJSON(w, map[string]any{
		"success":     true,
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
	})
}

func (s *Server) handleSearch(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		s.writeError(w, http.StatusBadRequest, "query parameter 'q' required")
		return
	}

	maxResults := 10
	if n, err := strconv.Atoi(r.URL.Query().Get("max")); err == nil && n > 0 && n <= 20 {
		maxResults = n
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	results, err := s.lab.SearchYouTube(ctx, query, maxResults)
	if err != nil {
		s.writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	s.writeJSON(w, map[string]any{
		"success": true,
		"query":   query,
		"count":   len(results),
		"results": results,
	})
}

func (s *Server) handleList(w http.ResponseWriter, r *http.Request) {
	players := s.lab.ListPlayers()

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

	s.writeJSON(w, map[string]any{
		"success": true,
		"count":   len(list),
		"players": list,
	})
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	s.writeJSON(w, map[string]any{
		"status": "ok",
		"time":   time.Now().Format(time.RFC3339),
	})
}
