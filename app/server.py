"""NextStep API + static file server. Standard library only (Python 3.9+). Run: python -m app.server"""
import gzip, json, os, random, re, hashlib, threading, time, mimetypes, hmac
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from . import db

WEB = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "web"))
ADMIN_KEY = os.environ.get("ADMIN_KEY", "")
MAX_BODY = 256 * 1024
ID_RE = re.compile(r"^[a-z][a-z0-9-]{1,40}$")
CLIENT_RE = re.compile(r"^[A-Za-z0-9-]{16,64}$")
KEY_RE = re.compile(r"^[a-z][0-9a-z_]{0,12}$")
HITS = {}; HITS_LOCK = threading.Lock()

class ApiError(Exception):
    def __init__(s, code, msg): s.code, s.msg = code, msg

def limited(ip, limit=120, window=60):
    now = time.time()
    with HITS_LOCK:
        a = [t for t in HITS.get(ip, []) if now - t < window]
        a.append(now); HITS[ip] = a
        if len(HITS) > 5000:
            for k in [k for k, v in HITS.items() if not v or now - v[-1] > window]: HITS.pop(k, None)
        return len(a) > limit

def J(v): return json.loads(v) if isinstance(v, str) else v

def career_summary(r): return dict(id=r["id"], industry=r["industry_id"], group=r["grp"], name=r["name"], what=r["what"], fit=r["fit"], kw=J(r["kw"]))

# ---------- handlers: (conn, params, query, body) -> (status, payload, cache_seconds) ----------
def h_health(c, p, q, b): return 200, {"ok": True, "careers": c.execute("SELECT COUNT(*) n FROM careers").fetchone()["n"]}, 0
def h_config(c, p, q, b):
    cfg = {r["key"]: J(r["value"]) for r in c.execute("SELECT * FROM config")}
    inds = [dict(r) for r in c.execute("SELECT id,name,blurb,color FROM industries ORDER BY sort,name")]
    counts = {r["industry_id"]: r["n"] for r in c.execute("SELECT industry_id,COUNT(*) n FROM careers GROUP BY industry_id")}
    for i in inds: i["count"] = counts.get(i["id"], 0)
    return 200, {"industries": inds, "aliases": cfg.get("aliases", {}), "sample": cfg.get("sample", "")}, 300
def h_careers(c, p, q, b):
    ind = (q.get("industry") or [""])[0]
    if ind and not ID_RE.match(ind): raise ApiError(400, "bad industry")
    rows = c.execute("SELECT * FROM careers WHERE (?='' OR industry_id=?) ORDER BY sort,name", (ind, ind)).fetchall()
    return 200, {"careers": [career_summary(r) for r in rows]}, 300
def get_career(c, cid):
    if not ID_RE.match(cid): raise ApiError(400, "bad id")
    r = c.execute("SELECT * FROM careers WHERE id=?", (cid,)).fetchone()
    if not r: raise ApiError(404, "career not found")
    return r
def h_career(c, p, q, b):
    r = get_career(c, p["id"]); d = career_summary(r)
    d.update(path=J(r["path"]), project=r["project"], guide=J(r["guide"]))
    qs = c.execute("SELECT q,options,explanation FROM quiz_questions WHERE career_id=?", (r["id"],)).fetchall()
    d["flashcards"] = [dict(q=x["q"], a=J(x["options"])[0], note=x["explanation"]) for x in qs]
    rel = c.execute("SELECT id,name FROM careers WHERE industry_id=? AND id!=? ORDER BY (grp=?) DESC,sort LIMIT 4", (r["industry_id"], r["id"], r["grp"])).fetchall()
    d["related"] = [dict(x) for x in rel]
    return 200, d, 300
def h_quiz(c, p, q, b):
    r = get_career(c, p["id"])
    rows = c.execute("SELECT id,q,options FROM quiz_questions WHERE career_id=?", (r["id"],)).fetchall()
    random.shuffle(rows := list(rows)); out = []
    for x in rows[:5]:
        o = J(x["options"]); random.shuffle(o); out.append(dict(id=x["id"], q=x["q"], options=o))
    return 200, {"career": r["id"], "questions": out}, 0
def h_quiz_check(c, p, q, b):
    try: qid, ans = int(b["question_id"]), str(b["answer"])
    except Exception: raise ApiError(400, "question_id and answer required")
    x = c.execute("SELECT options,explanation FROM quiz_questions WHERE id=?", (qid,)).fetchone()
    if not x: raise ApiError(404, "question not found")
    correct = J(x["options"])[0]
    return 200, {"correct": ans == correct, "answer": correct, "explanation": x["explanation"]}, 0
