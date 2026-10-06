'use strict';
const $=s=>document.querySelector(s), STORAGE='clear-day-v1';
const dateKey=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const dayOffset=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return dateKey(d)};
const parseDate=k=>new Date(k+'T12:00:00');
const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(n);
let state={name:'',brand:'',baseline:10,target:5,cost:15,start:dateKey(),days:{},sound:true};
let storageOK=true;
try{const raw=localStorage.getItem(STORAGE);if(raw){const s=JSON.parse(raw);if(s&&typeof s==='object'&&s.days&&typeof s.days==='object'){state={...state,...s};state.days=Object.fromEntries(Object.entries(s.days).filter(([k,v])=>/^\d{4}-\d{2}-\d{2}$/.test(k)&&Array.isArray(v)&&v.every(e=>e&&Number.isFinite(e.time)&&Number.isFinite(e.cost)&&e.cost>=0)));for(const k of ['baseline','target','cost'])if(!Number.isFinite(state[k])||state[k]<0)state[k]=k==='cost'?15:k==='baseline'?10:5;if(typeof state.name!=='string')state.name='';if(typeof state.brand!=='string')state.brand='';if(!/^\d{4}-\d{2}-\d{2}$/.test(state.start)||!Number.isFinite(parseDate(state.start).getTime())||state.start>dateKey())state.start=dateKey()}}}catch{storageOK=false}
function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('visible');clearTimeout(toast.timeout);toast.timeout=setTimeout(()=>$('#toast').classList.remove('visible'),3500)}
function persist(){try{localStorage.setItem(STORAGE,JSON.stringify(state));storageOK=true;return true}catch{storageOK=false;toast('Storage is unavailable. Export your data to keep a copy.');return false}}
function daysBetween(a,b){return Math.round((Date.UTC(...a.split('-').map((v,i)=>Number(v)-(i===1?1:0)))-Date.UTC(...b.split('-').map((v,i)=>Number(v)-(i===1?1:0))))/86400000)}
function render(){
 const today=dateKey(),logs=state.days[today]||[],count=logs.length,yesterday=state.days[dayOffset(-1)];
 $('#date-label').textContent=new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).toUpperCase();
 $('#greeting').textContent=state.name?`A fresh start, ${state.name}.`:'A fresh start, every day.';
 $('#profile-name').textContent=state.name||'Your space';$('#avatar').textContent=(state.name||'Y').slice(0,1).toUpperCase();
 $('#today').textContent=count;$('#log').setAttribute('aria-label',`Log a cigarette. ${count} consumed today.`);$('#yesterday').textContent=yesterday?yesterday.length:'—';$('#yesterday-note').textContent=yesterday?'cigarettes':'not tracked';
 const monthDays=Object.entries(state.days).filter(([key])=>key.startsWith(today.slice(0,7))&&key<=today);
 $('#month-average').textContent=monthDays.length?(monthDays.reduce((sum,[,entries])=>sum+entries.length,0)/monthDays.length).toFixed(1):'—';
 $('#month-caption').textContent=monthDays.length?`per day · ${monthDays.length} tracked`:'no days tracked';
 $('#sound-toggle').textContent=state.sound===false?'Sound off':'Sound on';$('#sound-toggle').setAttribute('aria-pressed',String(state.sound!==false));
 $('#goal-text').textContent=`· ${state.target} cigarettes`;
 $('#remaining').textContent=count>state.target?`${count-state.target} over target`:state.target===count?'Target reached':`${state.target-count} remaining`;
 $('#goal-progress').style.width=`${state.target?Math.min(100,count/state.target*100):count?100:0}%`;
 $('#goal-progress').style.background=count>state.target?'#b48b63':'#9bad7f';
 $('#last-log').textContent=logs.length?`Last logged at ${new Date(logs.at(-1).time).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}`:'Every check-in is a step forward.';$('#undo').disabled=!logs.length;
 $('#spent').textContent=money(logs.reduce((sum,e)=>sum+e.cost,0));$('#avoided').replaceChildren(document.createTextNode(Math.max(0,state.baseline-count)+' '));const em=document.createElement('em');em.textContent='cigarettes';$('#avoided').append(em);
 $('#saved').textContent=money(Math.max(0,state.baseline*state.cost-logs.reduce((sum,e)=>sum+e.cost,0)));$('#baseline-caption').textContent=`Compared with your usual ${state.baseline} per day`;
 $('#journey-days').textContent=Math.max(1,daysBetween(today,state.start)+1);$('#started').textContent=parseDate(state.start).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
 let streak=0,offset=state.days[today]?.length===0?0:-1;while(!count&&streak<36500){const key=dayOffset(offset);if(key<state.start||!state.days[key]||state.days[key].length)break;streak++;offset--}$('#streak').textContent=`${streak} ${streak===1?'day':'days'}`;
 const max=Math.max(state.baseline,1,...Array.from({length:7},(_,i)=>(state.days[dayOffset(i-6)]||[]).length));let total=0;$('#week-bars').replaceChildren();
 for(let i=-6;i<=0;i++){const key=dayOffset(i),tracked=state.days[key],n=tracked?.length||0;total+=n;const cell=document.createElement('div');cell.className='bar-cell'+(i===0?' today':'');cell.innerHTML='<div class="bar-track"><div class="bar-fill"><b></b></div></div><span></span>';cell.querySelector('.bar-fill').style.height=`${n/max*85}%`;cell.querySelector('b').textContent=tracked?n:'—';cell.querySelector('span').textContent=i===0?'Today':parseDate(key).toLocaleDateString('en-IN',{weekday:'short'});cell.setAttribute('aria-label',`${key}: ${tracked?n+' cigarettes':'not tracked'}`);$('#week-bars').append(cell)}$('#week-total').textContent=`${total} logged this week`;
 $('#history-table').replaceChildren();for(let i=0;i>-30;i--){const k=dayOffset(i);if(k<state.start)break;const entries=state.days[k];const row=document.createElement('tr');for(const text of [parseDate(k).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),entries?entries.length:'—',entries?money(entries.reduce((s,e)=>s+e.cost,0)):'—',entries?(entries.length?'Logged':'Smoke-free check-in'):'Not tracked']){const cell=document.createElement('td');cell.textContent=text;row.append(cell)}if(i===0&&!entries){const btn=document.createElement('button');btn.className='text-button';btn.textContent='Check in smoke-free';btn.onclick=()=>{state.days[dateKey()]=[];persist();render();toast('Today checked in smoke-free. You can still log later.')};row.lastChild.append(document.createElement('br'),btn)}$('#history-table').append(row)}
 $('.sidebar-bottom').lastChild.textContent=storageOK?' Saved on this device':' Storage unavailable — export a backup';
}
function navigate(view){for(const v of ['overview','history','plan'])$(`#${v}-view`).hidden=v!==view;document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.view===view));$('#view-label').textContent={overview:'Overview',history:'My history',plan:'My plan'}[view];if(view==='plan'){const form=$('#plan-form');for(const key of ['name','brand','baseline','target','cost','start'])form.elements.namedItem(key).value=state[key];form.elements.start.max=dateKey()}window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>navigate(b.dataset.view));$('#settings').onclick=()=>navigate('plan');
let tapAudio;
function playTap(){
 if(state.sound===false)return;
 try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;tapAudio??=new Audio();
 const click=()=>{if(tapAudio.state!=='running')return;const now=tapAudio.currentTime,osc=tapAudio.createOscillator(),gain=tapAudio.createGain();osc.type='sine';osc.frequency.setValueAtTime(700,now);osc.frequency.exponentialRampToValueAtTime(220,now+.055);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.16,now+.004);gain.gain.exponentialRampToValueAtTime(.0001,now+.065);osc.connect(gain);gain.connect(tapAudio.destination);osc.onended=()=>{osc.disconnect();gain.disconnect()};osc.start(now);osc.stop(now+.075)};
 if(tapAudio.state==='suspended')tapAudio.resume().then(click).catch(()=>{});else click();
 }catch{/* Logging remains available when audio is unsupported. */}
}
$('#sound-toggle').onclick=()=>{state.sound=state.sound===false;persist();render();if(state.sound)playTap()};
$('#log').onclick=()=>{playTap();const key=dateKey();if(!state.days[key])state.days[key]=[];state.days[key].push({time:Date.now(),cost:state.cost});persist();render();toast('Cigarette logged. Keep showing up.')};
$('#undo').onclick=()=>{const entries=state.days[dateKey()];if(entries?.length){entries.pop();if(!entries.length)delete state.days[dateKey()];persist();render();toast('Last cigarette removed.')}};
$('#plan-form').onsubmit=e=>{e.preventDefault();const f=e.target;const baseline=Number(f.elements.baseline.value),target=Number(f.elements.target.value),cost=Number(f.elements.cost.value),start=f.elements.start.value;if(!f.checkValidity()||baseline<1||target<0||cost<0||start>dateKey()||!Number.isFinite(parseDate(start).getTime())){toast('Please enter valid details and a start date no later than today.');return}const firstLog=Object.keys(state.days).sort()[0];if(firstLog&&start>firstLog){toast('Start date must include your earliest recorded day.');return}Object.assign(state,{name:f.elements.name.value.trim(),brand:f.elements.brand.value.trim(),baseline,target,cost,start});persist();render();toast('Your plan is saved.');navigate('overview')};
$('#export').onclick=()=>{const blob=new Blob([JSON.stringify({app:'Clear Day',exportedAt:new Date().toISOString(),...state},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`clear-day-${dateKey()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Your data export is ready.')};
let interval=null,remaining=60;
function stopBreathing(){clearInterval(interval);interval=null;$('#breath-start').disabled=false;$('#breath-orb').classList.remove('expanded')}
$('#craving-open').onclick=()=>{stopBreathing();remaining=60;$('#timer').textContent='60';$('#breath-instruction').textContent='Ready?';$('#breath-start').textContent='Start a 60-second pause';$('#breathing').showModal()};
$('#breath-start').onclick=()=>{if(interval)return;remaining=60;const deadline=Date.now()+60000;$('#breath-start').disabled=true;function tick(){remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));$('#timer').textContent=remaining;const inhale=(60-remaining)%8<4;$('#breath-instruction').textContent=inhale?'Breathe in':'Breathe out';$('#breath-orb').classList.toggle('expanded',inhale);if(!remaining){stopBreathing();$('#breath-instruction').textContent='A moment for you.';$('#breath-start').textContent='Take another pause';toast('One calm minute. One small step.')}}tick();interval=setInterval(tick,250)};
$('#breathing').addEventListener('close',stopBreathing);$('#privacy').onclick=()=>$('#about').showModal();document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(`#${b.dataset.close}`).close());
render();setInterval(render,30000);if(!storageOK)toast('Saved data could not be read. Export new entries to keep a backup.');
