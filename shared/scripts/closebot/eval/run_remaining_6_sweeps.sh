#!/usr/bin/env bash
# Chain all 6 remaining Agent Node sweeps: Gracie FV → Hammer → Inverted Gear → Hamptons → Mason Dixon → Gracie East SJ
# Run this after All In sweep completes + after running sandbox_transition_allin_to_graciefv.mjs
# Each gym: transition (already done by calling script) → sweep
# No set -e — minor transition 4xx errors (calendar already exists, etc.) should not abort the chain

echo "=== Starting 6-gym chain sweep $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="

transition_and_sweep () {
  local FROM=$1
  local TO=$2
  local SCRIPT=$3
  local SWEEP=$4
  echo ""
  echo "=== TRANSITION: ${FROM} → ${TO} ($(date -u +%H:%M:%SZ)) ==="
  node --env-file=.env --env-file=clients/ground-standard/.env "$SCRIPT"
  echo "Transition done. Waiting 10s for KB to stabilize..."
  sleep 10
  echo ""
  echo "=== SWEEP: ${TO} ($(date -u +%H:%M:%SZ)) ==="
  bash "$SWEEP"
  echo "=== SWEEP ${TO} COMPLETE ($(date -u +%H:%M:%SZ)) ==="
}

# Gracie FV
transition_and_sweep \
  "All In" "Gracie FV" \
  "shared/scripts/closebot/sandbox_transition_allin_to_graciefv.mjs" \
  "shared/scripts/closebot/eval/sweep_graciefarmingtonvalley.sh"

# Hammer Sports
transition_and_sweep \
  "Gracie FV" "Hammer Sports" \
  "shared/scripts/closebot/sandbox_transition_graciefv_to_hammer.mjs" \
  "shared/scripts/closebot/eval/sweep_hammersports.sh"

# Inverted Gear
transition_and_sweep \
  "Hammer Sports" "Inverted Gear" \
  "shared/scripts/closebot/sandbox_transition_hammer_to_invertedgear.mjs" \
  "shared/scripts/closebot/eval/sweep_invertedgear.sh"

# Hamptons JJS
transition_and_sweep \
  "Inverted Gear" "Hamptons JJS" \
  "shared/scripts/closebot/sandbox_transition_invertedgear_to_hamptonsjj.mjs" \
  "shared/scripts/closebot/eval/sweep_hamptonsjj_v2.sh"

# Mason Dixon
transition_and_sweep \
  "Hamptons JJS" "Mason Dixon" \
  "shared/scripts/closebot/sandbox_transition_hamptonsjj_to_masondixon.mjs" \
  "shared/scripts/closebot/eval/sweep_masondixon_v2.sh"

# Gracie East SJ
transition_and_sweep \
  "Mason Dixon" "Gracie East SJ" \
  "shared/scripts/closebot/sandbox_transition_masondixon_to_graciejjsanjose.mjs" \
  "shared/scripts/closebot/eval/sweep_graciejjsanjose_v2.sh"

echo ""
echo "=== ALL 6 SWEEPS COMPLETE $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
