import re,os
S=open('/home/claude/skillgap/pathloom.html',encoding='utf8').read()
os.makedirs('web/css',exist_ok=True);os.makedirs('web/js',exist_ok=True)
# ---- css
css=re.search(r'<style>(.*?)</style>',S,re.S).group(1)
css=css.replace('@media (max-width:640px){.hctl{align-items:flex-start}.tpanel{left:0;right:auto}}','')
css=css.replace('@media (max-width:640px){.hctl{position:relative;top:auto;right:auto;order:-1;justify-self:start;justify-content:flex-start}.orb{opacity:.3}}','@media (max-width:640px){.hctl{top:12px;right:12px}.orb{opacity:.3}}')
css+='''
/* ---- NextStep additions ---- */
.hctl{top:14px;right:14px}
.tpanel{right:0;left:auto}
header{padding-top:max(64px,calc(env(safe-area-inset-top,0px) + 56px))}
.skel{height:84px;border-radius:12px;background:linear-gradient(100deg,var(--tint) 30%,var(--surface) 50%,var(--tint) 70%);background-size:200% 100%}
.skel.big{height:190px}
@media (prefers-reduced-motion:no-preference){.skel{animation:sk 1.2s linear infinite}@keyframes sk{to{background-position:-200% 0}}}
.skgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.errbox{background:var(--need);color:var(--need-fg);border-radius:12px;padding:18px;display:grid;gap:12px;margin-top:16px}
.fc .cat{font-size:12px}
.ibadge{display:inline-block;background:var(--tint);color:var(--tint-fg);border-radius:999px;padding:1px 8px;font-size:12px;margin-left:6px;font-weight:700}
.filters{flex-wrap:wrap}
@media (max-width:640px){.filters{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;padding-bottom:4px}.filters::-webkit-scrollbar{display:none}.filters button{flex:none}}
'''
open('web/css/app.css','w',encoding='utf8').write(css)
# ---- html
body=S[S.index('</style>')+8:]
body=body[:body.index('<script src="https://cdnjs')]
head='''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>NextStep</title>
<meta name="description" content="NextStep: upload your resume, find the career that fits you in any industry, and follow a free step-by-step guide.">
<meta name="theme-color" content="#5b3fd6">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%235b3fd6'/%3E%3Cpath d='M9 22h5v-5h5v-5h5' fill='none' stroke='%23fff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&display=swap">
<script src="js/theme.js"></script>
<link rel="stylesheet" href="css/app.css">
</head>
<body>
'''
tail='''
<noscript><p style="padding:24px">NextStep needs JavaScript to run.</p></noscript>
<script src="js/app.js" defer></script>
<script src="js/fx.js" defer></script>
</body></html>
'''
body=body.replace('<h1>Pathora</h1>','<h1>NextStep</h1>').replace('Your career, your path','Any career. One clear next step.')
# skeleton in grid
body=body.replace('<div class="grid" id="grid"></div>','<div class="grid" id="grid"><div class="skgrid" aria-hidden="true"><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div></div></div>')
body=body.replace('<h2 id="h-all">Explore all jobs and fields</h2>','<h2 id="h-all">Explore careers in every industry</h2>')
body=body.replace('<p class="sub">Tap any job to see what it is, what to learn and what to build first.</p>','<p class="sub">Pick an industry, then tap a career to see what it is and what to learn first.</p>')
open('web/index.html','w',encoding='utf8').write(head+body+tail)
# ---- theme.js
th=re.search(r'<script>(try\{var _t=.*?)</script>',S,re.S).group(1)
th=th.replace('cff.theme','ns.theme').replace('cff.pal','ns.pal')
open('web/js/theme.js','w').write(th)
# ---- app.js
m=re.search(r'<script>\n(var CATS=.*?)</script>\n<script>\n\(function\(\)\{(.*?)</script>',S,re.S)
main,fx=m.group(1),m.group(2)
i=main.index('function esc(s)');j=main.index('var GD={};')
dots=main[main.index('/* appearance menu */'):]
bodyjs=main[i:j]
bodyjs=bodyjs.replace('f.cat','f.industry')
bodyjs=bodyjs.replace('esc(CATS[f.industry])','esc(indName(f.industry)+(f.group?" \\u00b7 "+f.group:""))')
bodyjs=bodyjs.replace('"cff.v1"','"ns.v1"')
# show()
a=bodyjs.index('function show(id,scroll){');b=bodyjs.index('var H0=location.hash')
newshow='''function show(id,scroll){
  var f=F.filter(function(x){return x.id===id})[0]||F[0];if(!f)return;cur=f.id;drawGrid(false);panel.style.animation="none";void panel.offsetWidth;panel.style.animation="";
  panel.innerHTML='<div class="skel big" aria-hidden="true"></div>';
  getDetail(f.id).then(function(d){if(cur!==f.id)return;
    panel.innerHTML='<div class="top"><span class="label">'+esc(indName(f.industry)+(f.group?" \\u00b7 "+f.group:""))+'</span><h3 style="font-size:clamp(24px,3.6vw,32px)">'+esc(f.name)+"</h3><p>"+esc(f.what)+"</p><p><b>Good for you if:</b> "+esc(f.fit)+"</p></div>"+
     '<div class="cols"><div><span class="label">Skills employers ask for</span><div class="found">'+chips(f.kw)+"</div></div>"+
     '<div><span class="label">What to learn, in order</span><ol class="steps">'+d.path.map(function(s){return "<li>"+esc(s)+"</li>"}).join("")+"</ol></div></div>"+
     '<div class="project"><b>A first project to try</b>'+esc(d.project)+'</div><div><button class="go" type="button" data-guide="'+f.id+'">Open the full guide</button></div>';
  }).catch(function(){if(cur===f.id)panel.innerHTML='<div class="errbox"><p>We could not load this career. Please try again.</p></div>'});
  try{history.replaceState(null,"","#"+f.id)}catch(e){}
  if(scroll){panel.scrollIntoView({behavior:REDUCE?"auto":"smooth",block:"start"})}
}
'''
bodyjs=bodyjs[:a]+newshow+bodyjs[b:]
bodyjs=bodyjs.replace('show(F.some(function(f){return f.id===h})?h:"frontend",false);','show(F.some(function(f){return f.id===h})?h:F[0].id,false);')
# lazy libs
bodyjs=bodyjs.replace('''  if(!window.pdfjsLib){throw new Error("nopdf")}
  window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  return window.pdfjsLib.getDocument({data:buf}).promise.then(''','''  return loadScript(LIBS.pdf).catch(function(){throw new Error("nopdf")}).then(function(){window.pdfjsLib.GlobalWorkerOptions.workerSrc=LIBS.pdfw;return window.pdfjsLib.getDocument({data:buf}).promise}).then(''')
