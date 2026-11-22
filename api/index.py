import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ.setdefault("NEXTSTEP_DB", "/tmp/nextstep.db")
from app import db
from app.server import H
db.init()

class handler(H):
    pass
