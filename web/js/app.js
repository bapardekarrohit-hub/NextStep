/* NextStep front end. Content is loaded from the API; nothing about careers is stored in this file. */
var CATS={},F=[],ALIAS={},SAMPLE="",INDS=[],DET={};
var LIBS={pdf:"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",pdfw:"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",docx:"https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"};
var _loaded={};
function loadScript(u){if(_loaded[u])return _loaded[u];return _loaded[u]=new Promise(function(ok,no){var s=document.createElement("script");s.src=u;s.onload=ok;s.onerror=function(){delete _loaded[u];no(new Error("load"))};document.head.appendChild(s)})}
var API_CACHE={};
function api(path,opt){
  opt=opt||{};var m=opt.method||"GET",url="/api"+path;
  if(m==="GET"&&API_CACHE[url])return API_CACHE[url];
  var p=fetch(url,{method:m,headers:opt.body?{"Content-Type":"application/json"}:undefined,body:opt.body?JSON.stringify(opt.body):undefined}).then(function(r){
    if(!r.ok)throw new Error("http "+r.status);return r.json()});
  if(m==="GET"){API_CACHE[url]=p;p.catch(function(){delete API_CACHE[url]})}
  return p}
function indName(id){return CATS[id]||""}
function getDetail(id){return DET[id]?Promise.resolve(DET[id]):api("/careers/"+id).then(function(d){DET[id]=d;return d})}

