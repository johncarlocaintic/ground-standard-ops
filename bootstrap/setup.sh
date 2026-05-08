#!/usr/bin/env bash
# Ground Standard Operations — first-time setup
# Run this once after cloning the repo: bash bootstrap/setup.sh

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "=== Ground Standard Ops — first-time setup ==="
echo "Repo root: $REPO_ROOT"
echo

# 1. Node version check
echo "[1/5] Checking Node.js version..."
if ! command -v node >/dev/null 2>&1; then
  echo "  ERROR: Node.js not found. Install Node v24+ from https://nodejs.org/"
  exit 1
fi
NODE_VERSION=$(node --version)
echo "  Node $NODE_VERSION detected."
echo

# 2. npm install
echo "[2/5] Installing dependencies (Playwright)..."
if [ -f package.json ]; then
  npm install --no-audit --no-fund || { echo "  ERROR: npm install failed."; exit 1; }
  echo "  Dependencies installed."
else
  echo "  No package.json at root — skipping."
fi
echo

# 3. Create log directory
echo "[3/5] Creating shared/logs/ directory..."
mkdir -p shared/logs
echo "  Created shared/logs/"
echo

# 4. Seed Claude Code memory
echo "[4/5] Seeding Claude Code auto-memory..."
SEED_DIR="$REPO_ROOT/bootstrap/seed-memory"
if [ ! -d "$SEED_DIR" ]; then
  echo "  WARNING: bootstrap/seed-memory/ not found — skipping memory seed."
else
  # Encode the repo path the way Claude Code does: drive letter lowercased,
  # ":\" → "--", remaining "\" → "-". Falls back to a manual hint if encoding fails.
  if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Git Bash on Windows
    WIN_PATH=$(cygpath -w "$REPO_ROOT" 2>/dev/null || echo "$REPO_ROOT")
    ENCODED=$(echo "$WIN_PATH" | sed -E 's|^([A-Za-z]):\\|\L\1--|; s|\\|-|g')
    MEMORY_DIR="$HOME/.claude/projects/$ENCODED/memory"
  else
    # macOS / Linux
    ENCODED=$(echo "$REPO_ROOT" | sed -E 's|^/||; s|/|-|g')
    MEMORY_DIR="$HOME/.claude/projects/-$ENCODED/memory"
  fi

  echo "  Target memory dir: $MEMORY_DIR"
  mkdir -p "$MEMORY_DIR"

  cp -n "$SEED_DIR"/*.md "$MEMORY_DIR/" 2>/dev/null || true
  COUNT=$(ls -1 "$MEMORY_DIR"/*.md 2>/dev/null | wc -l)
  echo "  Seeded $COUNT memory files. (Existing files were preserved — -n flag.)"
fi
echo

# 5. Env file checks
echo "[5/5] Checking .env files..."
MISSING=0
for ENVFILE in ".env" "clients/ground-standard/.env"; do
  if [ -f "$REPO_ROOT/$ENVFILE" ]; then
    echo "  OK: $ENVFILE present"
  else
    echo "  MISSING: $ENVFILE — copy from $ENVFILE.example and fill values (request real values from JC)"
    MISSING=$((MISSING + 1))
  fi
done
echo

if [ "$MISSING" -gt 0 ]; then
  echo "=== Setup complete — but $MISSING .env file(s) still missing. ==="
  echo "Get the real .env values from JC (out-of-band, e.g. 1Password)."
  echo "Place them at the paths shown above before running any scripts."
else
  echo "=== Setup complete. You're ready to go. ==="
  echo "Next: open Claude Code in this repo, it'll read CLAUDE.md and clients/ground-standard/context.md on session start."
fi