def clean_progress(b):
    if not isinstance(b, dict): raise ApiError(400, "object expected")
    chk = b.get("checked", {}); 
    if not isinstance(chk, dict) or len(chk) > 200: raise ApiError(400, "bad checked")
    out = {k: 1 for k, v in chk.items() if v and KEY_RE.match(str(k))}
    best = int(b.get("best", 0) or 0); mins = int(b.get("mins", 0) or 0)
    return {"checked": out, "best": max(0, min(5, best)), "mins": max(0, min(100000, mins))}
def h_progress_get(c, p, q, b):
    if not CLIENT_RE.match(p["cid"]): raise ApiError(400, "bad client id")
    rows = c.execute("SELECT career_id,data,updated FROM progress WHERE client_id=?", (p["cid"],)).fetchall()
    return 200, {"progress": {r["career_id"]: dict(J(r["data"]), updated=r["updated"]) for r in rows}}, 0
def h_progress_put(c, p, q, b):
    if not CLIENT_RE.match(p["cid"]): raise ApiError(400, "bad client id")
    get_career(c, p["id"]); d = clean_progress(b)
    c.execute("INSERT INTO progress VALUES(?,?,?,?) ON CONFLICT(client_id,career_id) DO UPDATE SET data=excluded.data,updated=excluded.updated",
              (p["cid"], p["id"], json.dumps(d), int(time.time())))
    c.commit(); return 200, {"ok": True}, 0
def need_admin(h):
    k = h.headers.get("X-Admin-Key", "")
    if not ADMIN_KEY or not hmac.compare_digest(k, ADMIN_KEY): raise ApiError(403, "admin key required")
def valid_career(b):
    if not isinstance(b, dict): raise ApiError(400, "object expected")
    for k in ("id", "industry", "name"):
        if not isinstance(b.get(k), str) or not b[k]: raise ApiError(400, "missing " + k)
    if not ID_RE.match(b["id"]): raise ApiError(400, "bad id")
    for k in ("kw", "path"):
        if k in b and not isinstance(b[k], list): raise ApiError(400, k + " must be a list")
    for q in b.get("quiz", []):
        if not isinstance(q, dict) or not isinstance(q.get("options"), list) or len(q["options"]) != 4 or not q.get("q"): raise ApiError(400, "quiz needs q and 4 options (correct first)")
def h_admin_career(c, p, q, b, h):
    need_admin(h); valid_career(b)
    if not c.execute("SELECT 1 FROM industries WHERE id=?", (b["industry"],)).fetchone(): raise ApiError(400, "unknown industry")
    db.upsert_career(c, b); c.commit(); return 200, {"ok": True, "id": b["id"]}, 0
def h_admin_industry(c, p, q, b, h):
    need_admin(h)
    if not isinstance(b, dict) or not ID_RE.match(str(b.get("id", ""))) or not b.get("name"): raise ApiError(400, "id and name required")
    db.upsert_industry(c, b); c.commit(); return 200, {"ok": True}, 0
def h_admin_delete(c, p, q, b, h):
    need_admin(h); get_career(c, p["id"]); c.execute("DELETE FROM careers WHERE id=?", (p["id"],)); c.commit(); return 200, {"ok": True}, 0

ROUTES = [
  ("GET", r"^/api/health$", h_health), ("GET", r"^/api/config$", h_config), ("GET", r"^/api/careers$", h_careers),
  ("GET", r"^/api/careers/(?P<id>[^/]+)$", h_career), ("GET", r"^/api/careers/(?P<id>[^/]+)/quiz$", h_quiz),
  ("POST", r"^/api/quiz/check$", h_quiz_check),
  ("GET", r"^/api/progress/(?P<cid>[^/]+)$", h_progress_get), ("PUT", r"^/api/progress/(?P<cid>[^/]+)/(?P<id>[^/]+)$", h_progress_put),
  ("PUT", r"^/api/admin/careers$", h_admin_career), ("PUT", r"^/api/admin/industries$", h_admin_industry), ("DELETE", r"^/api/admin/careers/(?P<id>[^/]+)$", h_admin_delete),
]
ROUTES = [(m, re.compile(p), f) for m, p, f in ROUTES]
SEC = {"X-Content-Type-Options": "nosniff", "Referrer-Policy": "same-origin", "X-Frame-Options": "DENY"}

