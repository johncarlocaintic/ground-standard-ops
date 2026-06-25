#!/usr/bin/env bash
# Master chain: Signature -> Roberts -> Simple Man -> Killer B.
# KB swap before each sweep, then run the sweep.
cd /d/CLAUDE/Work || exit 1
CL=shared/logs/eval/_chain_all_gyms_8_11.log
: > "$CL"
log(){ echo "[chain8-11] $(date -u +%H:%M:%S) $*" | tee -a "$CL"; }

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

# Gym 8: Signature of Jiu-Jitsu
run_gym signature file_HUV6O6OPYV75BC28 sweep_signature.sh

# Gym 9: Roberts Family MMA
run_gym roberts file_K5KZUO5XEQCVH2II sweep_roberts.sh

# Gym 10: Simple Man Martial Arts
run_gym simpleman file_77SE33FQ3OK6SIKT sweep_simpleman.sh

# Gym 11: Killer B Combat Sports Academy
run_gym killerb file_0WPRISMU5IT4D2GN sweep_killerb.sh

log "=== ALL GYMS 8-11 COMPLETE ==="
