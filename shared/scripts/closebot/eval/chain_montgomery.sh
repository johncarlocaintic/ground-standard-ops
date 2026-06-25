#!/usr/bin/env bash
# Wait for Universal MMA sweep done, then KB-swap to Montgomery and run its sweep.
cd /d/CLAUDE/Work || exit 1
CL=shared/logs/eval/_chain_montgomery.log
: > "$CL"
echo "[chain] $(date -u +%H:%M:%S) waiting for Universal MMA SWEEP COMPLETE..." >> "$CL"
until grep -q "SWEEP COMPLETE" shared/logs/eval/_universalmma_sweep_summary.txt 2>/dev/null; do sleep 30; done
echo "[chain] $(date -u +%H:%M:%S) Universal MMA done. Swapping KB to Montgomery (file_0H1O8GTJVOVNMZ79)." >> "$CL"
node --env-file=.env --env-file=clients/ground-standard/.env -e '
const K=process.env.CB_GS_API_KEY, SB="src_4R4DUIQTMMX2NFPU", MG="file_0H1O8GTJVOVNMZ79";
const list=async()=>{const r=await fetch("https://api.closebot.com/library/files",{headers:{"X-CB-KEY":K}});const j=await r.json();return Array.isArray(j)?j:(j.files||[]);};
let st="?";for(let i=0;i<120;i++){const a=await list();st=a.find(f=>f.fileId===MG)?.fileStatus||"?";if(st==="indexed")break;await new Promise(z=>setTimeout(z,5000));}
console.log("Montgomery KB status:",st);
if(st!=="indexed"){console.log("ABORT: KB not indexed");process.exit(1);}
const files=await list();
for(const f of files.filter(x=>(x.sources||[]).some(s=>s.id===SB)&&x.fileId!==MG)){
  const r=await fetch("https://api.closebot.com/library/files/"+f.fileId+"/source/"+SB,{method:"DELETE",headers:{"X-CB-KEY":K,"Content-Type":"application/json"}});
  console.log("detached",f.fileName,"->",r.status);
}
const a=await fetch("https://api.closebot.com/library/files/"+MG+"/source/"+SB,{method:"POST",headers:{"X-CB-KEY":K,"Content-Type":"application/json"},body:JSON.stringify({})});
console.log("attach Montgomery ->",a.status);
' >> "$CL" 2>&1
if ! grep -q "attach Montgomery -> 20" "$CL"; then echo "[chain] KB swap FAILED" >> "$CL"; exit 1; fi
echo "[chain] $(date -u +%H:%M:%S) Montgomery KB attached. Starting sweep." >> "$CL"
bash shared/scripts/closebot/eval/sweep_montgomery.sh >> "$CL" 2>&1
echo "[chain] $(date -u +%H:%M:%S) Montgomery sweep COMPLETE." >> "$CL"
