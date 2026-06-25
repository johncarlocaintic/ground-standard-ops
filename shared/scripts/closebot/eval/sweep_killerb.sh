#!/usr/bin/env bash
BOT="bot_AXZH003J1SL05374"
RUBRIC="shared/scripts/closebot/rubrics/killerb.json"
PDIR="shared/scripts/closebot/personas/killerb"
SANDBOX="src_4R4DUIQTMMX2NFPU"
SUMMARY="shared/logs/eval/_killerb_sweep_summary.txt"
: > "$SUMMARY"
run () {
  echo "=== RUN $1 ($(date -u +%H:%M:%S)) ===" | tee -a "$SUMMARY"
  CB_TEST_BOT_ID="$BOT" PERSONA="$PDIR/$1.json" RUBRIC="$RUBRIC" \
  MIMIC_SOURCE_ID="$SANDBOX" GHL_VERIFY_LOCATION_ID="isGl70YkeLEAiVckMhgT" \
  node --env-file=.env --env-file=clients/ground-standard/.env \
    shared/scripts/closebot/eval/orchestrator.js >> "$SUMMARY" 2>&1
  rd=$(ls -t shared/logs/eval/ | grep "^killerb_killerb_$1_" | head -1)
  v=$(grep -m1 'Overall:' "shared/logs/eval/$rd/report.md" 2>/dev/null || echo "NO REPORT")
  echo "  -> $1 :: $rd :: $v" | tee -a "$SUMMARY"
}
for p in adult_mma_default adult_kickboxing kid_5_12 adult_and_kid teen_13_17_nocal under5_redirect minor_self_booking pricing_deflect nonbookable_sparring hostile_aggression; do run "$p"; done
echo "=== NON-DETERMINISM: adult_mma_default x3 ===" | tee -a "$SUMMARY"
for i in 1 2 3; do run "adult_mma_default"; done
echo "=== SWEEP COMPLETE $(date -u +%H:%M:%S) ===" | tee -a "$SUMMARY"
