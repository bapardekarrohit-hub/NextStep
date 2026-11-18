"""Run: python -m unittest discover tests   (starts the server on a temporary database)"""
import json, os, subprocess, sys, tempfile, time, unittest, urllib.request, urllib.error
PORT = "8799"; BASE = "http://127.0.0.1:" + PORT; KEY = "test-admin-key"
def call(method, path, body=None, headers=None):
    req = urllib.request.Request(BASE + path, method=method, data=json.dumps(body).encode() if body is not None else None, headers=headers or {})
    try:
        with urllib.request.urlopen(req) as r: return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or b"{}")
class Api(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.mkdtemp()
        env = dict(os.environ, NEXTSTEP_DB=os.path.join(cls.tmp, "t.db"), PORT=PORT, ADMIN_KEY=KEY, HOST="127.0.0.1")
        cls.p = subprocess.Popen([sys.executable, "-m", "app.server"], cwd=os.path.join(os.path.dirname(__file__), ".."), env=env, stdout=subprocess.DEVNULL)
        for _ in range(50):
            try: call("GET", "/api/health"); break
            except Exception: time.sleep(.1)
    @classmethod
    def tearDownClass(cls): cls.p.terminate()
    def test_content(self):
        s, d = call("GET", "/api/config"); self.assertEqual(s, 200); self.assertGreaterEqual(len(d["industries"]), 6)
        s, d = call("GET", "/api/careers"); self.assertGreaterEqual(len(d["careers"]), 24)
        s, d = call("GET", "/api/careers?industry=finance"); self.assertTrue(all(c["industry"] == "finance" for c in d["careers"]))
        s, d = call("GET", "/api/careers/pm"); self.assertEqual(len(d["guide"]["stages"]), 4); self.assertNotIn("quiz", d)
        self.assertEqual(call("GET", "/api/careers/nope")[0], 404); self.assertEqual(call("GET", "/api/careers/BAD%20ID")[0], 400)
    def test_quiz_checked_on_server(self):
        s, d = call("GET", "/api/careers/qa/quiz"); self.assertEqual(len(d["questions"]), 5)
        self.assertNotIn("answer", json.dumps(d))
        q = d["questions"][0]; right = None
        for o in q["options"]:
            _, r = call("POST", "/api/quiz/check", {"question_id": q["id"], "answer": o})
            if r["correct"]: right = o
        self.assertIsNotNone(right)
    def test_progress(self):
        cid = "client-" + "a" * 20
        s, _ = call("PUT", "/api/progress/%s/pm" % cid, {"checked": {"d0": 1, "bad key!": 1}, "best": 9, "mins": 25}); self.assertEqual(s, 200)
        _, d = call("GET", "/api/progress/" + cid); p = d["progress"]["pm"]
        self.assertEqual(p["checked"], {"d0": 1}); self.assertEqual(p["best"], 5)
        self.assertEqual(call("GET", "/api/progress/short")[0], 400)
        self.assertEqual(call("PUT", "/api/progress/%s/nope" % cid, {"checked": {}})[0], 404)
    def test_admin_adds_new_industry_and_career(self):
        h = {"X-Admin-Key": KEY}
        self.assertEqual(call("PUT", "/api/admin/careers", {}, {})[0], 403)
        self.assertEqual(call("PUT", "/api/admin/industries", {"id": "health", "name": "Healthcare"}, h)[0], 200)
        c = {"id": "medcoder", "industry": "health", "name": "Medical Coder", "kw": ["ICD-10"], "guide": {"time": "x", "level": "x", "jobs": [], "days": [], "stages": [], "sources": [], "projects": [], "tools": [], "interview": []},
             "quiz": [{"q": "Q%d" % i, "options": ["a", "b", "c", "d"], "explanation": "e"} for i in range(5)]}
        self.assertEqual(call("PUT", "/api/admin/careers", c, h)[0], 200)
        _, d = call("GET", "/api/careers?industry=health"); self.assertEqual(d["careers"][0]["id"], "medcoder")
        self.assertEqual(call("PUT", "/api/admin/careers", dict(c, industry="ghost"), h)[0], 400)
        self.assertEqual(call("DELETE", "/api/admin/careers/medcoder", None, h)[0], 200)
if __name__ == "__main__": unittest.main()
