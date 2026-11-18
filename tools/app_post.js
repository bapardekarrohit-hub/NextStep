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
