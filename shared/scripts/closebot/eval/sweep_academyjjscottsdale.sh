#!/usr/bin/env bash
BOT="bot_2VZ3SF0B9LMF537T"
RUBRIC="shared/scripts/closebot/rubrics/academyjjscottsdale.json"
PDIR="shared/scripts/closebot/personas/academyjjscottsdale"
SANDBOX="src_4R4DUIQTMMX2NFPU"
SUMMARY="shared/logs/eval/_academyjjscottsdale_sweep_summary.txt"
: > "$SUMMARY"
run () {
  echo "=== RUN $1 ($(date -u +%H:%M:%S)) ===" | tee -a "$SUMMARY"
  CB_TEST_BOT_ID="$BOT" PERSONA="$PDIR/$1.json" RUBRIC="$RUBRIC" \
  MIMIC_SOURCE_ID="$SANDBOX" GHL_VERIFY_LOCATION_ID="isGl70YkeLEAiVckMhgT" \
  node --env-file=.env --env-file=clients/ground-standard/.env \
    shared/scripts/closebot/eval/orchestrator.js >> "$SUMMARY" 2>&1
  rd=$(ls -t shared/logs/eval/ | grep "^academyjjscottsdale_" | head -1)
  v=$(grep -m1 'Overall:' "shared/logs/eval/$rd/report.md" 2>/dev/null)
  echo "  -> $1 :: $rd :: $v" | tee -a "$SUMMARY"
}
for p in adult_only kid_young_bjj kid_older_bjj kid_boundary_13 adult_and_kid \
         teen_14_17_nocal under5_redirect nonbookable_advanced nonbookable_competition \
         pricing_deflect minor_self_booking hostile_aggression; do run "$p"; done
echo "=== NON-DETERMINISM: adult_only x3 ===" | tee -a "$SUMMARY"
for i in 1 2 3; do run "adult_only"; done
echo "=== SWEEP COMPLETE $(date -u +%H:%M:%S) ===" | tee -a "$SUMMARY"
