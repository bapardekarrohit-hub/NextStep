(function(){
  var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* rotating headline word */
  var words=["your next career"],wi=0,rot=document.getElementById("rot");
  function setWord(){rot.innerHTML="";var sp=document.createElement("span");sp.textContent=words[wi];rot.appendChild(sp)}
  setWord();
  if(!reduce){setInterval(function(){wi=(wi+1)%words.length;setWord()},2300)}
  /* network background in the header */
  var c=document.getElementById("net"),x=c.getContext("2d"),W=0,H=0,pts=[],mx=-999,my=-999,col="#5fd6d0",run=true,frame=0;
  function size(){var r=c.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2);W=r.width;H=r.height;c.width=W*d;c.height=H*d;x.setTransform(d,0,0,d,0,0);
    var n=Math.max(18,Math.min(W<520?34:60,Math.round(W*H/9000)));pts=[];for(var i=0;i<n;i++)pts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35})}
  function draw(){
    if(frame++%90===0){col=getComputedStyle(document.documentElement).getPropertyValue("--hero-accent").trim()||col}
    x.clearRect(0,0,W,H);x.strokeStyle=col;x.fillStyle=col;
    for(var i=0;i<pts.length;i++){
      var p=pts[i];if(!reduce){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1}
      for(var j=i+1;j<pts.length;j++){var q=pts[j],dx=p.x-q.x,dy=p.y-q.y,dd=dx*dx+dy*dy;
        if(dd<17000){x.globalAlpha=(1-dd/17000)*.28;x.lineWidth=1;x.beginPath();x.moveTo(p.x,p.y);x.lineTo(q.x,q.y);x.stroke()}}
      var mdx=p.x-mx,mdy=p.y-my,md=mdx*mdx+mdy*mdy;
      if(md<26000){x.globalAlpha=(1-md/26000)*.55;x.lineWidth=1.2;x.beginPath();x.moveTo(p.x,p.y);x.lineTo(mx,my);x.stroke()}
      x.globalAlpha=.5;x.beginPath();x.arc(p.x,p.y,2,0,6.2832);x.fill();
    }
    x.globalAlpha=1;
  }
  function loop(){if(run&&!document.hidden)draw();if(!reduce)requestAnimationFrame(loop)}
  size();draw();
  if(!reduce){
    window.addEventListener("resize",size);
    var hd=c.parentNode;
    hd.addEventListener("pointermove",function(e){var r=c.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top});
    hd.addEventListener("pointerleave",function(){mx=-999;my=-999});
    hd.addEventListener("pointerdown",function(e){var r=c.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top});
    hd.addEventListener("pointerup",function(){mx=-999;my=-999});
    if("IntersectionObserver" in window){new IntersectionObserver(function(en){run=en[0].isIntersecting}).observe(hd)}
    requestAnimationFrame(loop);
  }
  /* gentle reveal of lower sections while scrolling (content is never fully hidden) */
  if(!reduce&&"IntersectionObserver" in window){
    var io=new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting){e.target.classList.remove("pre");io.unobserve(e.target)}})},{threshold:.08});
    Array.prototype.forEach.call(document.querySelectorAll('section[aria-labelledby="h-all"] > *, footer p'),function(el){
      el.classList.add("rv");
      if(el.getBoundingClientRect().top>window.innerHeight){el.classList.add("pre");io.observe(el)}
    });
  }

  /* tickers are filled from the API data */
  function fillTickers(list){
    var names=list.map(function(f){return f.name}),tk=document.getElementById("tk");
    tk.innerHTML=names.concat(names).map(function(n){return "<span>"+n.replace(/&/g,"&amp;")+"</span>"}).join("");
    var seen={},skl=[];list.forEach(function(f){f.kw.forEach(function(k){if(!seen[k.toLowerCase()]){seen[k.toLowerCase()]=1;skl.push(k)}})});
    skl=skl.slice(0,40);document.getElementById("tk2").innerHTML=skl.concat(skl).map(function(n){return "<span>"+n.replace(/&/g,"&amp;")+"</span>"}).join("")}
  window.addEventListener("ns-ready",function(ev){var d=ev.detail;fillTickers(d.careers);words=d.industries.map(function(i){return i.name});wi=0;setWord()});
  /* headings: accent line draws in when scrolled to */
  if(!reduce&&"IntersectionObserver" in window){
    var ho=new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting){e.target.classList.remove("pending");ho.unobserve(e.target)}})},{threshold:.6});
    Array.prototype.forEach.call(document.querySelectorAll("section > h2"),function(h){
      if(h.getBoundingClientRect().top>window.innerHeight*.8){h.classList.add("pending");ho.observe(h)}
    });
  }
  /* tap ripple (works on touch screens too) */
  if(!reduce){
    document.addEventListener("pointerdown",function(e){
      var t=e.target.closest&&e.target.closest(".go,.ghost,.fc,.filters button");if(!t)return;
      var r=t.getBoundingClientRect(),d=Math.max(r.width,r.height)*1.6,sp=document.createElement("span");
      sp.className="rip";sp.style.cssText="left:"+(e.clientX-r.left-d/2)+"px;top:"+(e.clientY-r.top-d/2)+"px;width:"+d+"px;height:"+d+"px";
      t.appendChild(sp);
      sp.animate([{transform:"scale(0)",opacity:.3},{transform:"scale(1)",opacity:0}],{duration:600,easing:"ease-out"}).onfinish=function(){sp.remove()};
    });
  }
  /* scroll progress bar and back-to-top button */
  /* title letters */
  var h1=document.querySelector("header h1");
  if(!reduce&&h1){var txt=h1.textContent,ci=0;h1.setAttribute("aria-label",txt);h1.innerHTML=txt.split(" ").map(function(w){return '<span class="w" aria-hidden="true">'+w.split("").map(function(c){return '<span class="ch" style="--c:'+(ci++)+'">'+c+"</span>"}).join("")+"</span>"}).join(" ")}
  /* colour themes */
  var pals=document.querySelectorAll(".pal button"),root=document.documentElement;
  function markPal(){var cur=root.getAttribute("data-pal")||"violet";Array.prototype.forEach.call(pals,function(b){b.setAttribute("aria-pressed",b.dataset.pal===cur)})}
  markPal();
  Array.prototype.forEach.call(pals,function(b){b.addEventListener("click",function(){
    if(!reduce){root.classList.add("pal-anim");setTimeout(function(){root.classList.remove("pal-anim")},750)}
    root.setAttribute("data-pal",b.dataset.pal);markPal();
    try{localStorage.setItem("cff.pal",b.dataset.pal)}catch(e){}
    if(!reduce){var r=b.getBoundingClientRect();burst(r.left+r.width/2,r.top+r.height/2)}
  })});
  /* light / dark / auto */
  var tms=document.querySelectorAll(".tm button");
  function markTheme(){var t=root.getAttribute("data-theme")||"auto";Array.prototype.forEach.call(tms,function(b){b.setAttribute("aria-pressed",b.dataset.themeBtn===t)})}
  markTheme();
  Array.prototype.forEach.call(tms,function(b){b.addEventListener("click",function(){
    if(!reduce){root.classList.add("pal-anim");setTimeout(function(){root.classList.remove("pal-anim")},750)}
    var m=b.dataset.themeBtn;
    if(m==="auto"){root.removeAttribute("data-theme")}else{root.setAttribute("data-theme",m)}
    markTheme();
    try{if(m==="auto")localStorage.removeItem("cff.theme");else localStorage.setItem("cff.theme",m)}catch(e){}
    if(!reduce){var r=b.getBoundingClientRect();burst(r.left+r.width/2,r.top+r.height/2)}
  })});
  /* glow that follows the pointer in the hero; magnetic buttons; card tilt and glow */
  var hdr=document.querySelector("header");
  if(!reduce&&window.matchMedia("(hover:hover)").matches){
    hdr.addEventListener("pointermove",function(e){var r=hdr.getBoundingClientRect();hdr.style.setProperty("--mx",(e.clientX-r.left)+"px");hdr.style.setProperty("--my",(e.clientY-r.top)+"px")});
    document.addEventListener("pointermove",function(e){
      var g=e.target.closest&&e.target.closest(".go");
      if(g){var r=g.getBoundingClientRect();g.style.setProperty("--tx",((e.clientX-r.left-r.width/2)*.12).toFixed(1)+"px");g.style.setProperty("--ty2",((e.clientY-r.top-r.height/2)*.18).toFixed(1)+"px")}
    });
    document.addEventListener("pointerout",function(e){var g=e.target.closest&&e.target.closest(".go");if(g){g.style.setProperty("--tx","0px");g.style.setProperty("--ty2","0px")}});
    var gridEl=document.getElementById("grid");
    gridEl.addEventListener("pointermove",function(e){var c=e.target.closest(".fc");if(!c)return;var r=c.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
      c.style.setProperty("--ry",((px-.5)*10).toFixed(1)+"deg");c.style.setProperty("--rx",((.5-py)*8).toFixed(1)+"deg");c.style.setProperty("--gx",(px*100).toFixed(0)+"%");c.style.setProperty("--gy",(py*100).toFixed(0)+"%")});
    gridEl.addEventListener("pointerout",function(e){var c=e.target.closest(".fc");if(c){c.style.setProperty("--rx","0deg");c.style.setProperty("--ry","0deg")}});
  }
  /* field cards pop in when the grid scrolls into view */
  if(!reduce&&"IntersectionObserver" in window){var go2=new IntersectionObserver(function(en){if(en[0].isIntersecting){go2.disconnect();window.dispatchEvent(new Event("ns-grid"))}},{threshold:.15});go2.observe(document.getElementById("grid"))}
  var orbs=document.querySelectorAll(".orb");
  var prog=document.getElementById("prog"),fab=document.getElementById("topbtn"),tick2=false;
  function onScroll(){
    if(tick2)return;tick2=true;
    requestAnimationFrame(function(){
      var h=document.documentElement.scrollHeight-window.innerHeight,y=window.scrollY||document.documentElement.scrollTop||0;
      prog.style.transform="scaleX("+(h>0?Math.min(y/h,1):0)+")";
      fab.classList.toggle("show",y>700);
      if(!reduce){document.body.style.backgroundPosition="0 "+(-y*.25).toFixed(1)+"px";Array.prototype.forEach.call(orbs,function(o,i){o.style.translate="0 "+(-y*(.1+i*.05)).toFixed(1)+"px"});if(y<900)hdr.style.transform="translateY("+(y*.05).toFixed(1)+"px)"}
      tick2=false;
    });
  }
  window.addEventListener("scroll",onScroll,{passive:true});onScroll();
  fab.addEventListener("click",function(){window.scrollTo({top:0,behavior:reduce?"auto":"smooth"})});
})();

