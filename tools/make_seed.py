"""Builds seed/data.json from the legacy content dump plus tools/more_careers.py."""
import json,sys
sys.path.insert(0,'tools')
from more_careers import MORE
L=json.load(open('/tmp/legacy.json'))
IND=[("tech","Technology","Software, security and cloud","#5b3fd6"),("data","Data & AI","Analytics, science and machine learning","#0a6c78"),
("design","Design & Creative","Design, video and visual work","#be185d"),("business","Business & Marketing","Marketing, people and management","#b45309"),
("finance","Finance & Accounts","Money, reports and analysis","#0b7a4b"),("education","Education","Teaching and learning design","#4f46e5")]
LEG={"frontend":("tech","Web & apps"),"backend":("tech","Web & apps"),"fullstack":("tech","Web & apps"),"mobile":("tech","Web & apps"),"cyber":("tech","Security & cloud"),"devops":("tech","Security & cloud"),"qa":("tech","Quality"),"game":("tech","Games"),
"analyst":("data","Analysis"),"scientist":("data","Science"),"dataeng":("data","Engineering"),"mleng":("data","Science"),"ux":("design","Product design"),"graphic":("design","Visual"),"video":("design","Visual"),"marketing":("business","Marketing"),"ba":("business","Analysis")}
def conv(f,g,industry,group):
    return dict(id=f["id"],industry=industry,group=group,name=f["name"],what=f["what"],fit=f["fit"],kw=f["kw"],path=f["path"],project=f["project"],
      guide=dict(time=g["time"],level=g["lvl"],jobs=g["jobs"],days=g["days"],tools=g["tools"],interview=g["iv"],
        stages=[dict(title=s[0],weeks=s[1],items=s[2]) for s in g["st"]],
        sources=[dict(name=s[0],url=s[1],price=s[2],desc=s[3]) for s in g["src"]],
        projects=[dict(level=p[0],title=p[1],desc=p[2],publish=p[3]) for p in g["proj"]]),
      quiz=[dict(q=q[0],options=[q[1],q[2],q[3],q[4]],explanation=q[5]) for q in g["quiz"]])
careers=[]
for f in L["F"]:
    ind,grp=LEG[f["id"]];g=L["GD"][f["id"]]
    careers.append(conv(f,g,ind,grp))
for m in MORE:
    f={k:m[k] for k in("id","name","what","fit","kw","path","project")}
    careers.append(conv(f,m["g"],m["industry"],m["group"]))
# sanity
for c in careers:
    assert len(c["quiz"])==5 and len(c["guide"]["days"])==7 and len(c["guide"]["stages"])==4,c["id"]
    for q in c["quiz"]:assert len(set(q["options"]))==4,(c["id"],q["q"])
json.dump(dict(industries=[dict(id=a,name=b,blurb=c,color=d,sort=i) for i,(a,b,c,d) in enumerate(IND)],
  config=dict(aliases=L["ALIAS"],sample="B.Sc. Computer Science student. Skills: Python, SQL, Excel, Tableau, pandas, NumPy, scikit-learn, HTML, CSS, JavaScript, Git. Projects: sales dashboard in Tableau, churn prediction with machine learning, personal portfolio website."),
  careers=careers),open('seed/data.json','w'),ensure_ascii=False,indent=1)
print(len(careers),"careers")
