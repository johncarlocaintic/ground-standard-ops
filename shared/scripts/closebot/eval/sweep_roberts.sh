#!/usr/bin/env bash
BOT="bot_YUMT096UZ49BH7AV"
RUBRIC="shared/scripts/closebot/rubrics/roberts.json"
PDIR="shared/scripts/closebot/personas/roberts"
SANDBOX="src_4R4DUIQTMMX2NFPU"
SUMMARY="shared/logs/eval/_roberts_sweep_summary.txt"
: > "$SUMMARY"
run () {
  echo "=== RUN $1 ($(date -u +%H:%M:%S)) ===" | tee -a "$SUMMARY"
  CB_TEST_BOT_ID="$BOT" PERSONA="$PDIR/$1.json" RUBRIC="$RUBRIC" \
  MIMIC_SOURCE_ID="$SANDBOX" GHL_VERIFY_LOCATION_ID="isGl70YkeLEAiVckMhgT" \
  node --env-file=.env --env-file=clients/ground-standard/.env \
    shared/scripts/closebot/eval/orchestrator.js >> "$SUMMARY" 2>&1
  rd=$(ls -t shared/logs/eval/ | grep "^roberts_roberts_$1_" | head -1)
  v=$(grep -m1 'Overall:' "shared/logs/eval/$rd/report.md" 2>/dev/null || echo "NO REPORT")
  echo "  -> $1 :: $rd :: $v" | tee -a "$SUMMARY"
}
for p in adult_gi_default adult_thai_boxing kid_bjj_5_10 kid_wrestling_11_17 adult_and_kid under5_redirect minor_self_booking pricing_deflect nonbookable_open_mat hostile_aggression; do run "$p"; done
echo "=== NON-DETERMINISM: adult_gi_default x3 ===" | tee -a "$SUMMARY"
for i in 1 2 3; do run "adult_gi_default"; done
echo "=== SWEEP COMPLETE $(date -u +%H:%M:%S) ===" | tee -a "$SUMMARY"
