#!/usr/bin/env bash
# SOMA MVMT v1.0 sweep on bot_U2JSE7DXEXL7ME50
# Strict sequential. No concurrent chains.
BOT="bot_U2JSE7DXEXL7ME50"
RUBRIC="shared/scripts/closebot/rubrics/soma.json"
PDIR="shared/scripts/closebot/personas/soma"
SANDBOX="src_4R4DUIQTMMX2NFPU"
SUMMARY="shared/logs/eval/_soma_sweep_summary.txt"
: > "$SUMMARY"

run () {
  echo "=== RUN $1 ($(date -u +%H:%M:%S)) ===" | tee -a "$SUMMARY"
  CB_TEST_BOT_ID="$BOT" PERSONA="$PDIR/$1.json" RUBRIC="$RUBRIC" \
  MIMIC_SOURCE_ID="$SANDBOX" GHL_VERIFY_LOCATION_ID="isGl70YkeLEAiVckMhgT" \
  node --env-file=.env --env-file=clients/ground-standard/.env \
    shared/scripts/closebot/eval/orchestrator.js >> "$SUMMARY" 2>&1
  rd=$(ls -t shared/logs/eval/ | grep "^soma_soma_$1_" | head -1)
  v=$(grep -m1 'Overall:' "shared/logs/eval/$rd/report.md" 2>/dev/null || echo "NO REPORT")
  echo "  -> $1 :: $rd :: $v" | tee -a "$SUMMARY"
}

for p in adult_only adult_inquisitive pricing_deflect nonbookable_steelmace nonbookable_mindfulness under18_self_booking parent_for_child faq_questions hostile_aggression; do
  run "$p"
done

echo "=== NON-DETERMINISM: adult_only x3 ===" | tee -a "$SUMMARY"
for i in 1 2 3; do run "adult_only"; done

echo "=== SWEEP COMPLETE $(date -u +%H:%M:%S) ===" | tee -a "$SUMMARY"
