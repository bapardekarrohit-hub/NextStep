"""SQLite storage. Content lives in tables, never in code. Swap this module for Postgres later without touching the API layer."""
import json, os, sqlite3, hashlib, time

DB_PATH = os.environ.get("NEXTSTEP_DB", os.path.join(os.path.dirname(__file__), "..", "data", "nextstep.db"))
SEED_PATH = os.path.join(os.path.dirname(__file__), "..", "seed", "data.json")

SCHEMA = """
CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS industries(id TEXT PRIMARY KEY, name TEXT NOT NULL, blurb TEXT DEFAULT '', color TEXT DEFAULT '', sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS careers(
  id TEXT PRIMARY KEY, industry_id TEXT NOT NULL REFERENCES industries(id), grp TEXT DEFAULT '',
  name TEXT NOT NULL, what TEXT DEFAULT '', fit TEXT DEFAULT '', kw TEXT DEFAULT '[]', path TEXT DEFAULT '[]',
  project TEXT DEFAULT '', guide TEXT DEFAULT '{}', sort INTEGER DEFAULT 0, updated INTEGER DEFAULT 0);
CREATE INDEX IF NOT EXISTS idx_careers_ind ON careers(industry_id);
CREATE TABLE IF NOT EXISTS quiz_questions(
  id INTEGER PRIMARY KEY AUTOINCREMENT, career_id TEXT NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  q TEXT NOT NULL, options TEXT NOT NULL, explanation TEXT DEFAULT '');
CREATE INDEX IF NOT EXISTS idx_quiz_career ON quiz_questions(career_id);
CREATE TABLE IF NOT EXISTS config(key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS progress(
  client_id TEXT NOT NULL, career_id TEXT NOT NULL, data TEXT NOT NULL, updated INTEGER NOT NULL,
  PRIMARY KEY(client_id, career_id));
"""

def connect():
    os.makedirs(os.path.dirname(os.path.abspath(DB_PATH)), exist_ok=True)
    c = sqlite3.connect(DB_PATH, timeout=10)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA journal_mode=WAL"); c.execute("PRAGMA foreign_keys=ON"); c.execute("PRAGMA synchronous=NORMAL")
    return c

def init():
    c = connect(); c.executescript(SCHEMA); c.commit()
    raw = open(SEED_PATH, "rb").read(); h = hashlib.sha256(raw).hexdigest()
    cur = c.execute("SELECT value FROM meta WHERE key='seed_hash'").fetchone()
    if not cur or cur["value"] != h:
        load_seed(c, json.loads(raw))
        c.execute("INSERT OR REPLACE INTO meta VALUES('seed_hash',?)", (h,)); c.commit()
    c.close()

def load_seed(c, d):
    for i in d["industries"]:
        upsert_industry(c, i)
    for k, v in d["config"].items():
        c.execute("INSERT OR REPLACE INTO config VALUES(?,?)", (k, json.dumps(v, ensure_ascii=False)))
    for n, cr in enumerate(d["careers"]):
        upsert_career(c, cr, n)
    c.commit()

def upsert_industry(c, i):
    c.execute("INSERT INTO industries(id,name,blurb,color,sort) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,blurb=excluded.blurb,color=excluded.color,sort=excluded.sort",
              (i["id"], i["name"], i.get("blurb", ""), i.get("color", ""), i.get("sort", 0)))

def upsert_career(c, cr, sort=0):
    c.execute("""INSERT INTO careers(id,industry_id,grp,name,what,fit,kw,path,project,guide,sort,updated) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET industry_id=excluded.industry_id,grp=excluded.grp,name=excluded.name,what=excluded.what,fit=excluded.fit,kw=excluded.kw,
      path=excluded.path,project=excluded.project,guide=excluded.guide,sort=excluded.sort,updated=excluded.updated""",
      (cr["id"], cr["industry"], cr.get("group", ""), cr["name"], cr.get("what", ""), cr.get("fit", ""), json.dumps(cr.get("kw", []), ensure_ascii=False),
       json.dumps(cr.get("path", []), ensure_ascii=False), cr.get("project", ""), json.dumps(cr.get("guide", {}), ensure_ascii=False), sort, int(time.time())))
    if "quiz" in cr:
        c.execute("DELETE FROM quiz_questions WHERE career_id=?", (cr["id"],))
        for q in cr["quiz"]:
            c.execute("INSERT INTO quiz_questions(career_id,q,options,explanation) VALUES(?,?,?,?)",
                      (cr["id"], q["q"], json.dumps(q["options"], ensure_ascii=False), q.get("explanation", "")))
