#!/usr/bin/env bash
# Gracie Jiu Jitsu East San Jose v2.0 Agent Node sweep on bot_UMEBUHOW9YQOLIHU
BOT="bot_UMEBUHOW9YQOLIHU"
RUBRIC="shared/scripts/closebot/rubrics/graciejj-sanjose.json"
PDIR="shared/scripts/closebot/personas/graciejj-sanjose"
SANDBOX="src_4R4DUIQTMMX2NFPU"
SUMMARY="shared/logs/eval/_graciejjsanjose_v2_sweep_summary.txt"
: > "$SUMMARY"

run () {
  echo "=== RUN $1 ($(date -u +%H:%M:%S)) ===" | tee -a "$SUMMARY"
  CB_TEST_BOT_ID="$BOT" PERSONA="$PDIR/$1.json" RUBRIC="$RUBRIC" \
  MIMIC_SOURCE_ID="$SANDBOX" GHL_VERIFY_LOCATION_ID="isGl70YkeLEAiVckMhgT" \
  node --env-file=.env --env-file=clients/ground-standard/.env \
    shared/scripts/closebot/eval/orchestrator.js >> "$SUMMARY" 2>&1
  rd=$(ls -t shared/logs/eval/ | grep "^graciejj-sanjose_graciejj-sanjose_$1_" | head -1)
  v=$(grep -m1 'Overall:' "shared/logs/eval/$rd/report.md" 2>/dev/null || echo "NO REPORT")
  echo "  -> $1 :: $rd :: $v" | tee -a "$SUMMARY"
}

for p in adult_only kid_only kid_older adult_and_kid minor_self_booking nonbookable_program pricing_deflect; do
  run "$p"
done

echo "=== NON-DETERMINISM: adult_only x3 ===" | tee -a "$SUMMARY"
for i in 1 2 3; do run "adult_only"; done

echo "=== SWEEP COMPLETE $(date -u +%H:%M:%S) ===" | tee -a "$SUMMARY"