function boot(){
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function rx(t){return new RegExp("(?<![a-z0-9])"+t.replace(/[.*+?^${}()|[\]\\\/]/g,"\\$&")+"(?![a-z0-9])","i")}
function has(text,skill){
  var names=[skill.toLowerCase()].concat(ALIAS[skill.toLowerCase()]||[]);
  return names.some(function(n){return rx(n).test(text)});
}
function chips(a,cls){return a.map(function(x,i){return '<span class="chip '+(cls||"")+'" style="--i:'+i+'">'+esc(x)+"</span>"}).join("")}

var resume=document.getElementById("resume"),msg=document.getElementById("msg"),statusEl=document.getElementById("status"),foundEl=document.getElementById("found"),resEl=document.getElementById("results");
resume.value=SAMPLE;

var REDUCE=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
var prevPct={};
function fromOf(s){return REDUCE?s.pct:(prevPct[s.f.id]||0)}
function ease(t){return 1-Math.pow(1-t,3)}
function animateResults(){
  var els=resEl.querySelectorAll("[data-to]");
  Array.prototype.forEach.call(els,function(el){
    var to=+el.dataset.to,from=+el.dataset.from;
    if(el.classList.contains("fill")){
      requestAnimationFrame(function(){requestAnimationFrame(function(){if(el.tagName==="circle"){el.style.strokeDashoffset=(201.06*(1-to/100)).toFixed(2)}else{el.style.width=to+"%"}})});
    }else if(!REDUCE&&from!==to){
      var t0=null;
      (function tick(t){if(t0===null)t0=t;var k=Math.min((t-t0)/1000,1);el.textContent=Math.round(from+(to-from)*ease(k))+"%";if(k<1)requestAnimationFrame(tick)})(performance.now());
    }else{el.textContent=to+"%"}
  });
}
function burst(x,y){
  if(REDUCE)return;
  var fx=document.getElementById("fx"),cs=getComputedStyle(document.documentElement);
  var cols=["--accent","--have-fg","--need-fg","--warn-fg"].map(function(v){return cs.getPropertyValue(v).trim()||"#0a6c78"});
  for(var i=0;i<22;i++){
    var d=document.createElement("i"),a=Math.random()*Math.PI*2,r=50+Math.random()*90;
    d.style.left=x+"px";d.style.top=y+"px";d.style.background=cols[i%cols.length];
    fx.appendChild(d);
    var an=d.animate([{transform:"translate(-50%,-50%) scale(1) rotate(0deg)",opacity:1},{transform:"translate("+(Math.cos(a)*r-4)+"px,"+(Math.sin(a)*r+30)+"px) scale(.4) rotate("+(Math.random()*540-270)+"deg)",opacity:0}],{duration:700+Math.random()*400,easing:"cubic-bezier(.1,.7,.3,1)"});
    an.onfinish=(function(n){return function(){n.remove()}})(d);
  }
}
var toastT;
function toast(msg){var t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove("show")},3400)}
function celebrate(th,name){
  toast(th===100?"Perfect match! You have every skill for "+name:"Milestone: "+th+"% match for "+name);
  if(REDUCE)return;
  var n=th>=75?4:2;
  for(var i=0;i<n;i++){(function(i){setTimeout(function(){burst(window.innerWidth*(.2+Math.random()*.6),window.innerHeight*(.25+Math.random()*.3))},i*230)})(i)}
  try{if(navigator.vibrate)navigator.vibrate([20,40,20])}catch(e){}
}
function after(scored,mode){
  var top0=scored[0],pv=prevPct[top0.f.id]||0;
  if(mode==="learn"&&top0.pct>pv){[100,75,50,25].some(function(th){if(pv<th&&top0.pct>=th){celebrate(th,top0.f.name);return true}return false})}
  resEl.classList.toggle("calm",mode==="learn");
  animateResults();
  scored.forEach(function(s){prevPct[s.f.id]=s.pct});
  if(mode==="learn"&&!REDUCE){var f=resEl.querySelector(".res.first");if(f){f.classList.add("pulse");setTimeout(function(){f.classList.remove("pulse")},1200)}}
}
var LS="ns.v1",state={learned:[],history:[]};
try{var raw=localStorage.getItem(LS);if(raw){var st=JSON.parse(raw);if(st&&Array.isArray(st.learned)&&Array.isArray(st.history))state=st}}catch(e){}
function save(){try{localStorage.setItem(LS,JSON.stringify(state))}catch(e){}}
function isLearned(k){return state.learned.indexOf(k)>=0}
function today(){var d=new Date(),p=function(n){return String(n).padStart(2,"0")};return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())}
function skillChips(list,text,kind,hint){
  return list.map(function(k,i){
    var st=' style="--i:'+i+'"';
    if(kind==="need")return '<button type="button" class="chip need'+(hint&&i===0?" hint":"")+'"'+st+' data-learn="'+esc(k)+'" title="Tap when you have learned this">+ '+esc(k)+"</button>";
    if(isLearned(k)&&!has(text,k))return '<button type="button" class="chip have"'+st+' data-unlearn="'+esc(k)+'" title="Tap to undo">&#10003; '+esc(k)+" (learned)</button>";
    return '<span class="chip have"'+st+'>'+esc(k)+"</span>";
  }).join("");
}
function ringHtml(s){
  var C=201.06,f=fromOf(s);
  return '<div class="ring" role="img" aria-label="'+s.pct+' percent match"><svg viewBox="0 0 80 80" width="84" height="84" aria-hidden="true"><circle cx="40" cy="40" r="32" fill="none" stroke="var(--tint)" stroke-width="8"/><circle class="fill rfill" cx="40" cy="40" r="32" fill="none" stroke="var(--accent)" stroke-width="8" stroke-linecap="round" stroke-dasharray="201.06" stroke-dashoffset="'+(C*(1-f/100)).toFixed(2)+'" transform="rotate(-90 40 40)" data-from="'+f+'" data-to="'+s.pct+'"/></svg><span class="pct" data-from="'+f+'" data-to="'+s.pct+'">'+f+'%</span></div>';
}
function progressHtml(){
  var L=state.learned,H=state.history.slice(-8).reverse();
  if(!L.length&&!H.length)return '<div class="card"><h3>Track your progress</h3><p class="note">Tap any red skill above when you learn it. Your match score goes up right away, and your progress is saved on this device so you can come back later and see how far you have come.</p></div>';
  return '<div class="card"><h3>Your progress</h3><p class="note">Saved on this device only. Tap a skill with a tick to undo it.</p>'+
   (L.length?'<div><span class="label">Skills you marked as learned ('+L.length+')</span><div class="found" style="margin-top:6px">'+L.map(function(k){return '<button type="button" class="chip have" data-unlearn="'+esc(k)+'">&#10003; '+esc(k)+"</button>"}).join("")+"</div></div>":"")+
   (H.length?'<div class="hist"><span class="label">Your best match over time</span>'+H.map(function(h){return '<div class="hrow"><span>'+esc(h.d)+" &middot; "+esc(h.name)+'</span><span class="bar"><i style="width:'+h.pct+'%"></i></span><b>'+h.pct+"%</b></div>"}).join("")+"</div>":"")+
   '<div><button type="button" class="ghost" data-reset="1">Reset my progress</button></div></div>';
}
function run(record,mode){
  var text=resume.value;msg.innerHTML="";
  if(text.trim().length<15){msg.innerHTML='<div class="err">Upload your resume or type your skills first. A simple list like "Skills: Python, SQL, Figma" is enough.</div>';foundEl.innerHTML="";resEl.innerHTML="";return}
  var all={};
  var scored=F.map(function(f){
    var have=f.kw.filter(function(k){var m=has(text,k);if(m)all[k]=1;return m||isLearned(k)});
    return {f:f,have:have,need:f.kw.filter(function(k){return have.indexOf(k)<0}),pct:Math.round(have.length/f.kw.length*100)};
  }).sort(function(a,b){return b.pct-a.pct||b.have.length-a.have.length});
  var names=Object.keys(all);
  if(!names.length){foundEl.innerHTML="";resEl.innerHTML='<div class="err">We could not find any known skills. Add a line like "Skills: Python, SQL, Figma, Git" and try again.</div>';return}
  var top=scored[0];
  if(record&&resume.value!==SAMPLE){
    var d=today(),e=state.history.filter(function(h){return h.d===d&&h.id===top.f.id})[0];
    if(e){e.pct=top.pct}else{state.history.push({d:d,id:top.f.id,name:top.f.name,pct:top.pct});state.history=state.history.slice(-30)}
    save();
  }
  foundEl.innerHTML='<div class="card"><span class="label">Skills we found in your resume</span><div class="found">'+chips(names.sort())+"</div></div>";
  resEl.innerHTML='<h2 style="margin-top:6px">Jobs that fit you best</h2>'+scored.slice(0,3).map(function(s,i){
    return '<div class="res'+(i===0?" first":"")+'"><div class="res-top"><div class="rt"><h3 style="font-size:21px">'+esc(s.f.name)+'</h3>'+(i===0?'<span class="chip">Best match</span>':"")+'</div>'+ringHtml(s)+'</div>'+
      '<p>'+esc(s.f.what)+'</p><p class="note" style="max-width:none">You have '+s.have.length+" of the "+s.f.kw.length+" skills this job usually asks for.</p>"+
      '<div class="lines"><div><b>Skills you have</b><div class="found">'+(s.have.length?skillChips(s.have,text,"have"):'<span class="note">None yet</span>')+'</div></div>'+
      '<div><b>Skills to learn next (tap one when you have learned it)</b><div class="found">'+(s.need.length?skillChips(s.need.slice(0,8),text,"need",false):'<span class="note">You have them all. Great work.</span>')+'</div></div></div>'+
      '<div class="row"><button class="go" type="button" data-guide="'+s.f.id+'">Open full guide</button><button class="ghost" type="button" data-open="'+s.f.id+'">Quick overview</button></div></div>';
  }).join("")+
  '<p class="note">Other jobs we checked: '+scored.slice(3,8).map(function(s){return esc(s.f.name)+" "+s.pct+"%"}).join(", ")+".</p>"+progressHtml();
  after(scored,mode);
}
function showResults(){if(!REDUCE){var r=document.getElementById("found");if(r&&r.firstChild)r.scrollIntoView({behavior:"smooth",block:"start"})}}
document.getElementById("match").addEventListener("click",function(){run(true,"full");showResults()});
document.getElementById("clear").addEventListener("click",function(){resume.value="";document.getElementById("sampletag").hidden=true;msg.innerHTML="";statusEl.innerHTML="";foundEl.innerHTML="";resEl.innerHTML="";resume.focus()});
resume.addEventListener("input",function(){document.getElementById("sampletag").hidden=true});
resEl.addEventListener("click",function(e){
  var b=e.target.closest("button");if(!b)return;
  if(b.dataset.open){show(b.dataset.open,true);return}
  if(b.dataset.learn){var rc=b.getBoundingClientRect();burst(rc.left+rc.width/2,rc.top+rc.height/2);try{if(navigator.vibrate)navigator.vibrate(18)}catch(e){}if(!isLearned(b.dataset.learn))state.learned.push(b.dataset.learn);save();run(true,"learn");return}
  if(b.dataset.unlearn){state.learned=state.learned.filter(function(k){return k!==b.dataset.unlearn});save();run(true,"learn");return}
  if(b.dataset.reset){
    if(b.dataset.armed){state={learned:[],history:[]};save();run(false,"learn")}
    else{b.dataset.armed="1";b.textContent="Tap again to delete your progress"}
  }
});

