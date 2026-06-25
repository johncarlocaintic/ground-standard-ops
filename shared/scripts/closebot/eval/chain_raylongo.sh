#!/usr/bin/env bash
# Wait for Sugoi sweep to finish, then KB-swap to Ray Longo and run its sweep.
cd /d/CLAUDE/Work || exit 1
CL=shared/logs/eval/_chain_raylongo.log
: > "$CL"
echo "[chain] $(date -u +%H:%M:%S) waiting for Sugoi SWEEP COMPLETE..." >> "$CL"
until grep -q "SWEEP COMPLETE" shared/logs/eval/_sugoi_sweep_summary.txt 2>/dev/null; do sleep 30; done
echo "[chain] $(date -u +%H:%M:%S) Sugoi done. Swapping KB to Ray Longo (file_TNOOXAW6YAONSHGR)." >> "$CL"
node --env-file=.env --env-file=clients/ground-standard/.env -e '
const K=process.env.CB_GS_API_KEY, SB="src_4R4DUIQTMMX2NFPU", RL="file_TNOOXAW6YAONSHGR";
const list=async()=>{const r=await fetch("https://api.closebot.com/library/files",{headers:{"X-CB-KEY":K}});const j=await r.json();return Array.isArray(j)?j:(j.files||[]);};
let st="?";for(let i=0;i<120;i++){const a=await list();st=a.find(f=>f.fileId===RL)?.fileStatus||"?";if(st==="indexed")break;await new Promise(z=>setTimeout(z,5000));}
console.log("Ray Longo KB status:",st);
if(st!=="indexed"){console.log("ABORT: KB not indexed");process.exit(1);}
const files=await list();
for(const f of files.filter(x=>(x.sources||[]).some(s=>s.id===SB)&&x.fileId!==RL)){
  const r=await fetch("https://api.closebot.com/library/files/"+f.fileId+"/source/"+SB,{method:"DELETE",headers:{"X-CB-KEY":K,"Content-Type":"application/json"}});
  console.log("detached",f.fileName,"->",r.status);
}
const a=await fetch("https://api.closebot.com/library/files/"+RL+"/source/"+SB,{method:"POST",headers:{"X-CB-KEY":K,"Content-Type":"application/json"},body:JSON.stringify({})});
console.log("attach Ray Longo ->",a.status);
' >> "$CL" 2>&1
if ! grep -q "attach Ray Longo -> 20" "$CL"; then echo "[chain] KB swap FAILED" >> "$CL"; exit 1; fi
echo "[chain] $(date -u +%H:%M:%S) Ray Longo KB attached. Starting sweep." >> "$CL"
bash shared/scripts/closebot/eval/sweep_raylongo.sh >> "$CL" 2>&1
echo "[chain] $(date -u +%H:%M:%S) Ray Longo sweep COMPLETE." >> "$CL"
