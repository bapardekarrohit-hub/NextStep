/* ===== guide pages: all content comes from the API ===== */
var GLS="ns.guide.v1",G={},serverSynced=false,pushT=0;
try{var gr=localStorage.getItem(GLS);if(gr){var go_=JSON.parse(gr);if(go_&&typeof go_==="object")G=go_}}catch(e){}
var CID="";try{CID=localStorage.getItem("ns.cid")||""}catch(e){}
if(!/^[A-Za-z0-9-]{16,64}$/.test(CID)){CID=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+"-"+Math.random().toString(36).slice(2,12)+"abcd";try{localStorage.setItem("ns.cid",CID)}catch(e){}}
function gget(id){if(!G[id]||typeof G[id]!=="object")G[id]={c:{},best:0,mins:0};if(!G[id].c)G[id].c={};return G[id]}
function gsave(){try{localStorage.setItem(GLS,JSON.stringify(G))}catch(e){}clearTimeout(pushT);var id=curG;if(!id)return;
  pushT=setTimeout(function(){var g=gget(id);api("/progress/"+CID+"/"+id,{method:"PUT",body:{checked:g.c,best:g.best||0,mins:g.mins||0}}).catch(function(){})},700)}
function mergeServer(){
  if(serverSynced)return Promise.resolve();
  return api("/progress/"+CID).then(function(r){serverSynced=true;var p=r.progress||{};Object.keys(p).forEach(function(id){var g=gget(id),s=p[id];Object.keys(s.checked||{}).forEach(function(k){g.c[k]=1});g.best=Math.max(g.best||0,s.best||0);g.mins=Math.max(g.mins||0,s.mins||0)});
    try{localStorage.setItem(GLS,JSON.stringify(G))}catch(e){}}).catch(function(){})}
