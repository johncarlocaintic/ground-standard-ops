#!/usr/bin/env bash
# Targeted adult_and_kid run against Logica v1.3 to verify multi-enrollee adult calendar fix
BOT="bot_8F6LD2M4728TS05O"
RUBRIC="shared/scripts/closebot/rubrics/logica.json"
PDIR="shared/scripts/closebot/personas/logica"
SANDBOX="src_4R4DUIQTMMX2NFPU"
SUMMARY="shared/logs/eval/_logica_v13_adult_and_kid.txt"
: > "$SUMMARY"
echo "=== Logica v1.3 adult_and_kid ($(date -u +%H:%M:%S)) ===" | tee -a "$SUMMARY"
CB_TEST_BOT_ID="$BOT" PERSONA="$PDIR/adult_and_kid.json" RUBRIC="$RUBRIC" \
MIMIC_SOURCE_ID="$SANDBOX" GHL_VERIFY_LOCATION_ID="isGl70YkeLEAiVckMhgT" \
node --env-file=.env --env-file=clients/ground-standard/.env \
  shared/scripts/closebot/eval/orchestrator.js >> "$SUMMARY" 2>&1
rd=$(ls -t shared/logs/eval/ | grep "^logica_logica_adult_and_kid_" | head -1)
v=$(grep -m1 'Overall:' "shared/logs/eval/$rd/report.md" 2>/dev/null || echo "NO REPORT")
echo "  -> adult_and_kid (v1.3) :: $rd :: $v" | tee -a "$SUMMARY"
echo "=== DONE $(date -u +%H:%M:%S) ===" | tee -a "$SUMMARY"
