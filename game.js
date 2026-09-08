const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const lanes=['c','v','n','m'], colors=['var(--red)','var(--blue)','var(--green)','var(--amber)'];
const audio=$('#audio'); let notes=[],running=false,paused=false,startAt=0,duration=60,score=0,combo=0,maxCombo=0,hits=0,misses=0,raf,lastTime=0,player='JOGADOR';

// Heavy Battle 1, por MintoDog — disponibilizada sob CC0.
audio.src='assets/music.mp3';

function screen(id){$$('.screen').forEach(x=>x.classList.remove('active'));$('#'+id).classList.add('active');if(id==='setup')renderHomeRanking()}
$('#startBtn').onclick=()=>{audio.onloadedmetadata=()=>begin(audio.duration);audio.load()};
$('#demoBtn').onclick=()=>begin(60,true); $('#againBtn').onclick=()=>{screen('setup');reset()};

function savedScores(){return JSON.parse(localStorage.getItem('monsterHeroScores')||'[]')}
function renderHomeRanking(){const board=savedScores().slice(0,5);$('#homeRanking').innerHTML=board.length?board.map((x,i)=>`<li><b>#${i+1}</b><span>${escapeHtml(x.name)}</span><strong>${x.score.toLocaleString('pt-BR')}</strong></li>`).join(''):'<li class="empty">AINDA NÃO HÁ PONTUAÇÕES</li>'}
renderHomeRanking();

function makeChart(seconds){
  const chart=[];let t=1.5,seed=7391;const beat=60/190;const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  while(t<seconds-.8){const intensity=t/seconds;const step=intensity>.55?beat/2:beat;t+=step; if(rnd()<.12)continue;let lane=Math.floor(rnd()*4);chart.push({time:t,lane,hit:false,missed:false,el:null});if(intensity>.35&&rnd()<.18)chart.push({time:t,lane:(lane+1+Math.floor(rnd()*3))%4,hit:false,missed:false,el:null})}
  return chart;
}
function begin(seconds,demo=false){player=$('#playerName').value.trim().toUpperCase()||'JOGADOR';duration=Math.min(seconds||60,420);reset();notes=makeChart(duration);screen('game');running=true;startAt=performance.now();if(!demo){audio.currentTime=0;audio.play()}loop()}
function reset(){running=false;cancelAnimationFrame(raf);audio.pause();score=combo=maxCombo=hits=misses=0;notes.forEach(n=>n.el?.remove());notes=[];updateHud()}
function gameTime(){return audio.src&&!audio.paused?audio.currentTime:(performance.now()-startAt)/1000}
function loop(){if(!running||paused)return;const now=gameTime();lastTime=now;$('#progressBar').style.width=Math.min(100,now/duration*100)+'%';
  notes.forEach(n=>{const delta=n.time-now;if(delta<2.3&&!n.el&&!n.missed){n.el=document.createElement('i');n.el.className='note';n.el.style.left=(12.5+n.lane*25)+'%';n.el.style.color=colors[n.lane];$('#highway').appendChild(n.el)}if(n.el&&!n.hit&&!n.missed){n.el.style.bottom=(113+delta/2.3*($('#highway').clientHeight-205))+'px';if(delta<-.18){n.missed=true;n.el.remove();combo=0;misses++;flash('ERROU','#777');updateHud()}}});
  if(now>=duration-.05){finish();return}raf=requestAnimationFrame(loop)}
function press(key){if(!running||paused)return;const lane=lanes.indexOf(key);if(lane<0)return;const pad=$(`.keys [data-key="${key}"]`);pad.classList.add('active');setTimeout(()=>pad.classList.remove('active'),90);const now=gameTime();let target=notes.filter(n=>n.lane===lane&&!n.hit&&!n.missed).sort((a,b)=>Math.abs(a.time-now)-Math.abs(b.time-now))[0];if(!target||Math.abs(target.time-now)>.18){combo=0;flash('ERROU','#777');updateHud();return}const d=Math.abs(target.time-now);target.hit=true;target.el?.remove();hits++;combo++;maxCombo=Math.max(maxCombo,combo);let value=d<.07?1000:d<.12?700:400;score+=value*(1+Math.min(3,Math.floor(combo/10))*.25);flash(d<.07?'PERFEITO':d<.12?'ÓTIMO':'BOM',colors[lane]);updateHud()}
function flash(text,color){const el=$('#feedback');el.textContent=text;el.style.color=color;el.classList.remove('show');void el.offsetWidth;el.classList.add('show')}
function updateHud(){$('#score').textContent=String(Math.floor(score)).padStart(6,'0');$('#combo').textContent=combo}
function finish(){running=false;audio.pause();const total=notes.length,acc=total?hits/total:0,grade=acc>.94?'S':acc>.86?'A':acc>.72?'B':acc>.58?'C':'D';const entry={name:player,score:Math.floor(score),accuracy:Math.round(acc*100),date:Date.now()};let board=JSON.parse(localStorage.getItem('monsterHeroScores')||'[]');board.push(entry);board.sort((a,b)=>b.score-a.score);board=board.slice(0,8);localStorage.setItem('monsterHeroScores',JSON.stringify(board));$('#finalScore').textContent=entry.score.toLocaleString('pt-BR');$('#accuracy').textContent=entry.accuracy+'%';$('#maxCombo').textContent=maxCombo+'x';$('#hits').textContent=`${hits} / ${total}`;$('#grade').textContent=grade;$('#resultTitle').textContent=grade==='S'?'VOCÊ DOMINOU!':grade<'C'?'MONSTRO ABATIDO!':'TENTE OUTRA VEZ!';$('#ranking').innerHTML=board.map((x,i)=>`<li class="${x.date===entry.date?'me':''}"><b>#${i+1}</b><span>${escapeHtml(x.name)}</span><strong>${x.score.toLocaleString('pt-BR')}</strong></li>`).join('');screen('results')}
function escapeHtml(s){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
document.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(lanes.includes(k)&&!e.repeat)press(k);if(e.key==='Escape')togglePause()});
function togglePause(){if(!running)return;paused=!paused;document.body.classList.toggle('paused',paused);if(paused)audio.pause();else{startAt=performance.now()-lastTime*1000;if(audio.src)audio.play();loop()}}
$('#pauseBtn').onclick=togglePause;
