#!/usr/bin/env bash
# Partial sweep — runs the 5 missing standard personas + 3x non-det
# Prerequisite complete runs: adult_only 163940, kid_youth 164257, kid_boundary_13 164613,
#   adult_and_kid 165246, teen_14_17_nocal 164203 (mnd_05 FP documented)
BOT="bot_AY8T1CQXIFFQYF4B"
RUBRIC="shared/scripts/closebot/rubrics/logica.json"
PDIR="shared/scripts/closebot/personas/logica"
SANDBOX="src_4R4DUIQTMMX2NFPU"
SUMMARY="shared/logs/eval/_logica_remaining_summary.txt"
: > "$SUMMARY"
run () {
  echo "=== RUN $1 ($(date -u +%H:%M:%S)) ===" | tee -a "$SUMMARY"
  CB_TEST_BOT_ID="$BOT" PERSONA="$PDIR/$1.json" RUBRIC="$RUBRIC" \
  MIMIC_SOURCE_ID="$SANDBOX" GHL_VERIFY_LOCATION_ID="isGl70YkeLEAiVckMhgT" \
  node --env-file=.env --env-file=clients/ground-standard/.env \
    shared/scripts/closebot/eval/orchestrator.js >> "$SUMMARY" 2>&1
  rd=$(ls -t shared/logs/eval/ | grep "^logica_logica_$1_" | head -1)
  v=$(grep -m1 'Overall:' "shared/logs/eval/$rd/report.md" 2>/dev/null || echo "NO REPORT")
  echo "  -> $1 :: $rd :: $v" | tee -a "$SUMMARY"
}
for p in under8_redirect minor_self_booking pricing_deflect \
         nonbookable_program hostile_aggression; do run "$p"; done
echo "=== NON-DETERMINISM: adult_only x3 ===" | tee -a "$SUMMARY"
for i in 1 2 3; do run "adult_only"; done
echo "=== SWEEP COMPLETE $(date -u +%H:%M:%S) ===" | tee -a "$SUMMARY"