/* ---- resume upload: everything is read in the browser ---- */
function say(kind,t){
  var tick=/^Read /.test(t||"")?'<svg class="tick" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px;margin-right:8px"><path d="M4 12.5l5 5L20 6.5" pathLength="24"/></svg>':"";
  statusEl.innerHTML=t?'<div class="'+kind+(/^Reading/.test(t)?" busy":"")+'">'+tick+esc(t)+"</div>":"";
}
function finish(name,text){
  text=(text||"").replace(/\s+\n/g,"\n").trim();
  if(text.length<15){say("err","We could not find any text in "+name+". If your resume is a picture or a scan, please type or paste your skills below.");return}
  resume.value=text;document.getElementById("sampletag").hidden=true;
  say("ok","Read "+name+" ("+text.split(/\s+/).length+" words). Your results are below.");
  run(true,"full");showResults();
}
function readPdf(buf){
  return loadScript(LIBS.pdf).catch(function(){throw new Error("nopdf")}).then(function(){window.pdfjsLib.GlobalWorkerOptions.workerSrc=LIBS.pdfw;return window.pdfjsLib.getDocument({data:buf}).promise}).then(function(pdf){
    var jobs=[];for(var i=1;i<=Math.min(pdf.numPages,10);i++){jobs.push(pdf.getPage(i).then(function(p){return p.getTextContent()}).then(function(c){return c.items.map(function(x){return x.str}).join(" ")}))}
    return Promise.all(jobs).then(function(a){return a.join("\n")});
  });
}
function readDocx(buf){
  return loadScript(LIBS.docx).catch(function(){throw new Error("nodocx")}).then(function(){return window.mammoth.extractRawText({arrayBuffer:buf})}).then(function(r){return r.value});
}
function handleFile(file){
  if(!file)return;msg.innerHTML="";
  var name=file.name,ext=(name.split(".").pop()||"").toLowerCase();
  if(file.size>5*1024*1024){say("err","That file is bigger than 5 MB. Please use a smaller file, or paste your skills below.");return}
  if(ext==="doc"){say("err","Old .doc files cannot be read. Please save your resume as PDF or .docx, or paste your skills below.");return}
  if(["pdf","docx","txt"].indexOf(ext)<0){say("err","We can read PDF, .docx and .txt files. Please choose one of those, or paste your skills below.");return}
  say("ok","Reading "+name+"...");
  var p;
  try{
    if(ext==="txt"){p=file.text()}
    else if(ext==="pdf"){p=file.arrayBuffer().then(readPdf)}
    else{p=file.arrayBuffer().then(readDocx)}
  }catch(e){p=Promise.reject(e)}
  p.then(function(t){finish(name,t)}).catch(function(e){
    var m=String(e&&e.message||e);
    say("err",/nopdf|nodocx/.test(m)?"The reader for this file type did not load. Please check your internet connection, or paste your skills below.":"We could not read "+name+". It may be locked or damaged. Please paste your skills below instead.");
  });
}
var drop=document.getElementById("drop"),fileIn=document.getElementById("file");
document.getElementById("pick").addEventListener("click",function(){fileIn.click()});
fileIn.addEventListener("change",function(){handleFile(fileIn.files[0]);fileIn.value=""});
["dragenter","dragover"].forEach(function(t){drop.addEventListener(t,function(e){e.preventDefault();drop.classList.add("over")})});
["dragleave","drop"].forEach(function(t){drop.addEventListener(t,function(e){e.preventDefault();drop.classList.remove("over")})});
drop.addEventListener("drop",function(e){handleFile(e.dataTransfer&&e.dataTransfer.files[0])});

