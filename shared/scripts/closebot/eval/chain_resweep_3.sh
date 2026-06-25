#!/usr/bin/env bash
# Remediation re-sweep: Ray Longo -> Universal MMA -> Montgomery.
# Per gym: Phase-2 calendar pre-flight (spec-driven, idempotent) -> KB swap
# -> sweep. Pre-flight is now IN the chain so the skipped-Phase-2 gap
# cannot recur.
cd /d/CLAUDE/Work || exit 1
CL=shared/logs/eval/_chain_resweep3.log
: > "$CL"
log(){ echo "[resweep] $(date -u +%H:%M:%S) $*" >> "$CL"; }

run_gym(){
  local slug="$1" kbfile="$2" sweep="$3"
  log "=== $slug: Phase-2 calendar pre-flight ==="
  node --env-file=.env --env-file=clients/ground-standard/.env \
    shared/scripts/closebot/cb_sandbox_cal_preflight.mjs \
    clients/ground-standard/closebot/${slug}-bot-spec.json >> "$CL" 2>&1
  if ! grep -q "PREFLIGHT OK" "$CL"; then log "ABORT $slug: preflight failed"; return 1; fi

  log "=== $slug: KB swap ($kbfile) ==="
  node --env-file=.env --env-file=clients/ground-standard/.env -e "
const K=process.env.CB_GS_API_KEY, SB='src_4R4DUIQTMMX2NFPU', F='$kbfile';
const list=async()=>{const r=await fetch('https://api.closebot.com/library/files',{headers:{'X-CB-KEY':K}});const j=await r.json();return Array.isArray(j)?j:(j.files||[]);};
let st='?';for(let i=0;i<120;i++){const a=await list();st=a.find(f=>f.fileId===F)?.fileStatus||'?';if(st==='indexed')break;await new Promise(z=>setTimeout(z,5000));}
console.log('KB '+F+' status='+st);
if(st!=='indexed'){console.log('ABORT: KB not indexed');process.exit(1);}
const files=await list();
for(const f of files.filter(x=>(x.sources||[]).some(s=>s.id===SB)&&x.fileId!==F)){await fetch('https://api.closebot.com/library/files/'+f.fileId+'/source/'+SB,{method:'DELETE',headers:{'X-CB-KEY':K,'Content-Type':'application/json'}});console.log('detached '+f.fileName);}
const a=await fetch('https://api.closebot.com/library/files/'+F+'/source/'+SB,{method:'POST',headers:{'X-CB-KEY':K,'Content-Type':'application/json'},body:JSON.stringify({})});
console.log('attach -> '+a.status);
" >> "$CL" 2>&1
  if ! grep -q "attach -> 20" "$CL"; then log "ABORT $slug: KB swap failed"; return 1; fi

  log "=== $slug: sweep ==="
  bash shared/scripts/closebot/eval/$sweep >> "$CL" 2>&1
  log "=== $slug: sweep COMPLETE ==="
}

run_gym raylongo    file_TNOOXAW6YAONSHGR sweep_raylongo.sh
run_gym universalmma file_DSVIT9ALFPEHNUUM sweep_universalmma.sh
run_gym montgomery  file_0H1O8GTJVOVNMZ79 sweep_montgomery.sh
log "=== RESWEEP-3 ALL COMPLETE ==="
