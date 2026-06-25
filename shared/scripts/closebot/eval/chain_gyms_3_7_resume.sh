#!/usr/bin/env bash
# Resume chain: OM BJJ -> Sugoi -> Ray Longo -> Universal MMA -> Montgomery.
# Paragon is already SWEEP COMPLETE. Start immediately from OM BJJ.
cd /d/CLAUDE/Work || exit 1
CL=shared/logs/eval/_chain_gyms_3_7_resume.log
: > "$CL"
log(){ echo "[chain3-7] $(date -u +%H:%M:%S) $*" | tee -a "$CL"; }

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

# KB file IDs for gyms 3-7 (from uploads in current session)
# Gym 3: OM BJJ
run_gym ombjj file_3X4MEYJHTC83BKFZ sweep_ombjj.sh

# Gym 4: Sugoi (sweep script now uses v2.0 bot_JNTG80QQ0CMJP35W)
run_gym sugoi file_DQ3IW8COTU1RKVAR sweep_sugoi.sh

# Gym 5: Ray Longo
run_gym raylongo file_TNOOXAW6YAONSHGR sweep_raylongo.sh

# Gym 6: Universal MMA
run_gym universalmma file_DSVIT9ALFPEHNUUM sweep_universalmma.sh

# Gym 7: Montgomery
run_gym montgomery file_0H1O8GTJVOVNMZ79 sweep_montgomery.sh

log "=== ALL GYMS 3-7 COMPLETE ==="