/* ---- explore all fields ---- */
var filt="all",filters=document.getElementById("filters"),grid=document.getElementById("grid"),panel=document.getElementById("panel"),cur="";
filters.innerHTML=[["all","All"]].concat(Object.keys(CATS).map(function(k){return [k,CATS[k]]})).map(function(c){return '<button type="button" data-cat="'+c[0]+'" aria-pressed="'+(c[0]==="all")+'">'+esc(c[1])+"</button>"}).join("");
function drawGrid(anim){
  grid.classList.toggle("stagger",anim===true);
  var n=0;
  grid.innerHTML=F.filter(function(f){return filt==="all"||f.industry===filt}).map(function(f){
    return '<button type="button" class="fc" style="--i:'+(n++)+'" data-id="'+f.id+'" aria-pressed="'+(f.id===cur)+'"><span class="cat">'+esc(indName(f.industry)+(f.group?" \u00b7 "+f.group:""))+"</span><strong>"+esc(f.name)+"</strong><span>"+esc(f.what)+"</span></button>";
  }).join("");
}
filters.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;filt=b.dataset.cat;
  Array.prototype.forEach.call(filters.children,function(x){x.setAttribute("aria-pressed",x===b)});drawGrid(true)});
grid.addEventListener("click",function(e){var b=e.target.closest(".fc");if(b)show(b.dataset.id,false)});
function show(id,scroll){
  var f=F.filter(function(x){return x.id===id})[0]||F[0];if(!f)return;cur=f.id;drawGrid(false);panel.style.animation="none";void panel.offsetWidth;panel.style.animation="";
  panel.innerHTML='<div class="skel big" aria-hidden="true"></div>';
  getDetail(f.id).then(function(d){if(cur!==f.id)return;
    panel.innerHTML='<div class="top"><span class="label">'+esc(indName(f.industry)+(f.group?" \u00b7 "+f.group:""))+'</span><h3 style="font-size:clamp(24px,3.6vw,32px)">'+esc(f.name)+"</h3><p>"+esc(f.what)+"</p><p><b>Good for you if:</b> "+esc(f.fit)+"</p></div>"+
     '<div class="cols"><div><span class="label">Skills employers ask for</span><div class="found">'+chips(f.kw)+"</div></div>"+
     '<div><span class="label">What to learn, in order</span><ol class="steps">'+d.path.map(function(s){return "<li>"+esc(s)+"</li>"}).join("")+"</ol></div></div>"+
     '<div class="project"><b>A first project to try</b>'+esc(d.project)+'</div><div><button class="go" type="button" data-guide="'+f.id+'">Open the full guide</button></div>';
  }).catch(function(){if(cur===f.id)panel.innerHTML='<div class="errbox"><p>We could not load this career. Please try again.</p></div>'});
  try{history.replaceState(null,"","#"+f.id)}catch(e){}
  if(scroll){panel.scrollIntoView({behavior:REDUCE?"auto":"smooth",block:"start"})}
}
var H0=location.hash;var h=(location.hash||"").slice(1);
show(F.some(function(f){return f.id===h})?h:F[0].id,false);
window.addEventListener("hashchange",function(){var x=location.hash.slice(1);if(F.some(function(f){return f.id===x}))show(x,false)});
run(false,"full");

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

