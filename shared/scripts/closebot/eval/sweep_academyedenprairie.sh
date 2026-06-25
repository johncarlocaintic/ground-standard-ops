#!/usr/bin/env bash
# Eden Prairie full eval sweep: 11 personas + 3x adult_only non-determinism.
# Sequential (orchestrator SSE is stateful). Run from repo root.
# GHL verify creds auto-resolve inside orchestrator from --env-file + the
# sandbox MIMIC mapping (proven by the adult_only validation run).
BOT="bot_W8X9OFUFJK6U75Z6"
RUBRIC="shared/scripts/closebot/rubrics/academyedenprairie.json"
PDIR="shared/scripts/closebot/personas/academyedenprairie"
SANDBOX="src_4R4DUIQTMMX2NFPU"
SUMMARY="shared/logs/eval/_academyedenprairie_sweep_summary.txt"
: > "$SUMMARY"

run () {
  local pfile="$1" label="$2"
  echo "=== RUN $label ($(date -u +%H:%M:%S)) ===" | tee -a "$SUMMARY"
  CB_TEST_BOT_ID="$BOT" \
  PERSONA="$PDIR/$pfile" \
  RUBRIC="$RUBRIC" \
  MIMIC_SOURCE_ID="$SANDBOX" \
  GHL_VERIFY_LOCATION_ID="isGl70YkeLEAiVckMhgT" \
  node --env-file=.env --env-file=clients/ground-standard/.env \
    shared/scripts/closebot/eval/orchestrator.js >> "$SUMMARY" 2>&1
  # newest run dir
  local rd
  rd=$(ls -t shared/logs/eval/ | grep "^academyedenprairie_" | head -1)
  local verdict
  verdict=$(grep -m1 -iE 'verdict|overall' "shared/logs/eval/$rd/report.md" 2>/dev/null | head -1)
  echo "  -> $label run_dir=$rd :: $verdict" | tee -a "$SUMMARY"
}

for p in adult_only adult_muaythai kid_young_bjj kid_older_bjj adult_and_kid \
         teen_13_17_nocal kid_muaythai_redirect nonbookable_womensonly \
         nonbookable_mma pricing_deflect minor_self_booking hostile_aggression; do
  run "$p.json" "$p"
done

echo "=== NON-DETERMINISM: adult_only x3 ===" | tee -a "$SUMMARY"
for i in 1 2 3; do run "adult_only.json" "adult_only_rep$i"; done

echo "=== SWEEP COMPLETE $(date -u +%H:%M:%S) ===" | tee -a "$SUMMARY"
