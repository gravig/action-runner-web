#!/usr/bin/env bash
# =============================================================================
# watchdog.sh — Git-poll auto-restart dev server monitor
#
# USAGE
#   ./scripts/watchdog.sh
#
# BACKGROUND (recommended)
#   nohup ./scripts/watchdog.sh > logs/watchdog.log 2>&1 &
#
# ENVIRONMENT VARIABLES
#   POLL_INTERVAL   Seconds between git fetch checks      (default: 60)
# =============================================================================

set -uo pipefail

# ── Config ────────────────────────────────────────────────────────────────────

POLL_INTERVAL="${POLL_INTERVAL:-60}"
BRANCH="main"

# Resolve project root (parent of scripts/)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
TMP_DIR="$PROJECT_DIR/tmp"
DEV_PID_FILE="$TMP_DIR/dev.pid"

# ── Helpers ───────────────────────────────────────────────────────────────────

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# Send SIGTERM to a process tree rooted at $1, then SIGKILL after grace period.
kill_tree() {
    local root_pid="$1"
    local grace="${2:-5}"

    if [[ -z "$root_pid" ]]; then
        return 0
    fi

    # Collect all descendants (breadth-first) then kill from leaves to root.
    local all_pids=()
    local queue=("$root_pid")
    while [[ ${#queue[@]} -gt 0 ]]; do
        local pid="${queue[0]}"
        queue=("${queue[@]:1}")
        all_pids+=("$pid")
        while IFS= read -r child; do
            [[ -n "$child" ]] && queue+=("$child")
        done < <(pgrep -P "$pid" 2>/dev/null || true)
    done

    # Reverse order: kill children first, then the root.
    local reversed=()
    for (( i=${#all_pids[@]}-1; i>=0; i-- )); do
        reversed+=("${all_pids[$i]}")
    done

    log "Sending SIGTERM to process tree: ${reversed[*]}"
    for pid in "${reversed[@]}"; do
        kill -TERM "$pid" 2>/dev/null || true
    done

    # Wait up to $grace seconds, then SIGKILL survivors.
    local waited=0
    while (( waited < grace )); do
        sleep 1
        (( waited++ ))
        local alive=0
        for pid in "${reversed[@]}"; do
            kill -0 "$pid" 2>/dev/null && alive=1 && break
        done
        [[ $alive -eq 0 ]] && return 0
    done

    log "Grace period elapsed — sending SIGKILL to survivors"
    for pid in "${reversed[@]}"; do
        kill -KILL "$pid" 2>/dev/null || true
    done
}

# Returns 0 if the dev server is alive, 1 otherwise.
service_alive() {
    [[ -f "$DEV_PID_FILE" ]] || return 1
    local pid
    pid="$(cat "$DEV_PID_FILE")" || return 1
    [[ -n "$pid" ]] || return 1
    kill -0 "$pid" 2>/dev/null
}

start_service() {
    log "Starting dev server…"
    mkdir -p "$LOG_DIR"
    nohup npm --prefix "$PROJECT_DIR" run dev \
        > "$LOG_DIR/dev-server.log" 2> "$LOG_DIR/dev-error.log" &
    echo $! > "$DEV_PID_FILE"
    log "Dev server started (PID $(cat "$DEV_PID_FILE"))"
    log "  stdout → $LOG_DIR/dev-server.log"
    log "  stderr → $LOG_DIR/dev-error.log"
}

stop_service() {
    log "Stopping dev server…"
    if [[ -f "$DEV_PID_FILE" ]]; then
        local pid
        pid="$(cat "$DEV_PID_FILE")"
        kill_tree "$pid"
        rm -f "$DEV_PID_FILE"
        log "Dev server stopped"
    else
        log "No PID file found — nothing to stop"
    fi
}

# Remove stale PID files from a previous (dead) watchdog run.
clean_stale_pids() {
    [[ -f "$DEV_PID_FILE" ]] || return 0
    local pid
    pid="$(cat "$DEV_PID_FILE" 2>/dev/null)" || { rm -f "$DEV_PID_FILE"; return 0; }

    if kill -0 "$pid" 2>/dev/null; then
        log "Found existing dev server process (PID $pid) — stopping it first"
        stop_service
    else
        log "Removing stale PID file $DEV_PID_FILE (process $pid no longer exists)"
        rm -f "$DEV_PID_FILE"
    fi
}

# ── Update logic ──────────────────────────────────────────────────────────────

do_update() {
    log "New commits detected on origin/$BRANCH — pulling…"

    # Capture package-lock.json git object hash BEFORE pulling so we can detect changes.
    local lock_hash_before
    lock_hash_before="$(git -C "$PROJECT_DIR" rev-parse "HEAD:package-lock.json" 2>/dev/null || echo '')"

    # Pull the latest changes.
    if ! git -C "$PROJECT_DIR" pull origin "$BRANCH" --ff-only; then
        log "ERROR: git pull failed — keeping service running with current code"
        return 1
    fi

    local lock_hash_after
    lock_hash_after="$(git -C "$PROJECT_DIR" rev-parse "HEAD:package-lock.json" 2>/dev/null || echo '')"

    if [[ -n "$lock_hash_before" && "$lock_hash_before" != "$lock_hash_after" ]]; then
        log "package-lock.json changed — running npm ci…"
        if ! npm --prefix "$PROJECT_DIR" ci --include=dev; then
            log "WARNING: npm ci failed — continuing with restart anyway"
        fi
    else
        log "package-lock.json unchanged — skipping npm ci"
    fi

    stop_service
    sleep 2
    start_service
    return 0
}

# ── Cleanup trap ──────────────────────────────────────────────────────────────

cleanup() {
    log "Watchdog shutting down — stopping dev server…"
    stop_service
    log "Watchdog exited"
}

# ── Bootstrap ─────────────────────────────────────────────────────────────────

# Validate node and npm are available.
if ! command -v node &>/dev/null; then
    echo "FATAL: node not found in PATH" >&2
    exit 1
fi

if ! command -v npm &>/dev/null; then
    echo "FATAL: npm not found in PATH" >&2
    exit 1
fi

# Validate node version >= 20.19.
NODE_VERSION="$(node --version | sed 's/v//')"
NODE_MAJOR="$(echo "$NODE_VERSION" | cut -d. -f1)"
NODE_MINOR="$(echo "$NODE_VERSION" | cut -d. -f2)"
if (( NODE_MAJOR < 20 )) || { (( NODE_MAJOR == 20 )) && (( NODE_MINOR < 19 )); }; then
    echo "FATAL: node >= 20.19 required (found $NODE_VERSION)" >&2
    exit 1
fi

# Ensure git remote is reachable (non-fatal — just warn).
if ! git -C "$PROJECT_DIR" ls-remote --exit-code origin "$BRANCH" &>/dev/null; then
    log "WARNING: Could not reach git remote for branch '$BRANCH'. Will retry each poll."
fi

mkdir -p "$LOG_DIR" "$TMP_DIR"

log "==================================================================="
log "watchdog.sh  |  branch=$BRANCH  |  poll=${POLL_INTERVAL}s"
log "Project dir: $PROJECT_DIR"
log "Node:        $(node --version)"
log "npm:         $(npm --version)"
log "==================================================================="

# Handle any leftover process from a previous watchdog run.
clean_stale_pids

# Register cleanup handler.
trap cleanup EXIT INT TERM

# Initial npm ci to ensure node_modules are up to date with current HEAD.
log "Running initial npm ci…"
npm --prefix "$PROJECT_DIR" ci --include=dev || log "WARNING: initial npm ci had errors"

# Start the dev server for the first time.
start_service

# ── Poll loop ─────────────────────────────────────────────────────────────────

LAST_KNOWN_COMMIT="$(git -C "$PROJECT_DIR" rev-parse HEAD 2>/dev/null || echo '')"

log "Monitoring $BRANCH (last known commit: ${LAST_KNOWN_COMMIT:0:8}…)"

while true; do
    sleep "$POLL_INTERVAL"

    # Fetch latest remote refs (non-fatal on network error).
    if ! git -C "$PROJECT_DIR" fetch origin "$BRANCH" --quiet 2>/dev/null; then
        log "WARNING: git fetch failed — will retry next poll"
        continue
    fi

    REMOTE_COMMIT="$(git -C "$PROJECT_DIR" rev-parse "origin/$BRANCH" 2>/dev/null || echo '')"

    if [[ -z "$REMOTE_COMMIT" ]]; then
        log "WARNING: Could not resolve origin/$BRANCH — skipping"
        continue
    fi

    if [[ "$REMOTE_COMMIT" != "$LAST_KNOWN_COMMIT" ]]; then
        log "New commit on origin/$BRANCH: ${LAST_KNOWN_COMMIT:0:8}… → ${REMOTE_COMMIT:0:8}…"
        if do_update; then
            LAST_KNOWN_COMMIT="$(git -C "$PROJECT_DIR" rev-parse HEAD 2>/dev/null || echo "$REMOTE_COMMIT")"
            log "Successfully updated to ${LAST_KNOWN_COMMIT:0:8}…"
        fi
    fi

    # Crash detection: restart the dev server if it died unexpectedly.
    if ! service_alive; then
        log "Dev server is not running — restarting…"
        start_service
    fi
done
