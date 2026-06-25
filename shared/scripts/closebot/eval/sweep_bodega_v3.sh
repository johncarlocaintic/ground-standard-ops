#!/usr/bin/env bash
# Bodega v3.0 Agent Node sweep on bot_RBL7PP9J68OLDHHA
# Strict sequential. No concurrent chains. Sandbox must be Bodega-only at this point.
BOT="bot_RBL7PP9J68OLDHHA"
RUBRIC="shared/scripts/closebot/rubrics/bodegajj.json"
PDIR="shared/scripts/closebot/personas/bodegajj"
SANDBOX="src_4R4DUIQTMMX2NFPU"
SUMMARY="shared/logs/eval/_bodega_v3_sweep_summary.txt"
: > "$SUMMARY"

run () {
  echo "=== RUN $1 ($(date -u +%H:%M:%S)) ===" | tee -a "$SUMMARY"
  CB_TEST_BOT_ID="$BOT" PERSONA="$PDIR/$1.json" RUBRIC="$RUBRIC" \
  MIMIC_SOURCE_ID="$SANDBOX" GHL_VERIFY_LOCATION_ID="isGl70YkeLEAiVckMhgT" \
  node --env-file=.env --env-file=clients/ground-standard/.env \
    shared/scripts/closebot/eval/orchestrator.js >> "$SUMMARY" 2>&1
  rd=$(ls -t shared/logs/eval/ | grep "^bodegajj_bodegajj_$1_" | head -1)
  v=$(grep -m1 'Overall:' "shared/logs/eval/$rd/report.md" 2>/dev/null || echo "NO REPORT")
  echo "  -> $1 :: $rd :: $v" | tee -a "$SUMMARY"
}

for p in adult_only kid_young kid_boundary_14 kid_older adult_and_kid teen_15_17_nocal under6_redirect minor_self_booking pricing_deflect gi_not_offered hostile_aggression; do
  run "$p"
done

echo "=== NON-DETERMINISM: adult_only x3 ===" | tee -a "$SUMMARY"
for i in 1 2 3; do run "adult_only"; done

echo "=== SWEEP COMPLETE $(date -u +%H:%M:%S) ===" | tee -a "$SUMMARY"
