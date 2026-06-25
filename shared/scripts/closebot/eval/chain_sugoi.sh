#!/usr/bin/env bash
# Wait for Sugoi KB (file_DQ3IW8COTU1RKVAR) to index, then run the Sugoi sweep.
cd /d/CLAUDE/Work || exit 1
CL=shared/logs/eval/_chain_sugoi.log
: > "$CL"
echo "[chain] $(date -u +%H:%M:%S) waiting for Sugoi KB index..." >> "$CL"
until node --env-file=.env --env-file=clients/ground-standard/.env -e '
const K=process.env.CB_GS_API_KEY;
const r=await fetch("https://api.closebot.com/library/files",{headers:{"X-CB-KEY":K}});
const j=await r.json();const a=Array.isArray(j)?j:(j.files||[]);
const f=a.find(x=>x.fileId==="file_DQ3IW8COTU1RKVAR");
process.exit(f&&f.fileStatus==="indexed"?0:1);
' 2>/dev/null; do sleep 30; done
echo "[chain] $(date -u +%H:%M:%S) Sugoi KB indexed. Confirming sandbox attach + starting sweep." >> "$CL"
# ensure attached (kb_swap attaches, but re-assert in case it WARNed)
node --env-file=.env --env-file=clients/ground-standard/.env -e '
const K=process.env.CB_GS_API_KEY;
const a=await fetch("https://api.closebot.com/library/files/file_DQ3IW8COTU1RKVAR/source/src_4R4DUIQTMMX2NFPU",{method:"POST",headers:{"X-CB-KEY":K,"Content-Type":"application/json"},body:JSON.stringify({})});
console.log("reassert attach ->",a.status);
' >> "$CL" 2>&1
bash shared/scripts/closebot/eval/sweep_sugoi.sh >> "$CL" 2>&1
echo "[chain] $(date -u +%H:%M:%S) Sugoi sweep COMPLETE." >> "$CL"
