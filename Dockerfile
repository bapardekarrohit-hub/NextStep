FROM python:3.12-slim
WORKDIR /srv
COPY app ./app
COPY web ./web
COPY seed ./seed
ENV PORT=8000 NEXTSTEP_DB=/data/nextstep.db
VOLUME /data
EXPOSE 8000
CMD ["python", "-m", "app.server"]
