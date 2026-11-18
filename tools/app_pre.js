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
