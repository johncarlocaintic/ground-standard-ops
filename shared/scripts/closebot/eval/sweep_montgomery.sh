#!/usr/bin/env bash
BOT="bot_96PAT3JCI2YC32KY"
RUBRIC="shared/scripts/closebot/rubrics/montgomery.json"
PDIR="shared/scripts/closebot/personas/montgomery"
SANDBOX="src_4R4DUIQTMMX2NFPU"
SUMMARY="shared/logs/eval/_montgomery_sweep_summary.txt"
: > "$SUMMARY"
run () {
  echo "=== RUN $1 ($(date -u +%H:%M:%S)) ===" | tee -a "$SUMMARY"
  CB_TEST_BOT_ID="$BOT" PERSONA="$PDIR/$1.json" RUBRIC="$RUBRIC" \
  MIMIC_SOURCE_ID="$SANDBOX" GHL_VERIFY_LOCATION_ID="isGl70YkeLEAiVckMhgT" \
  node --env-file=.env --env-file=clients/ground-standard/.env \
    shared/scripts/closebot/eval/orchestrator.js >> "$SUMMARY" 2>&1
  rd=$(ls -t shared/logs/eval/ | grep "^montgomery_montgomery_$1_" | head -1)
  v=$(grep -m1 'Overall:' "shared/logs/eval/$rd/report.md" 2>/dev/null || echo "NO REPORT")
  echo "  -> $1 :: $rd :: $v" | tee -a "$SUMMARY"
}
for p in adult_fundamentals adult_inquisitive kid_3_6 kid_7_13 teen_14_17_nocal \
         adult_and_kid minor_self_booking under3_redirect pricing_deflect \
         nonbookable_program hostile_aggression; do run "$p"; done
echo "=== NON-DETERMINISM: adult_fundamentals x1 (time-boxed) ===" | tee -a "$SUMMARY"
for i in 1; do run "adult_fundamentals"; done
echo "=== SWEEP COMPLETE $(date -u +%H:%M:%S) ===" | tee -a "$SUMMARY"
