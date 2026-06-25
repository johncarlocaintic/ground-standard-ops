#!/usr/bin/env bash
# Master chain: Paragon -> OM BJJ -> Sugoi -> Ray Longo -> Universal MMA -> Montgomery.
# Paragon sweep is already running independently.
# This script handles all KB swaps + sweeps in sequence from OM BJJ onward.
cd /d/CLAUDE/Work || exit 1
CL=shared/logs/eval/_chain_all_gyms_2_7.log
: > "$CL"
log(){ echo "[chain] $(date -u +%H:%M:%S) $*" | tee -a "$CL"; }

kb_swap(){
  local slug="$1" kbfile="$2"
  log "KB swap: $slug -> $kbfile"
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
  grep -q "attach -> 20" "$CL"
}

run_gym(){
  local slug="$1" kbfile="$2" sweep="$3"
  log "=== $slug: KB swap ($kbfile) ==="
  if ! kb_swap "$slug" "$kbfile"; then log "ABORT $slug: KB swap failed"; return 1; fi
  log "=== $slug: sweep starting ==="
  bash shared/scripts/closebot/eval/$sweep
  log "=== $slug: sweep COMPLETE ==="
}

# Step 1: Wait for Paragon sweep to complete
log "Waiting for Paragon sweep COMPLETE..."
until grep -q "SWEEP COMPLETE" shared/logs/eval/_paragonsimi_sweep_summary.txt 2>/dev/null; do sleep 30; done
log "Paragon done."

# Step 2: KB swap to OM BJJ + sweep
run_gym ombjj file_3X4MEYJHTC83BKFZ sweep_ombjj.sh

# Step 3: KB swap to Sugoi + sweep
run_gym sugoi file_DQ3IW8COTU1RKVAR sweep_sugoi.sh

# Step 4: KB swap to Ray Longo + sweep
run_gym raylongo file_TNOOXAW6YAONSHGR sweep_raylongo.sh

# Step 5: KB swap to Universal MMA + sweep
run_gym universalmma file_DSVIT9ALFPEHNUUM sweep_universalmma.sh

# Step 6: KB swap to Montgomery + sweep
run_gym montgomery file_0H1O8GTJVOVNMZ79 sweep_montgomery.sh

log "=== ALL GYMS 2-7 COMPLETE ==="
