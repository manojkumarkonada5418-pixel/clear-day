'use strict';
const $=s=>document.querySelector(s), STORAGE='clear-day-v1';
const dateKey=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const dayOffset=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return dateKey(d)};
const parseDate=k=>new Date(k+'T12:00:00');
const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(n);
let state={name:'',brand:'',baseline:10,target:5,cost:15,start:dateKey(),days:{},sound:true,planComplete:false};
let storageOK=true;
try{const raw=localStorage.getItem(STORAGE);if(raw){const s=JSON.parse(raw);if(s&&typeof s==='object'&&s.days&&typeof s.days==='object'){state={...state,...s};state.planComplete=s.planComplete===true||s.planComplete===undefined;state.days=Object.fromEntries(Object.entries(s.days).filter(([k,v])=>/^\d{4}-\d{2}-\d{2}$/.test(k)&&Array.isArray(v)&&v.every(e=>e&&Number.isFinite(e.time)&&Number.isFinite(e.cost)&&e.cost>=0)));for(const k of ['baseline','target','cost'])if(!Number.isFinite(state[k])||state[k]<0)state[k]=k==='cost'?15:k==='baseline'?10:5;if(typeof state.name!=='string')state.name='';if(typeof state.brand!=='string')state.brand='';if(!/^\d{4}-\d{2}-\d{2}$/.test(state.start)||!Number.isFinite(parseDate(state.start).getTime())||state.start>dateKey())state.start=dateKey()}}}catch{storageOK=false}
function toast(msg,error=false){$('#toast').textContent=msg;$('#toast').classList.toggle('error',error);$('#toast').classList.add('visible');clearTimeout(toast.timeout);toast.timeout=setTimeout(()=>$('#toast').classList.remove('visible'),3500)}
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
 const over=count>state.target,at=count===state.target;
 $('#goal-progress').style.background=over?'#d33838':at?'#c28b28':'#9bad7f';
 $('.daily-goal').classList.toggle('over-limit',over);$('.daily-goal').classList.toggle('at-limit',at&&!over);
 $('#limit-error').hidden=!over;$('#limit-error').textContent=over?`Daily limit exceeded: ${count} logged, ${count-state.target} over your ${state.target}-cigarette limit.`:'';
 $('#log').disabled=!state.planComplete;
 renderPlanSummary();
 $('#last-log').textContent=logs.length?`Last logged at ${new Date(logs.at(-1).time).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}`:'Every check-in is a step forward.';$('#undo').disabled=!logs.length;
 $('#spent').textContent=money(logs.reduce((sum,e)=>sum+e.cost,0));$('#avoided').replaceChildren(document.createTextNode(Math.max(0,state.baseline-count)+' '));const em=document.createElement('em');em.textContent='cigarettes';$('#avoided').append(em);
 $('#saved').textContent=money(Math.max(0,state.baseline*state.cost-logs.reduce((sum,e)=>sum+e.cost,0)));$('#baseline-caption').textContent=`Compared with your usual ${state.baseline} per day`;
 $('#journey-days').textContent=Math.max(1,daysBetween(today,state.start)+1);$('#started').textContent=parseDate(state.start).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
 let streak=0,offset=state.days[today]?.length===0?0:-1;while(!count&&streak<36500){const key=dayOffset(offset);if(key<state.start||!state.days[key]||state.days[key].length)break;streak++;offset--}$('#streak').textContent=`${streak} ${streak===1?'day':'days'}`;
 const max=Math.max(state.baseline,1,...Array.from({length:7},(_,i)=>(state.days[dayOffset(i-6)]||[]).length));let total=0;$('#week-bars').replaceChildren();
 for(let i=-6;i<=0;i++){const key=dayOffset(i),tracked=state.days[key],n=tracked?.length||0;total+=n;const cell=document.createElement('div');cell.className='bar-cell'+(i===0?' today':'');cell.innerHTML='<div class="bar-track"><div class="bar-fill"><b></b></div></div><span></span>';cell.querySelector('.bar-fill').style.height=`${n/max*85}%`;cell.querySelector('b').textContent=tracked?n:'—';cell.querySelector('span').textContent=i===0?'Today':parseDate(key).toLocaleDateString('en-IN',{weekday:'short'});cell.setAttribute('aria-label',`${key}: ${tracked?n+' cigarettes':'not tracked'}`);$('#week-bars').append(cell)}$('#week-total').textContent=`${total} logged this week`;
 $('#history-table').replaceChildren();for(let i=0;i>-30;i--){const k=dayOffset(i);if(k<state.start)break;const entries=state.days[k];const row=document.createElement('tr');for(const text of [parseDate(k).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),entries?entries.length:'—',entries?money(entries.reduce((s,e)=>s+e.cost,0)):'—',entries?(entries.length?'Logged':'Smoke-free check-in'):'Not tracked']){const cell=document.createElement('td');cell.textContent=text;row.append(cell)}if(i===0&&!entries){const btn=document.createElement('button');btn.className='text-button';btn.textContent='Check in smoke-free';btn.onclick=()=>{if(!state.planComplete){openPlan();return}state.days[dateKey()]=[];persist();render();toast('Today checked in smoke-free. You can still log later.')};row.lastChild.append(document.createElement('br'),btn)}$('#history-table').append(row)}
 $('.sidebar-bottom').lastChild.textContent=storageOK?' Saved on this device':' Storage unavailable — export a backup';
}
function navigate(view){for(const v of ['overview','history','plan'])$(`#${v}-view`).hidden=v!==view;document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.view===view));$('#view-label').textContent={overview:'Overview',history:'My history',plan:'My Space'}[view];if(view==='plan')renderPlanSummary();window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>navigate(b.dataset.view));$('#settings').onclick=()=>navigate('plan');
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
$('#log').onclick=()=>{if(!state.planComplete){openPlan();return}playTap();const key=dateKey();if(!state.days[key])state.days[key]=[];state.days[key].push({time:Date.now(),cost:state.cost});persist();render();toast(state.days[key].length>state.target?'Daily limit exceeded. Your cigarette has been recorded.':'Cigarette logged. Keep showing up.',state.days[key].length>state.target)};
$('#undo').onclick=()=>{const entries=state.days[dateKey()];if(entries?.length){entries.pop();if(!entries.length)delete state.days[dateKey()];persist();render();toast('Last cigarette removed.')}};
$('#export').onclick=()=>{const blob=new Blob([JSON.stringify({app:'Clear Day',exportedAt:new Date().toISOString(),...state},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`clear-day-${dateKey()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Your data export is ready.')};
let interval=null,remaining=60;
function stopBreathing(){clearInterval(interval);interval=null;$('#breath-start').disabled=false;$('#breath-orb').classList.remove('expanded')}
$('#craving-open').onclick=()=>{stopBreathing();remaining=60;$('#timer').textContent='60';$('#breath-instruction').textContent='Ready?';$('#breath-start').textContent='Start a 60-second pause';$('#breathing').showModal()};
$('#breath-start').onclick=()=>{if(interval)return;remaining=60;const deadline=Date.now()+60000;$('#breath-start').disabled=true;function tick(){remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));$('#timer').textContent=remaining;const inhale=(60-remaining)%8<4;$('#breath-instruction').textContent=inhale?'Breathe in':'Breathe out';$('#breath-orb').classList.toggle('expanded',inhale);if(!remaining){stopBreathing();$('#breath-instruction').textContent='A moment for you.';$('#breath-start').textContent='Take another pause';toast('One calm minute. One small step.')}}tick();interval=setInterval(tick,250)};
$('#breathing').addEventListener('close',stopBreathing);$('#privacy').onclick=()=>$('#about').showModal();document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(`#${b.dataset.close}`).close());
const planQuestions=[
 {key:'name',title:'First, what should we call you?',hint:'A name or nickname makes this space yours. You can leave it blank.',type:'text',placeholder:'Your name',maxLength:40},
 {key:'baseline',title:'How many cigarettes do you usually smoke a day?',hint:'An honest starting point helps us understand your progress.',type:'number',min:1,max:200,step:1,placeholder:'For example, 10'},
 {key:'target',title:'What daily limit feels right for you?',hint:'Choose your own pace. Set 0 if your goal is a smoke-free day.',type:'number',min:0,max:200,step:1,placeholder:'For example, 5'},
 {key:'cost',title:'How much does one cigarette cost you?',hint:'Tell us the price in rupees so we can estimate your spending.',type:'number',min:0,max:10000,step:.01,placeholder:'For example, 15'},
 {key:'brand',title:'Which cigarette do you usually smoke?',hint:'This is optional. Skip ahead if you would rather leave it blank.',type:'text',placeholder:'Your usual brand',maxLength:60},
 {key:'start',title:'When would you like your journey to start?',hint:'Today is a good place to begin. You can also choose an earlier date.',type:'date'}
];
let planStep=0,planDraft;
function renderPlanSummary(){
 const box=$('#plan-summary');box.replaceChildren();
 if(!state.planComplete){const note=document.createElement('p');note.textContent="Let's answer a few questions before your first check-in.";box.append(note);$('#edit-plan').textContent='Set up my plan →';return}
 $('#edit-plan').textContent="Let's update my plan →";
 for(const [label,value] of [['Your name',state.name||'Your space'],['Usual cigarettes per day',state.baseline],['Daily cigarette limit',state.target],['Cost per cigarette',money(state.cost)],['Usual brand',state.brand||'Not set'],['Journey started',parseDate(state.start).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})]]){const card=document.createElement('div');card.className='plan-detail';const caption=document.createElement('span'),answer=document.createElement('b');caption.textContent=label;answer.textContent=value;card.append(caption,answer);box.append(card)}
}
function showQuestion(){
 const q=planQuestions[planStep],input=$('#plan-answer');
 $('#question-step').textContent=`YOUR PLAN · QUESTION ${planStep+1} OF ${planQuestions.length}`;
 $('#question-progress').style.width=`${(planStep+1)/planQuestions.length*100}%`;
 $('#question-title').textContent=q.title;$('#question-hint').textContent=q.hint;$('#answer-label').textContent=q.title;
 for(const attr of ['min','max','step','maxlength','placeholder'])input.removeAttribute(attr);
 input.type=q.type;input.required=q.type!=='text';input.value=planDraft[q.key]??'';input.setAttribute('aria-invalid','false');
 if(q.min!==undefined)input.min=q.min;if(q.max!==undefined)input.max=q.max;if(q.step!==undefined)input.step=q.step;if(q.maxLength)input.maxLength=q.maxLength;if(q.placeholder)input.placeholder=q.placeholder;
 if(q.type==='date')input.max=dateKey();
 $('#question-error').textContent='';$('#question-back').hidden=planStep===0;$('#question-next').textContent=planStep===planQuestions.length-1?'Start tracking →':'Next →';$('#plan-cancel').hidden=!state.planComplete;
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
$('#edit-plan').onclick=openPlan;$('#plan-cancel').onclick=()=>$('#plan-dialog').close();$('#plan-dialog').addEventListener('cancel',e=>{if(!state.planComplete)e.preventDefault()});

render();if(!state.planComplete)openPlan();setInterval(render,30000);if(!storageOK)toast('Saved data could not be read. Export new entries to keep a backup.');
