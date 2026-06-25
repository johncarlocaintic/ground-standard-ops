#!/usr/bin/env bash
# Resume rerun chain from Hammer non-det 2 (chain died mid-run).
# Covers: Hammer non-det 2+3, Hamptons 4 NO_REPORTs, Mason Dixon adult_striking, Gracie East SJ 2 non-det.

set +e

SUMMARY="shared/logs/eval/_rerun_chain_summary.txt"
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | $1" | tee -a "$SUMMARY"; }

attach() {
  log "=== ATTACH $1 ==="
  node --env-file=.env --env-file=clients/ground-standard/.env \
    shared/scripts/closebot/sandbox_attach_gym.mjs "$1" 2>&1 | tail -5 | tee -a "$SUMMARY"
  log "  attached, waiting 12s for KB to settle..."
  sleep 12
}

run_persona() {
  local SLUG=$1
  local BOT=$2
  local RUBRIC=$3
  local PDIR=$4
  local PERSONA=$5
  log "--- RUN $SLUG / $PERSONA ---"
  CB_TEST_BOT_ID="$BOT" PERSONA="$PDIR/$PERSONA.json" RUBRIC="$RUBRIC" \
  MIMIC_SOURCE_ID="src_4R4DUIQTMMX2NFPU" GHL_VERIFY_LOCATION_ID="isGl70YkeLEAiVckMhgT" \
  node --env-file=.env --env-file=clients/ground-standard/.env \
    shared/scripts/closebot/eval/orchestrator.js >> "$SUMMARY" 2>&1
  rd=$(ls -t shared/logs/eval/ | grep "^${SLUG}_${SLUG}_${PERSONA}_" | head -1)
  v=$(grep -m1 'Overall:' "shared/logs/eval/$rd/report.md" 2>/dev/null || echo "NO REPORT")
  log "  -> $PERSONA :: $rd :: $v"
}

# ---------------- Hammer Sports (non-det 2+3 — run 1 already PASS) ----------------
attach hammer
for i in 2 3; do
  run_persona hammersports bot_AFKR1QYFJ3VKYF3W shared/scripts/closebot/rubrics/hammersports.json shared/scripts/closebot/personas/hammersports adult_bjj_default
done

# ---------------- Hamptons JJS (4 NO_REPORT reruns) ----------------
attach hamptonsjj
for p in kid_only_young kid_older adult_and_kid minor_self_booking; do
  run_persona hamptonsjj bot_WWB97FEM611TC5SY shared/scripts/closebot/rubrics/hamptonsjj.json shared/scripts/closebot/personas/hamptonsjj "$p"
done

# ---------------- Mason Dixon (adult_striking NO_REPORT) ----------------
attach masondixon
run_persona masondixon bot_0HQBLZA2NO9T1ZFM shared/scripts/closebot/rubrics/masondixon.json shared/scripts/closebot/personas/masondixon adult_striking

# ---------------- Gracie East SJ (2 non-det adult_only) ----------------
attach graciejjsj
for i in 1 2; do
  run_persona graciejj-sanjose bot_UMEBUHOW9YQOLIHU shared/scripts/closebot/rubrics/graciejj-sanjose.json shared/scripts/closebot/personas/graciejj-sanjose adult_only
done

log "=== RESUME CHAIN COMPLETE ==="