bodyjs=bodyjs.replace('''  if(!window.mammoth){throw new Error("nodocx")}
  return window.mammoth.extractRawText({arrayBuffer:buf}).then(function(r){return r.value});''','''  return loadScript(LIBS.docx).catch(function(){throw new Error("nodocx")}).then(function(){return window.mammoth.extractRawText({arrayBuffer:buf})}).then(function(r){return r.value});''')
assert 'loadScript(LIBS.pdf)' in bodyjs and 'loadScript(LIBS.docx)' in bodyjs and 'getDetail(f.id)' in bodyjs
guide=open('tools/guide_api.js',encoding='utf8').read()
pre=open('tools/app_pre.js',encoding='utf8').read()
post=open('tools/app_post.js',encoding='utf8').read()
open('web/js/app.js','w',encoding='utf8').write(pre+'\nfunction boot(){\n'+bodyjs+'\n'+guide+'\n'+dots+'\nwindow.addEventListener("ns-grid",function(){drawGrid(true)});\n}\n'+post)
# ---- fx.js
a=fx.index('/* ticker of every field */');b=fx.index('/* headings: accent line')
tick='''/* tickers are filled from the API data */
  function fillTickers(list){
    var names=list.map(function(f){return f.name}),tk=document.getElementById("tk");
    tk.innerHTML=names.concat(names).map(function(n){return "<span>"+n.replace(/&/g,"&amp;")+"</span>"}).join("");
    var seen={},skl=[];list.forEach(function(f){f.kw.forEach(function(k){if(!seen[k.toLowerCase()]){seen[k.toLowerCase()]=1;skl.push(k)}})});
    skl=skl.slice(0,40);document.getElementById("tk2").innerHTML=skl.concat(skl).map(function(n){return "<span>"+n.replace(/&/g,"&amp;")+"</span>"}).join("")}
  window.addEventListener("ns-ready",function(ev){var d=ev.detail;fillTickers(d.careers);words=d.industries.map(function(i){return i.name});wi=0;setWord()});
  '''
fx=fx[:a]+tick+fx[b:]
fx=fx.replace('drawGrid(true)','window.dispatchEvent(new Event("ns-grid"))')
fx=re.sub(r'var words=\[[^\]]*\]','var words=["your next career"]',fx,count=1)
open('web/js/fx.js','w',encoding='utf8').write('(function(){'+fx+'\n')
print('built')