class H(BaseHTTPRequestHandler):
    server_version = "NextStep/1"; protocol_version = "HTTP/1.1"
    def log_message(self, f, *a):
        if os.environ.get("NEXTSTEP_LOG"): super().log_message(f, *a)
    def ip(self): return self.headers.get("X-Forwarded-For", self.client_address[0]).split(",")[0].strip()
    def send(self, code, body, ctype, cache=0, extra=None):
        etag = None
        if self.command in ("GET", "HEAD") and code == 200 and cache:
            etag = '"%s"' % hashlib.md5(body).hexdigest()[:16]
            if self.headers.get("If-None-Match") == etag:
                self.send_response(304); self.send_header("ETag", etag); self.send_header("Content-Length", "0"); self.end_headers(); return
        gz = len(body) > 600 and "gzip" in self.headers.get("Accept-Encoding", "") and (ctype.startswith("text/") or "json" in ctype or "javascript" in ctype or "svg" in ctype)
        if gz: body = gzip.compress(body, 5)
        self.send_response(code); self.send_header("Content-Type", ctype); self.send_header("Content-Length", str(len(body)))
        if gz: self.send_header("Content-Encoding", "gzip")
        self.send_header("Vary", "Accept-Encoding")
        self.send_header("Cache-Control", ("public, max-age=%d" % cache) if cache else "no-store")
        if etag: self.send_header("ETag", etag)
        for k, v in {**SEC, **(extra or {})}.items(): self.send_header(k, v)
        self.end_headers()
        if self.command != "HEAD": self.wfile.write(body)
    def api(self, path, q):
        for m, rx, f in ROUTES:
            mt = rx.match(path)
            if not mt: continue
            if m != self.command: continue
            if m != "GET" and limited(self.ip(), 60): raise ApiError(429, "too many requests")
            body = None
            if m in ("POST", "PUT"):
                n = int(self.headers.get("Content-Length") or 0)
                if n > MAX_BODY: raise ApiError(413, "body too large")
                try: body = json.loads(self.rfile.read(n) or b"{}")
                except ValueError: raise ApiError(400, "invalid JSON")
            c = db.connect()
            try:
                args = (c, mt.groupdict(), q, body)
                res = f(*args, self) if f.__name__.startswith("h_admin") else f(*args)
            finally: c.close()
            return res
        if any(rx.match(path) for _, rx, _ in ROUTES): raise ApiError(405, "method not allowed")
        raise ApiError(404, "not found")
    def handle_any(self):
        u = urlparse(self.path); path = u.path
        try:
            if path.startswith("/api/"):
                if self.command == "GET" and limited(self.ip(), 600): raise ApiError(429, "too many requests")
                code, data, cache = self.api(path, parse_qs(u.query))
                self.send(code, json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode(), "application/json; charset=utf-8", cache)
            else: self.static(path)
        except ApiError as e:
            self.send(e.code, json.dumps({"error": e.msg}).encode(), "application/json")
        except Exception as e:
            if os.environ.get("NEXTSTEP_LOG"): raise
            self.send(500, b'{"error":"server error"}', "application/json")
    def static(self, path):
        if self.command not in ("GET", "HEAD"): raise ApiError(405, "method not allowed")
        rel = "index.html" if path in ("/", "") else path.lstrip("/")
        fp = os.path.abspath(os.path.join(WEB, rel))
        if not fp.startswith(WEB + os.sep) or not os.path.isfile(fp): fp = os.path.join(WEB, "index.html") if "." not in os.path.basename(rel) else None
        if not fp: raise ApiError(404, "not found")
        ctype = mimetypes.guess_type(fp)[0] or "application/octet-stream"
        if ctype.startswith("text/") or ctype in ("application/javascript", "image/svg+xml"): ctype += "; charset=utf-8" if "charset" not in ctype else ""
        with open(fp, "rb") as fh: body = fh.read()
        cache = 0 if fp.endswith("index.html") else 3600
        extra = {"Content-Security-Policy": "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; worker-src 'self' blob: https://cdnjs.cloudflare.com; frame-ancestors 'none'"} if fp.endswith("index.html") else None
        self.send(200, body, ctype, cache, extra)
    do_GET = do_HEAD = do_POST = do_PUT = do_DELETE = handle_any

def main():
    db.init()
    port = int(os.environ.get("PORT", "8000")); host = os.environ.get("HOST", "0.0.0.0")
    srv = ThreadingHTTPServer((host, port), H); srv.daemon_threads = True
    print("NextStep running on http://%s:%d" % (host, port), flush=True)
    try: srv.serve_forever()
    except KeyboardInterrupt: pass
if __name__ == "__main__": main()