var homeEl=document.getElementById("home"),guideEl=document.getElementById("guide"),lastY=0,curG="",gToken=0;
function fieldOf(id){return F.filter(function(f){return f.id===id})[0]}
function gcount(d){var g=d.guide;return g.days.length+g.stages.reduce(function(n,s){return n+s.items.length},0)+g.projects.length}
function gdone(id){var c=gget(id).c,n=0;for(var k in c){if(c[k])n++}return n}
var JOBS=[["Internshala","https://internshala.com/","Internships and fresher jobs in India"],["Naukri","https://www.naukri.com/","Large Indian job site"],["LinkedIn Jobs","https://www.linkedin.com/jobs/","Jobs plus a place to network"],["Indeed India","https://in.indeed.com/","Search jobs from many websites"],["Wellfound","https://wellfound.com/jobs","Startup jobs"],["Apna","https://apna.co/","Jobs and interview practice in India"]];
function ckHtml(id,key,text,pre){return '<label class="ck"><input type="checkbox" data-k="'+key+'"'+(gget(id).c[key]?" checked":"")+'><span>'+(pre?"<em>"+esc(pre)+"</em>":"")+esc(text)+"</span></label>"}
function skelGuide(){guideEl.innerHTML='<div class="gtop"><button type="button" class="back" data-back="1">Back to results</button></div><div class="skel big"></div><div class="skel"></div><div class="skel"></div>'}
function renderGuide(d){
  var id=d.id,g=d.guide,i=0;curG=id;
  var h='<div class="gtop"><button type="button" class="back" data-back="1"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>Back to results</button><span class="label">'+esc(indName(d.industry))+' guide</span></div>'+
  '<div class="ghero view-in"><span class="label">Your guide to becoming a</span><h1>'+esc(d.name)+'</h1><p>'+esc(d.what)+'</p><div class="meta"><span>Time: '+esc(g.time)+'</span><span>Level: '+esc(g.level)+'</span></div><div class="meta">'+g.jobs.map(function(j){return "<span>"+esc(j)+"</span>"}).join("")+'</div>'+
  '<div class="gprog"><b id="gp-t"></b><div class="bar"><i id="gp-b"></i></div></div></div>'+
  '<nav class="gnav" aria-label="Guide sections">'+[["s-fast","Learn fast"],["s-start","Start today"],["s-road","Roadmap"],["s-learn","Where to learn"],["s-proj","Projects"],["s-quiz","Quiz"],["s-job","Find work"]].map(function(x){return '<a href="#guide-'+id+'" data-sec="'+x[0]+'">'+x[1]+"</a>"}).join("")+"</nav>";
  h+='<section class="gsec" id="s-fast" style="--i:'+(i++)+'"><h2>Learn faster</h2><p class="sub">Small tools to help you study with focus.</p><div class="fast"><div class="fcard" id="nx"></div><div class="fcard" id="tmr"></div></div><div class="fcard" id="fc"></div></section>';
  h+='<section class="gsec" id="s-start" style="--i:'+(i++)+'"><h2>Start today: your first 7 days</h2><p class="sub">One small step a day. Tick each one when you finish it.</p><div class="checks">'+g.days.map(function(t,n){return ckHtml(id,"d"+n,t,"Day "+(n+1))}).join("")+"</div></section>";
  h+='<section class="gsec" id="s-road" style="--i:'+(i++)+'"><h2>The full roadmap</h2><p class="sub">Stages in order. Times are a rough guide for someone studying a few hours a day.</p>'+
   g.stages.map(function(s,si){return '<div class="stage"><header><h3>Stage '+(si+1)+": "+esc(s.title)+'</h3><span class="wk">'+esc(s.weeks)+'</span></header><div class="checks">'+s.items.map(function(t,ti){return ckHtml(id,"s"+si+"_"+ti,t)}).join("")+"</div></div>"}).join("")+
   '<p class="disc">Tools to use: '+g.tools.map(esc).join(", ")+".</p></section>";
  h+='<section class="gsec" id="s-learn" style="--i:'+(i++)+'"><h2>Where to learn</h2><p class="sub">Start with the free ones. Links open in a new tab.</p><div class="srcs">'+
   g.sources.map(function(s){return '<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer"><span class="free">'+esc(s.price)+"</span><strong>"+esc(s.name)+"</strong><span>"+esc(s.desc)+"</span></a>"}).join("")+
   '</div><p class="disc">Websites change their pages and prices over time. If a link does not open, search for the name.</p></section>';
  h+='<section class="gsec" id="s-proj" style="--i:'+(i++)+'"><h2>Projects to build</h2><p class="sub">Three projects, from easy to portfolio ready. Put them on your resume.</p><div class="pj">'+
   g.projects.map(function(p,n){return '<div class="pcard"><span class="lv">'+esc(p.level)+"</span><h3>"+esc(p.title)+"</h3><p>"+esc(p.desc)+'</p><p class="pub">Publish on: '+esc(p.publish)+'</p><label><input type="checkbox" data-k="p'+n+'"'+(gget(id).c["p"+n]?" checked":"")+"> I finished this</label></div>"}).join("")+"</div></section>";
  h+='<section class="gsec" id="s-quiz" style="--i:'+(i++)+'"><h2>Test yourself: '+esc(d.name)+' quiz</h2><div class="qbox" id="gq" aria-live="polite"></div></section>';
  h+='<section class="gsec" id="s-job" style="--i:'+(i++)+'"><h2>Where to find work</h2><p class="sub">Common job titles to search: '+g.jobs.map(esc).join(", ")+'.</p><div class="srcs">'+
   JOBS.map(function(s){return '<a href="'+s[1]+'" target="_blank" rel="noopener noreferrer"><strong>'+s[0]+"</strong><span>"+s[2]+"</span></a>"}).join("")+"</div>"+
   '<h3 style="margin-top:8px">Interview topics to practise</h3><ul class="note" style="margin:0;padding-left:20px;display:grid;gap:4px">'+g.interview.map(function(t){return "<li>"+esc(t)+"</li>"}).join("")+"</ul>"+
   '<h3 style="margin-top:8px">Related guides</h3><div class="chips2">'+d.related.map(function(x){return '<a href="#guide-'+x.id+'">'+esc(x.name)+"</a>"}).join("")+'<button type="button" data-back="1">Pick another field</button></div></section>';
  guideEl.innerHTML=h;paintProg();quizStart(id);tmrStop();T.mode="focus";T.left=1500;tmrDraw();nxDraw();FC={i:0,flip:false,order:shuffle(d.flashcards.map(function(_,n){return n}))};fcDraw();
}
function paintProg(){nxDraw();var id=curG,d=DET[id];if(!d)return 0;var n=gdone(id),t=gcount(d),p=Math.min(100,Math.round(n/t*100));
  var a=document.getElementById("gp-t"),b=document.getElementById("gp-b");if(a){a.textContent=p+"% of this guide done ("+n+" of "+t+" steps)"}if(b){b.style.width=p+"%"}return p}