/* appearance menu */
(function(){var d=document.getElementById("dots"),p=document.getElementById("tpanel");if(!d||!p)return;
  function set(o){p.hidden=!o;d.setAttribute("aria-expanded",o)}
  d.addEventListener("click",function(e){e.stopPropagation();set(p.hidden)});
  document.addEventListener("click",function(e){if(!p.hidden&&!p.contains(e.target))set(false)});
  document.addEventListener("keydown",function(e){if(e.key==="Escape")set(false)})})();


window.addEventListener("ns-grid",function(){drawGrid(true)});
}
function startApp(){
  if(location.protocol==="file:"){
    document.getElementById("grid").innerHTML='<div class="errbox"><p><b>NextStep needs its server running.</b> Opening index.html directly cannot load the careers.</p><p>1. Open the nextstep folder and double-click <b>start.bat</b> (Windows) or run <b>python -m app.server</b>.<br>2. Open <b>http://localhost:8000</b> in your browser.</p></div>';return}
  var sk=document.getElementById("apperr");if(sk)sk.remove();
  Promise.all([api("/config"),api("/careers")]).then(function(r){
    var cfg=r[0];INDS=cfg.industries;INDS.forEach(function(i){CATS[i.id]=i.name});ALIAS=cfg.aliases||{};SAMPLE=cfg.sample||"";F=r[1].careers;
    boot();
    window.dispatchEvent(new CustomEvent("ns-ready",{detail:{careers:F,industries:INDS}}));
  }).catch(function(){
    var g=document.getElementById("grid");
    g.innerHTML='<div class="errbox" id="apperr"><p>We could not load the careers. Please check your internet connection and try again.</p><button class="go" type="button" id="retry">Try again</button></div>';
    document.getElementById("retry").onclick=function(){startApp()};
  });
}
startApp();
