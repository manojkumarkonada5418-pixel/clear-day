'use strict';
const $=s=>document.querySelector(s), STORAGE='clear-day-v1';
const dateKey=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const dayOffset=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return dateKey(d)};
const parseDate=k=>new Date(k+'T12:00:00');
const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(n);
let state={name:'',brand:'',baseline:10,target:5,cost:15,start:dateKey(),days:{},sound:true,theme:'light',planSteps:[],planComplete:false};
let storageOK=true;
try{const raw=localStorage.getItem(STORAGE);if(raw){const s=JSON.parse(raw);if(s&&typeof s==='object'&&s.days&&typeof s.days==='object'){state={...state,...s};state.planComplete=s.planComplete===true||s.planComplete===undefined;state.days=Object.fromEntries(Object.entries(s.days).filter(([k,v])=>/^\d{4}-\d{2}-\d{2}$/.test(k)&&Array.isArray(v)&&v.every(e=>e&&Number.isFinite(e.time)&&Number.isFinite(e.cost)&&e.cost>=0)));for(const k of ['baseline','target','cost'])if(!Number.isFinite(state[k])||state[k]<0)state[k]=k==='cost'?15:k==='baseline'?10:5;if(typeof state.name!=='string')state.name='';if(typeof state.brand!=='string')state.brand='';if(!/^\d{4}-\d{2}-\d{2}$/.test(state.start)||!Number.isFinite(parseDate(state.start).getTime())||state.start>dateKey())state.start=dateKey()}}}catch{storageOK=false}
function toast(msg,error=false){$('#toast').textContent=msg;$('#toast').classList.toggle('error',error);$('#toast').classList.add('visible');clearTimeout(toast.timeout);toast.timeout=setTimeout(()=>$('#toast').classList.remove('visible'),3500)}
function persist(){try{localStorage.setItem(STORAGE,JSON.stringify(state));storageOK=true;return true}catch{storageOK=false;toast('Storage is unavailable. Export your data to keep a copy.');return false}}
function daysBetween(a,b){return Math.round((Date.UTC(...a.split('-').map((v,i)=>Number(v)-(i===1?1:0)))-Date.UTC(...b.split('-').map((v,i)=>Number(v)-(i===1?1:0))))/86400000)}
function render(){
 const today=dateKey(),logs=state.days[today]||[],count=logs.length,yesterday=state.days[dayOffset(-1)];
 $('#date-label').textContent=new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'});
 $('#greeting').textContent={overview:'Home',history:'Stats',plan:'Plan',space:'My Space'}[$('.nav.active')?.dataset.view||'overview'];
 
 $('#today').textContent=count;$('#log').setAttribute('aria-label',`Log a cigarette. ${count} consumed today.`);$('#yesterday').textContent=yesterday?yesterday.length:'—';$('#yesterday-note').textContent=yesterday?'cigarettes':'not tracked';
 const monthDays=Object.entries(state.days).filter(([key])=>key.startsWith(today.slice(0,7))&&key<=today);
 $('#month-average').textContent=monthDays.length?(monthDays.reduce((sum,[,entries])=>sum+entries.length,0)/monthDays.length).toFixed(1):'—';
 $('#month-caption').textContent=monthDays.length?'per tracked day':'no days tracked';
 $('#sound-toggle').textContent=state.sound===false?'Sound off':'Sound on';$('#sound-toggle').setAttribute('aria-pressed',String(state.sound!==false));
 $('#goal-text').textContent=`${state.target} cigarette${state.target===1?'':'s'}`;
 $('#remaining').textContent=count>state.target?`${count-state.target} over target`:state.target===count?'Target reached':`${state.target-count} under target`;
 $('#goal-progress').style.width=`${state.target?Math.min(100,count/state.target*100):count?100:0}%`;
 const over=count>state.target,at=count===state.target;
 $('#goal-progress').style.background=over?'#d33838':at?'#c28b28':'#218365';
 $('.daily-goal').classList.toggle('over-limit',over);$('.daily-goal').classList.toggle('at-limit',at&&!over);
 $('#limit-error').hidden=!over;$('#limit-error').textContent=over?`Daily limit exceeded: ${count} logged, ${count-state.target} over your ${state.target}-cigarette limit.`:'';
 $('#log').disabled=!state.planComplete;$('#setup-notice').hidden=state.planComplete;
 renderPlanSummary();renderReferenceUI();
 $('#last-log').textContent=logs.length?relativeTime(logs.at(-1).time):'—';$('#undo').disabled=!logs.length;
 $('#spent').textContent=money(logs.reduce((sum,e)=>sum+e.cost,0));$('#avoided').replaceChildren(document.createTextNode(Math.max(0,state.baseline-count)+' '));const em=document.createElement('em');em.textContent='cigarettes';$('#avoided').append(em);
 $('#saved').textContent=money(Math.max(0,state.baseline*state.cost-logs.reduce((sum,e)=>sum+e.cost,0)));$('#baseline-caption').textContent=`Compared with your usual ${state.baseline} per day`;
 $('#journey-days').textContent=Math.max(1,daysBetween(today,state.start)+1);$('#started').textContent=parseDate(state.start).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
 let streak=0,offset=state.days[today]?.length===0?0:-1;while(!count&&streak<36500){const key=dayOffset(offset);if(key<state.start||!state.days[key]||state.days[key].length)break;streak++;offset--}$('#streak').textContent=`${streak} ${streak===1?'day':'days'}`;
 const max=Math.max(state.baseline,1,...Array.from({length:7},(_,i)=>(state.days[dayOffset(i-6)]||[]).length));let total=0;$('#week-bars').replaceChildren();
 for(let i=-6;i<=0;i++){const key=dayOffset(i),tracked=state.days[key],n=tracked?.length||0;total+=n;const cell=document.createElement('div');cell.className='bar-cell'+(i===0?' today':'');cell.innerHTML='<div class="bar-track"><div class="bar-fill"><b></b></div></div><span></span>';cell.querySelector('.bar-fill').style.height=`${n/max*85}%`;cell.querySelector('b').textContent=tracked?n:'—';cell.querySelector('span').textContent=i===0?'Today':parseDate(key).toLocaleDateString('en-IN',{weekday:'short'});cell.setAttribute('aria-label',`${key}: ${tracked?n+' cigarettes':'not tracked'}`);$('#week-bars').append(cell)}$('#week-total').textContent=`${total} logged this week`;
 $('#history-table').replaceChildren();for(let i=0;i>-30;i--){const k=dayOffset(i);if(k<state.start)break;const entries=state.days[k];const row=document.createElement('tr');for(const text of [parseDate(k).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),entries?entries.length:'—',entries?money(entries.reduce((s,e)=>s+e.cost,0)):'—',entries?(entries.length?'Logged':'Smoke-free check-in'):'Not tracked']){const cell=document.createElement('td');cell.textContent=text;row.append(cell)}if(i===0&&!entries){const btn=document.createElement('button');btn.className='text-button';btn.textContent='Check in smoke-free';btn.onclick=()=>{if(!state.planComplete){openPlan();return}state.days[dateKey()]=[];persist();render();toast('Today checked in smoke-free. You can still log later.')};row.lastChild.append(document.createElement('br'),btn)}$('#history-table').append(row)}
 if(!state.planComplete){$('#goal-text').textContent='Not set';$('#remaining').textContent='Set your limit';$('#spent').textContent='—';$('#saved').textContent='—'}
 $('#storage-note').textContent=storageOK?'Saved on this device':'Storage unavailable — export a backup';
}
function navigate(view){for(const v of ['overview','history','plan','space'])$(`#${v}-view`).hidden=v!==view;document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.view===view));$('#greeting').textContent={overview:'Home',history:'Stats',plan:'Plan',space:'My Space'}[view];if(view==='space')renderPlanSummary();window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>navigate(b.dataset.view));$('.brand').onclick=e=>{e.preventDefault();navigate('overview')};
let tapAudio,inhaleBuffer,activeInhale;
function playTap(){
 if(state.sound===false)return;
 try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;tapAudio??=new Audio();
 const click=()=>{
  if(tapAudio.state!=='running'||state.sound===false)return;
  if(activeInhale){activeInhale.stop();activeInhale=null}
  const duration=.95,now=tapAudio.currentTime;
  if(!inhaleBuffer){inhaleBuffer=tapAudio.createBuffer(1,Math.ceil(tapAudio.sampleRate*duration),tapAudio.sampleRate);const samples=inhaleBuffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1}
  const breath=tapAudio.createBufferSource(),filter=tapAudio.createBiquadFilter(),gain=tapAudio.createGain(),compressor=tapAudio.createDynamicsCompressor();
  breath.buffer=inhaleBuffer;filter.type='bandpass';filter.Q.value=.65;filter.frequency.setValueAtTime(850,now);filter.frequency.exponentialRampToValueAtTime(1700,now+.55);filter.frequency.exponentialRampToValueAtTime(1050,now+duration);
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(1.15,now+.16);gain.gain.linearRampToValueAtTime(1.45,now+.52);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  compressor.threshold.value=-12;compressor.knee.value=12;compressor.ratio.value=4;compressor.attack.value=.003;compressor.release.value=.1;
  breath.connect(filter);filter.connect(gain);gain.connect(compressor);compressor.connect(tapAudio.destination);
  breath.onended=()=>{breath.disconnect();filter.disconnect();gain.disconnect();compressor.disconnect();if(activeInhale===breath)activeInhale=null};activeInhale=breath;breath.start(now);breath.stop(now+duration);
 };
 if(tapAudio.state==='suspended')tapAudio.resume().then(click).catch(()=>{});else click();
 }catch{/* Logging remains available when audio is unsupported. */}
}
$('#sound-toggle').onclick=()=>{state.sound=state.sound===false;if(!state.sound&&activeInhale){activeInhale.stop();activeInhale=null}persist();render();if(state.sound)playTap()};
$('#log').onclick=()=>{if(!state.planComplete){openPlan();return}playTap();const key=dateKey();if(!state.days[key])state.days[key]=[];state.days[key].push({time:Date.now(),cost:state.cost});persist();render();toast(state.days[key].length>state.target?'Daily limit exceeded. Your cigarette has been recorded.':'Cigarette logged.',state.days[key].length>state.target)};
$('#undo').onclick=()=>{const entries=state.days[dateKey()];if(entries?.length){entries.pop();if(!entries.length)delete state.days[dateKey()];persist();render();toast('Last cigarette removed.')}};
$('#export').onclick=()=>{const blob=new Blob([JSON.stringify({app:'Clear Day',exportedAt:new Date().toISOString(),...state},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`clear-day-${dateKey()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Your data export is ready.')};
let interval=null,remaining=60;
function stopBreathing(){clearInterval(interval);interval=null;$('#breath-start').disabled=false;$('#breath-orb').classList.remove('expanded')}
$('#craving-open').onclick=()=>{stopBreathing();remaining=60;$('#timer').textContent='60';$('#breath-instruction').textContent='Ready?';$('#breath-start').textContent='Start a 60-second pause';$('#breathing').showModal()};
$('#breath-start').onclick=()=>{if(interval)return;remaining=60;const deadline=Date.now()+60000;$('#breath-start').disabled=true;function tick(){remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));$('#timer').textContent=remaining;const inhale=(60-remaining)%8<4;$('#breath-instruction').textContent=inhale?'Breathe in':'Breathe out';$('#breath-orb').classList.toggle('expanded',inhale);if(!remaining){stopBreathing();$('#breath-instruction').textContent='A moment for you.';$('#breath-start').textContent='Take another pause';toast('One calm minute. One small step.')}}tick();interval=setInterval(tick,250)};
$('#breathing').addEventListener('close',stopBreathing);$('#privacy').onclick=()=>$('#about').showModal();document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(`#${b.dataset.close}`).close());
const planQuestions=[
 {key:'name',title:'What should we call you?',hint:'Your name or nickname. Optional.',type:'text',placeholder:'Your name',maxLength:40},
 {key:'baseline',title:'How many do you smoke each day?',hint:'Your usual daily count.',type:'number',min:1,max:200,step:1,placeholder:'For example, 10'},
 {key:'target',title:'What is your daily limit?',hint:'Choose a manageable number. Use 0 for smoke-free.',type:'number',min:0,max:200,step:1,placeholder:'For example, 5'},
 {key:'cost',title:'What does one cigarette cost?',hint:'Price in rupees (₹).',type:'number',min:0,max:10000,step:.01,placeholder:'For example, 15'},
 {key:'brand',title:'Your usual brand?',hint:'Optional. You can skip this.',type:'text',placeholder:'Your usual brand',maxLength:60},
 {key:'start',title:'When will you start?',hint:'Today, or an earlier date.',type:'date'}
];
let planStep=0,planDraft;
function renderPlanSummary(){
 const box=$('#plan-summary');box.replaceChildren();
 if(!state.planComplete){const note=document.createElement('p');note.textContent="Let's answer a few questions before your first check-in.";box.append(note);$('#edit-plan').textContent='Set up my plan';return}
 $('#edit-plan').textContent="Edit plan";
 for(const [label,value] of [['Name',state.name||'Not set'],['Usual daily count',state.baseline],['Daily limit',state.target],['Price per cigarette',money(state.cost)],['Brand',state.brand||'Not set'],['Journey started',parseDate(state.start).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})]]){const card=document.createElement('div');card.className='plan-detail';const caption=document.createElement('span'),answer=document.createElement('b');caption.textContent=label;answer.textContent=value;card.append(caption,answer);box.append(card)}
}
function showQuestion(){
 const q=planQuestions[planStep],input=$('#plan-answer');
 $('#question-step').textContent=`Your plan · ${planStep+1} of ${planQuestions.length}`;
 $('#question-progress').style.width=`${(planStep+1)/planQuestions.length*100}%`;
 $('#question-title').textContent=q.title;$('#question-hint').textContent=q.hint;$('#answer-label').textContent=q.title;
 for(const attr of ['min','max','step','maxlength','placeholder'])input.removeAttribute(attr);
 input.type=q.type;input.required=q.type!=='text';input.value=planDraft[q.key]??'';input.setAttribute('aria-invalid','false');
 if(q.min!==undefined)input.min=q.min;if(q.max!==undefined)input.max=q.max;if(q.step!==undefined)input.step=q.step;if(q.maxLength)input.maxLength=q.maxLength;if(q.placeholder)input.placeholder=q.placeholder;
 if(q.type==='date')input.max=dateKey();
 $('#question-error').textContent='';$('#question-back').hidden=planStep===0;$('#question-next').textContent=planStep===planQuestions.length-1?'Start tracking →':'Next →';$('#plan-cancel').hidden=false;
 input.focus();
}
function openPlan(){planStep=0;planDraft={...state};if(!state.planComplete){planDraft.name='';planDraft.brand='';planDraft.baseline='';planDraft.target='';planDraft.cost='';planDraft.start=dateKey()}if(!$('#plan-dialog').open)$('#plan-dialog').showModal();showQuestion()}
function validateAnswer(q,value){
 if(q.type==='number'){const n=Number(value);if(value.trim()===''||!Number.isFinite(n)||n<q.min||n>q.max||(q.step===1&&!Number.isInteger(n))||(q.key==='cost'&&Math.abs(n*100-Math.round(n*100))>.000001))return `Please enter ${q.step===1?'a whole number':'an amount'} between ${q.min} and ${q.max}.`}
 if(q.type==='date'){if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(parseDate(value).getTime())||value>dateKey())return 'Choose today or an earlier date.';const first=Object.keys(state.days).sort()[0];if(first&&value>first)return 'Choose a date on or before your first recorded check-in.'}
 return '';
}
$('#question-form').onsubmit=e=>{e.preventDefault();const q=planQuestions[planStep],input=$('#plan-answer'),value=input.value.trim(),error=validateAnswer(q,value);if(error){$('#question-error').textContent=error;input.setAttribute('aria-invalid','true');input.focus();return}planDraft[q.key]=q.type==='number'?Number(value):value;if(planStep<planQuestions.length-1){planStep++;showQuestion();return}for(const q of planQuestions)state[q.key]=planDraft[q.key];state.planComplete=true;persist();$('#plan-dialog').close();render();toast('Your plan is ready. Start with an honest check-in.');navigate('overview')};
$('#question-back').onclick=()=>{planDraft[planQuestions[planStep].key]=$('#plan-answer').value;if(planStep>0){planStep--;showQuestion()}};
$('#edit-plan').onclick=openPlan;$('#resume-plan').onclick=openPlan;$('#plan-cancel').onclick=()=>$('#plan-dialog').close();

let statsRange=30;
function relativeTime(time){const minutes=Math.max(0,Math.floor((Date.now()-time)/60000));return minutes===0?'Just now':minutes<60?`${minutes}m ago`:`${Math.floor(minutes/60)}h ${minutes%60}m ago`}
function renderReferenceUI(){
 document.documentElement.dataset.theme=state.theme==='dark'?'dark':'light';
 $('#theme-toggle').textContent=state.theme==='dark'?'Dark mode':'Light mode';$('#theme-toggle').setAttribute('aria-pressed',String(state.theme==='dark'));
 const today=dateKey(),entries=state.days[today]||[],n=entries.length,over=n>state.target;
 $('#counter-limit').textContent=state.planComplete?`/ ${state.target}`:'/ —';
 $('#ring-value').style.strokeDasharray='653.45';$('#ring-value').style.strokeDashoffset=String(653.45*(1-(state.target?Math.min(1,n/state.target):n?1:0)));$('#ring-value').classList.toggle('over',over);
 $('#smoke-free').hidden=!state.planComplete||n>0;$('#smoke-free').textContent=state.days[today]?.length===0?'Today is smoke-free ✓':'Mark today smoke-free';$('#smoke-free').disabled=state.days[today]?.length===0;
 let best=0;for(let i=1;i<entries.length;i++)best=Math.max(best,entries[i].time-entries[i-1].time);$('#best-gap').textContent=entries.length>1?`${Math.floor(best/3600000)}h ${Math.floor(best%3600000/60000)}m`:'—';
 $('#day-strip').replaceChildren();for(let i=-6;i<=0;i++){const key=dayOffset(i),logged=state.days[key],within=logged&&logged.length<=state.target;const day=document.createElement('button');day.className='day-check'+(i===0?' today':'')+(within?' done':'')+(logged&&!within?' over':'');day.setAttribute('aria-label',`${parseDate(key).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'})}: ${logged?logged.length+' logged':'not tracked'}`);day.innerHTML='<span></span><b></b>';day.querySelector('span').textContent=parseDate(key).toLocaleDateString('en-IN',{weekday:'short'}).slice(0,1);day.querySelector('b').textContent=within?'✓':parseDate(key).getDate();day.onclick=()=>navigate('history');$('#day-strip').append(day)}
 const next=Math.max(0,state.target-1);$('#home-current').textContent=state.planComplete?state.target:'—';$('#home-next').textContent=state.planComplete?next:'—';$('.next-step-card').hidden=!state.planComplete||state.target===0;
 $("#stats-days").replaceChildren();for(const button of $("#day-strip").children){const copy=button.cloneNode(true);copy.onclick=()=>$(".history-details").open=true;$("#stats-days").append(copy)}
 renderStats();renderRoadmap();
}
function renderStats(){
 const today=dateKey(),tracked=Object.entries(state.days).filter(([k])=>k>=state.start&&k<=today);let held=0,offset=state.days[today]?0:-1;for(let i=offset;i>-36500;i--){const key=dayOffset(i),logs=state.days[key];if(key<state.start||!logs||logs.length>state.target)break;held++}$('#held-days').textContent=held;
 const reduction=state.planComplete?Math.max(0,Math.min(100,(state.baseline-state.target)/state.baseline*100)):0;
 $('#reduction-progress').style.width=`${reduction}%`;$('#reduction-caption').textContent=state.planComplete?`${Math.round(reduction)}% lower daily limit than your starting count`:'Set your plan to see progress';
 $('#total-saved').textContent=state.planComplete?money(tracked.reduce((s,[,logs])=>s+Math.max(0,state.baseline*state.cost-logs.reduce((v,e)=>v+e.cost,0)),0)):'—';$('#total-avoided').textContent=state.planComplete?tracked.reduce((s,[,logs])=>s+Math.max(0,state.baseline-logs.length),0):'—';
 const records=Array.from({length:statsRange},(_,i)=>{const key=dayOffset(i-statsRange+1);return {key,logs:state.days[key]}}),sample=records.filter(r=>r.logs),average=sample.length?sample.reduce((s,r)=>s+r.logs.length,0)/sample.length:null;
 $('#stats-average').textContent=average===null?'No check-ins yet':`Avg: ${average.toFixed(1)} a day`;$('#stats-under').textContent=sample.length?`${sample.filter(r=>r.logs.length<=state.target).length} of ${sample.length} within limit`:'';
 const peak=Math.max(1,...records.map(r=>r.logs?.length||0));$('#trend-chart').replaceChildren();$('#trend-chart').setAttribute('aria-label',`${statsRange}-day cigarette chart. ${sample.length} days tracked${average===null?'':`, average ${average.toFixed(1)} cigarettes per tracked day`}.`);
 for(const r of records){const cell=document.createElement('div');cell.className='trend-cell'+(!r.logs?' untracked':r.logs.length>state.target?' over':'');cell.innerHTML='<div><i></i></div><span></span>';const bar=cell.querySelector('i');bar.style.height=`${r.logs?Math.max(2,r.logs.length/peak*100):0}%`;cell.title=`${r.key}: ${r.logs?r.logs.length+' cigarettes':'untracked'}`;cell.setAttribute('aria-label',cell.title);cell.querySelector('span').textContent=records.indexOf(r)===0||records.indexOf(r)===records.length-1?parseDate(r.key).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'';$('#trend-chart').append(cell)}
 document.querySelectorAll('[data-range]').forEach(b=>{const selected=Number(b.dataset.range)===statsRange;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected))});
}
function renderRoadmap(){
 const box=$('#roadmap');box.replaceChildren();$('#plan-segments').replaceChildren();const next=Math.max(0,state.target-1);
 if(!state.planComplete){const p=document.createElement('p');p.className='empty-plan';p.textContent='Set your daily limit in My Space to build your plan.';box.append(p)}else{
  const saved=Array.isArray(state.planSteps)?state.planSteps.filter(s=>s&&Number.isInteger(s.target)&&s.target>=0&&s.target<=200&&/^\d{4}-\d{2}-\d{2}$/.test(s.date)).slice(-3):[];
  const steps=[...saved.map(s=>({value:s.target,kind:'past',label:parseDate(s.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})})),{value:state.target,kind:'current',label:'Your current limit'}];
  for(let value=state.target-1;value>=Math.max(0,state.target-5);value--)steps.push({value,kind:'future',label:'When you’re ready'});
  if(state.target>5)steps.push({value:0,kind:'future',label:'Your smoke-free goal'});
  steps.forEach((s,i)=>{const row=document.createElement('div');row.className=`roadmap-step ${s.kind} ${i%2?'right':'left'}`;const dot=document.createElement('span');dot.className='roadmap-dot';dot.textContent=s.kind==='past'?'✓':'';const info=document.createElement('div'),value=document.createElement('b'),caption=document.createElement('small');value.textContent=s.value===0?'Smoke-free':`${s.value} a day`;caption.textContent=s.label;info.append(value,caption);row.append(dot,info);box.append(row);const segment=document.createElement('i');segment.className=s.kind;$('#plan-segments').append(segment)});
 }
 $('#next-step-title').textContent=state.target===0&&state.planComplete?'Your smoke-free goal':`Next: ${next} a day`;
 $('#next-step-description').textContent=state.target===0?'Track each day at your own pace.':`Your current limit is ${state.target}. Lower it by one when you feel ready.`;
 $('#next-step-note').textContent='Optional';$('#reduce-target').textContent=`Use ${next} a day`;$('#reduce-target').hidden=!state.planComplete||state.target===0;
}
$('#smoke-free').onclick=()=>{if(!state.planComplete){openPlan();return}if((state.days[dateKey()]||[]).length)return;state.days[dateKey()]=[];persist();render();toast('Today checked in smoke-free.')};
$('#theme-toggle').onclick=()=>{state.theme=state.theme==='dark'?'light':'dark';persist();render()};
document.querySelectorAll('[data-range]').forEach(b=>b.onclick=()=>{statsRange=Number(b.dataset.range);renderStats()});
$('#reduce-target').onclick=()=>{if(!state.planComplete||state.target<=0)return;$('#reduce-title').textContent=`From ${state.target} to ${state.target-1} a day?`;$('#reduce-description').textContent='This updates your daily limit now. Your recorded cigarettes stay unchanged.';$('#reduce-dialog').showModal()};
$('#confirm-reduction').onclick=()=>{if(state.target>0){if(!Array.isArray(state.planSteps))state.planSteps=[];state.planSteps.push({target:state.target,date:dateKey()});state.target--;persist();render();toast('Daily limit updated.')}$('#reduce-dialog').close()};

render();if(!state.planComplete)openPlan();setInterval(render,30000);if(!storageOK)toast('Saved data could not be read. Export new entries to keep a backup.');