function stepList(d){var g=d.guide,a=[];g.days.forEach(function(t,n){a.push(["d"+n,"Day "+(n+1)+": "+t])});g.stages.forEach(function(s,si){s.items.forEach(function(t,ti){a.push(["s"+si+"_"+ti,t])})});g.projects.forEach(function(p,n){a.push(["p"+n,"Build: "+p.title])});return a}
function nxDraw(){var el=document.getElementById("nx");if(!el||!curG||!DET[curG])return;var c=gget(curG).c,nx=stepList(DET[curG]).filter(function(s){return !c[s[0]]})[0];
  el.innerHTML=nx?'<span class="label">Your next step</span><p><b>'+esc(nx[1])+'</b></p><div><button class="go" type="button" data-nx="'+nx[0]+'">Mark as done</button></div>':'<span class="label">Your next step</span><p><b>You finished every step. Update your resume and start applying.</b></p>'}
var T={mode:"focus",left:1500,end:0,iv:0};
function tmrStop(){if(T.iv){clearInterval(T.iv);T.iv=0}}
function fmt(s){return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")}
function tmrDraw(){var el=document.getElementById("tmr");if(!el)return;var mins=gget(curG).mins||0;
  el.innerHTML='<span class="label">Focus timer</span><div class="tnum" id="tnum">'+fmt(T.left)+'</div><p class="note">'+(T.mode==="focus"?"25 minutes of study, no phone.":"5 minute break. Stretch and drink water.")+' Total focus: '+mins+' min</p><div class="row"><button class="go" type="button" data-t="toggle">'+(T.iv?"Pause":"Start")+'</button><button class="ghost" type="button" data-t="reset">Reset</button></div>'}
function tmrTick(){T.left=Math.max(0,Math.round((T.end-Date.now())/1000));var n=document.getElementById("tnum");if(n)n.textContent=fmt(T.left);
  if(T.left<=0){tmrStop();var g=gget(curG);if(T.mode==="focus"){g.mins=(g.mins||0)+25;gsave();toast("Focus session done. Take a 5 minute break.");burst(window.innerWidth/2,window.innerHeight/3);T.mode="break";T.left=300}else{toast("Break over. Ready for the next session?");T.mode="focus";T.left=1500}
    try{if(navigator.vibrate)navigator.vibrate([200,100,200])}catch(e){}tmrDraw()}}
var FC={i:0,flip:false,order:[]};
function fcDraw(){var el=document.getElementById("fc");if(!el||!curG||!DET[curG])return;var qs=DET[curG].flashcards;if(!qs.length){el.innerHTML="";return}var q=qs[FC.order[FC.i%qs.length]];
  el.innerHTML='<span class="label">Flashcards ('+(FC.i%qs.length+1)+' of '+qs.length+'). Tap the card to flip.</span><button type="button" class="flip'+(FC.flip?" on":"")+'" data-fc="flip" aria-label="Flip card"><span>'+(FC.flip?'<b>'+esc(q.a)+'</b><small>'+esc(q.note)+'</small>':esc(q.q))+'</span></button><div class="row"><button class="ghost" type="button" data-fc="next">Next card</button><button class="ghost" type="button" data-fc="shuf">Shuffle</button></div>'}
/* quiz: questions and answers are checked by the server */
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
var Q={id:"",qs:[],i:0,score:0,done:false,intro:true,busy:false};
function quizStart(id){Q={id:id,qs:[],i:0,score:0,done:false,intro:true,busy:false};quizDraw()}
function quizDraw(){
  var box=document.getElementById("gq");if(!box)return;var best=gget(Q.id).best;
  if(Q.intro){box.innerHTML='<p>5 questions. Pick the best answer. You will see why after each one.</p><p class="note">'+(best?"Your best score: "+best+" out of 5":"You have not tried this quiz yet.")+'</p><div><button class="go" type="button" data-q="start">Start quiz</button></div>';return}
  if(Q.loading){box.innerHTML='<div class="skel"></div>';return}
  if(Q.err){box.innerHTML='<p>We could not load the quiz. Please check your connection.</p><div><button class="go" type="button" data-q="start">Try again</button></div>';return}
  if(Q.done){var n=Q.qs.length,msg=Q.score===n?"Perfect. You know this field well.":Q.score>=Math.ceil(n*.6)?"Good work. Go back to the roadmap for the topics you missed.":"A good start. Follow the roadmap, then try again.";
    box.innerHTML='<div class="qscore">'+Q.score+" / "+n+'</div><p>'+msg+'</p><p class="note">Best score: '+gget(Q.id).best+' out of 5</p><div class="row"><button class="go" type="button" data-q="start">Try again</button></div>';return}
  var q=Q.qs[Q.i],n=Q.qs.length;
  box.innerHTML='<div class="qbar"><i style="width:'+(Q.i/n*100)+'%"></i></div><span class="label">Question '+(Q.i+1)+" of "+n+'</span><h3 style="font-size:19px">'+esc(q.q)+'</h3><div class="qopts">'+q.options.map(function(o,k){return '<button type="button" class="qopt" data-o="'+k+'">'+esc(o)+"</button>"}).join("")+'</div><div id="qfb"></div>';
}
function quizLoad(){Q.intro=false;Q.loading=true;Q.err=false;Q.i=0;Q.score=0;Q.done=false;quizDraw();
  api("/careers/"+Q.id+"/quiz").then(function(r){Q.qs=r.questions;Q.loading=false;if(!Q.qs.length)Q.err=true;quizDraw()}).catch(function(){Q.loading=false;Q.err=true;quizDraw()})}
function quizPick(btn){
  if(Q.busy)return;Q.busy=true;var q=Q.qs[Q.i],box=document.getElementById("gq"),ans=q.options[+btn.dataset.o];
  Array.prototype.forEach.call(box.querySelectorAll(".qopt"),function(b){b.disabled=true});
  api("/quiz/check",{method:"POST",body:{question_id:q.id,answer:ans}}).then(function(r){
    Array.prototype.forEach.call(box.querySelectorAll(".qopt"),function(b){if(q.options[+b.dataset.o]===r.answer)b.classList.add("ok")});
    if(!r.correct)btn.classList.add("no");else{Q.score++;var rc=btn.getBoundingClientRect();burst(rc.left+rc.width/2,rc.top+rc.height/2)}
    var last=Q.i===Q.qs.length-1;
    document.getElementById("qfb").innerHTML='<div class="qexp"><b>'+(r.correct?"Correct. ":"Not quite. ")+"</b>"+esc(r.explanation||"")+'</div><div style="margin-top:12px"><button class="go" type="button" data-q="next">'+(last?"See my score":"Next question")+"</button></div>";
    box.querySelector(".qbar i").style.width=((Q.i+1)/Q.qs.length*100)+"%";Q.busy=false;
  }).catch(function(){Q.busy=false;Array.prototype.forEach.call(box.querySelectorAll(".qopt"),function(b){b.disabled=false});toast("Could not check that answer. Try again.")})
}
function quizNext(){
  if(Q.i===Q.qs.length-1){Q.done=true;var g=gget(Q.id);if(Q.score>g.best){g.best=Q.score;gsave()}if(Q.score===Q.qs.length)toast("Perfect score on the "+(fieldOf(Q.id)||{name:""}).name+" quiz");quizDraw()}else{Q.i++;quizDraw()}
}
guideEl.addEventListener("click",function(e){
  var b=e.target.closest("button,a");if(!b)return;
  if(b.dataset.back){leaveGuide();return}
  if(b.dataset.nx){var cb=guideEl.querySelector('[data-k="'+b.dataset.nx+'"]');gget(curG).c[b.dataset.nx]=1;gsave();if(cb)cb.checked=true;var r0=b.getBoundingClientRect();burst(r0.left+r0.width/2,r0.top);paintProg();return}
  if(b.dataset.t==="toggle"){if(T.iv){tmrStop();T.left=Math.max(0,Math.round((T.end-Date.now())/1000))}else{T.end=Date.now()+T.left*1000;T.iv=setInterval(tmrTick,500)}tmrDraw();return}
  if(b.dataset.t==="reset"){tmrStop();T.left=T.mode==="focus"?1500:300;tmrDraw();return}
  if(b.dataset.fc==="flip"){FC.flip=!FC.flip;fcDraw();return}
  if(b.dataset.fc==="next"){FC.i++;FC.flip=false;fcDraw();return}
  if(b.dataset.fc==="shuf"){FC.order=shuffle(FC.order);FC.i=0;FC.flip=false;fcDraw();return}
  if(b.dataset.sec){e.preventDefault();var t=document.getElementById(b.dataset.sec);if(t)t.scrollIntoView({behavior:REDUCE?"auto":"smooth",block:"start"});return}
  if(b.dataset.q==="start"){quizLoad();return}
  if(b.dataset.q==="next"){quizNext();return}
  if(b.classList.contains("qopt")&&!b.disabled){quizPick(b)}
});
guideEl.addEventListener("change",function(e){
  var c=e.target;if(!c.dataset||!c.dataset.k)return;var g=gget(curG),was=paintProg();
  g.c[c.dataset.k]=c.checked?1:0;gsave();var now=paintProg();
  if(c.checked){var r=c.getBoundingClientRect();burst(r.left+12,r.top+12);try{if(navigator.vibrate)navigator.vibrate(12)}catch(x){}}
  [100,75,50,25].some(function(th){if(was<th&&now>=th){toast(th===100?"Guide complete! You did everything here.":th+"% of the "+(fieldOf(curG)||{name:""}).name+" guide done");return true}return false});
});
/* routing */
function showHome(){tmrStop();gToken++;
  if(!guideEl.hidden){guideEl.hidden=true;homeEl.hidden=false;window.scrollTo(0,lastY)}
  document.title="NextStep";
}
function showGuide(id){
  if(guideEl.hidden){lastY=window.scrollY}
  var tk=++gToken;homeEl.hidden=true;guideEl.hidden=false;curG=id;skelGuide();window.scrollTo(0,0);
  document.title=(fieldOf(id)||{name:"Guide"}).name+" guide | NextStep";
  Promise.all([getDetail(id),mergeServer()]).then(function(r){if(tk!==gToken)return;renderGuide(r[0])}).catch(function(){if(tk!==gToken)return;
    guideEl.innerHTML='<div class="gtop"><button type="button" class="back" data-back="1">Back to results</button></div><div class="errbox"><p>We could not load this guide. Please check your connection and try again.</p><button class="go" type="button" id="retry-g">Try again</button></div>';
    var rb=document.getElementById("retry-g");if(rb)rb.onclick=function(){showGuide(id)}})
}
function leaveGuide(){location.hash="home"}
function route(){
  var h=(location.hash||"").slice(1),m=/^guide-([a-z0-9-]+)$/.exec(h);
  if(m&&fieldOf(m[1])){showGuide(m[1])}else{showHome()}
}
window.addEventListener("hashchange",route);
document.addEventListener("click",function(e){var b=e.target.closest("[data-guide]");if(b){e.preventDefault();location.hash="guide-"+b.dataset.guide}});
try{if(/^#guide-/.test(H0))history.replaceState(null,"",H0)}catch(e){}
route();
