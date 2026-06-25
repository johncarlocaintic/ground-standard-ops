#!/usr/bin/env bash
# Chain: wait for Paragon sweep to finish, then KB-swap to OM BJJ and run its sweep.
# Paragon sweep is already running independently. This only handles the handoff.
set -u
CHAINLOG="shared/logs/eval/_chain_paragon_ombjj.log"
: > "$CHAINLOG"
echo "[chain] $(date -u +%H:%M:%S) waiting for Paragon SWEEP COMPLETE..." | tee -a "$CHAINLOG"

# 1. Wait for Paragon sweep to complete
until grep -q "SWEEP COMPLETE" shared/logs/eval/_paragonsimi_sweep_summary.txt 2>/dev/null; do
  sleep 30
done
echo "[chain] $(date -u +%H:%M:%S) Paragon sweep DONE. Swapping KB to OM BJJ." | tee -a "$CHAINLOG"

# 2. KB swap: detach Paragon KB from sandbox, attach OM BJJ KB (pre-uploaded file_3X4MEYJHTC83BKFZ).
#    Wait until OM BJJ KB is indexed before attaching (never eval an unindexed KB).
node --env-file=.env --env-file=clients/ground-standard/.env -e '
const K = process.env.CB_GS_API_KEY;
const SANDBOX = "src_4R4DUIQTMMX2NFPU";
const OMBJJ = "file_3X4MEYJHTC83BKFZ";
const list = async () => { const r = await fetch("https://api.closebot.com/library/files",{headers:{"X-CB-KEY":K}}); const j=await r.json(); return Array.isArray(j)?j:(j.files||[]); };
// wait for indexed
let st = "?";
for (let i=0;i<90;i++){ const a=await list(); st=a.find(f=>f.fileId===OMBJJ)?.fileStatus||"?"; if(st==="indexed")break; await new Promise(z=>setTimeout(z,5000)); }
console.log("OM BJJ KB status:", st);
if (st!=="indexed"){ console.log("WARN: OM BJJ KB not indexed - aborting chain"); process.exit(1); }
// detach every other KB on sandbox
const files = await list();
for (const f of files.filter(x=>(x.sources||[]).some(s=>s.id===SANDBOX) && x.fileId!==OMBJJ)) {
  const r = await fetch("https://api.closebot.com/library/files/"+f.fileId+"/source/"+SANDBOX,{method:"DELETE",headers:{"X-CB-KEY":K,"Content-Type":"application/json"}});
  console.log("detached", f.fileName, "->", r.status);
}
// attach OM BJJ
const a = await fetch("https://api.closebot.com/library/files/"+OMBJJ+"/source/"+SANDBOX,{method:"POST",headers:{"X-CB-KEY":K,"Content-Type":"application/json"},body:JSON.stringify({})});
console.log("attach OM BJJ ->", a.status);
' 2>&1 | tee -a "$CHAINLOG"

if ! grep -q "attach OM BJJ -> 20" "$CHAINLOG"; then
  echo "[chain] $(date -u +%H:%M:%S) KB swap FAILED - not starting OM BJJ sweep" | tee -a "$CHAINLOG"
  exit 1
fi

echo "[chain] $(date -u +%H:%M:%S) OM BJJ KB attached. Starting OM BJJ sweep." | tee -a "$CHAINLOG"

# 3. Run OM BJJ sweep
bash shared/scripts/closebot/eval/sweep_ombjj.sh >> "$CHAINLOG" 2>&1
echo "[chain] $(date -u +%H:%M:%S) OM BJJ sweep COMPLETE. Chain done." | tee -a "$CHAINLOG"
