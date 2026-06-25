#!/usr/bin/env bash
BOT="bot_78NZSL4KC3Q4HPDI"
RUBRIC="shared/scripts/closebot/rubrics/raylongo.json"
PDIR="shared/scripts/closebot/personas/raylongo"
SANDBOX="src_4R4DUIQTMMX2NFPU"
SUMMARY="shared/logs/eval/_raylongo_sweep_summary.txt"
: > "$SUMMARY"
run () {
  echo "=== RUN $1 ($(date -u +%H:%M:%S)) ===" | tee -a "$SUMMARY"
  CB_TEST_BOT_ID="$BOT" PERSONA="$PDIR/$1.json" RUBRIC="$RUBRIC" \
  MIMIC_SOURCE_ID="$SANDBOX" GHL_VERIFY_LOCATION_ID="isGl70YkeLEAiVckMhgT" \
  node --env-file=.env --env-file=clients/ground-standard/.env \
    shared/scripts/closebot/eval/orchestrator.js >> "$SUMMARY" 2>&1
  rd=$(ls -t shared/logs/eval/ | grep "^raylongo_raylongo_$1_" | head -1)
  v=$(grep -m1 'Overall:' "shared/logs/eval/$rd/report.md" 2>/dev/null || echo "NO REPORT")
  echo "  -> $1 :: $rd :: $v" | tee -a "$SUMMARY"
}
for p in adult_mma_default adult_kickboxing adult_bjj adult_nogi adult_boxing \
         kid_4_6 kid_7_12 adult_and_kid teen_13_17_nocal minor_self_booking \
         under4_redirect pricing_deflect nonbookable_program hostile_aggression; do run "$p"; done
echo "=== NON-DETERMINISM: adult_mma_default x1 (time-boxed) ===" | tee -a "$SUMMARY"
for i in 1; do run "adult_mma_default"; done
echo "=== SWEEP COMPLETE $(date -u +%H:%M:%S) ===" | tee -a "$SUMMARY"
