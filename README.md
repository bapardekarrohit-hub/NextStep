# NextStep

A career guidance website for any industry. Upload a resume, see which careers fit, then follow a step-by-step guide with sources, projects, a quiz and study tools.

No hardcoded career content: everything comes from a database through a small API.

## Run it
```
python -m app.server            # needs only Python 3.9+, no packages (Windows: double-click start.bat)
# open http://localhost:8000
```
Environment: `PORT` (8000), `NEXTSTEP_DB` (path to the SQLite file), `ADMIN_KEY` (turns on the admin API).
Tests: `python -m unittest discover tests`

## Structure
```
app/db.py        SQLite schema, seeding and upserts (swap for Postgres later)
app/server.py    JSON API + static file server (gzip, ETag caching, rate limits, security headers)
seed/data.json   Starting content: 6 industries, 24 careers, guides and quizzes
web/             index.html, css/app.css, js/app.js, js/fx.js, js/theme.js
tools/           Scripts used to generate seed/data.json and the web files
tests/           API tests
```

## API
| Method and path | What it does |
|---|---|
| GET /api/config | Industries, skill aliases, sample resume text |
| GET /api/careers?industry=id | Career list (name, summary, skills) |
| GET /api/careers/{id} | Full career: roadmap, sources, projects, flashcards |
| GET /api/careers/{id}/quiz | 5 random questions, options shuffled, answers hidden |
| POST /api/quiz/check | `{question_id, answer}` returns correct answer and explanation |
| GET /api/progress/{client_id} | Saved progress for an anonymous browser id |
| PUT /api/progress/{client_id}/{career_id} | Save ticked steps, best quiz score, focus minutes |
| PUT /api/admin/industries | Add or edit an industry (header `X-Admin-Key`) |
| PUT /api/admin/careers | Add or edit a career with its guide and quiz |
| DELETE /api/admin/careers/{id} | Remove a career |

## Add a new industry without touching code
```
curl -X PUT localhost:8000/api/admin/industries -H "X-Admin-Key: $ADMIN_KEY" -d '{"id":"health","name":"Healthcare","blurb":"Care and clinical support"}'
curl -X PUT localhost:8000/api/admin/careers -H "X-Admin-Key: $ADMIN_KEY" -d @new_career.json
```
`new_career.json` follows the shape of any entry in `seed/data.json` (quiz options: correct answer first, the API shuffles them). New content appears on the website straight away.

## Deploy
Any host that runs Docker or Python works (Render, Railway, Fly.io, a VPS). Mount a persistent disk at `/data` so progress is kept. Set `ADMIN_KEY` to a long random value. Behind a proxy, it reads `X-Forwarded-For` for rate limiting.

## Privacy and limits
- The resume is read in the browser and never sent to the server. Only the career list is fetched.
- Progress is stored against a random id kept in the browser, with no login. Clearing site data creates a new id. Add accounts when you need cross-device sync.
- PDF and Word readers load from cdnjs only when someone uploads such a file.
- SQLite suits a single server. Move to Postgres by replacing `app/db.py` when you need several servers.
