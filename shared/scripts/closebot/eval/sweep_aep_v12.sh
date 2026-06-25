#!/usr/bin/env bash
BOT="bot_20P7NZ6ZMRY37GC4"
RUBRIC="shared/scripts/closebot/rubrics/academyedenprairie.json"
PDIR="shared/scripts/closebot/personas/academyedenprairie"
SANDBOX="src_4R4DUIQTMMX2NFPU"
SUMMARY="shared/logs/eval/_aep_v12_summary.txt"
: > "$SUMMARY"
run () {
  echo "=== RUN $1 ($(date -u +%H:%M:%S)) ===" | tee -a "$SUMMARY"
  CB_TEST_BOT_ID="$BOT" PERSONA="$PDIR/$1.json" RUBRIC="$RUBRIC" \
  MIMIC_SOURCE_ID="$SANDBOX" GHL_VERIFY_LOCATION_ID="isGl70YkeLEAiVckMhgT" \
  node --env-file=.env --env-file=clients/ground-standard/.env \
    shared/scripts/closebot/eval/orchestrator.js >> "$SUMMARY" 2>&1
  rd=$(ls -t shared/logs/eval/ | grep "^academyedenprairie_" | head -1)
  v=$(grep -m1 'Overall:' "shared/logs/eval/$rd/report.md" 2>/dev/null)
  echo "  -> $1 :: $rd :: $v" | tee -a "$SUMMARY"
}
for p in kid_muaythai_redirect kid_young_bjj kid_older_bjj adult_only; do run "$p"; done
echo "=== V11 SWEEP COMPLETE $(date -u +%H:%M:%S) ===" | tee -a "$SUMMARY"
