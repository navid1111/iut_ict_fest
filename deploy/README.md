# VPS Deployment

This stack is deployable with Docker Compose on a VPS. In production mode, only
ports `80` and `443` are public. Grafana is served under `/grafana`, the backend
is served from `/`, and Prometheus/Loki/Tempo stay private on the Docker network.

## First Deploy

1. Point your DNS `A` record to the VPS IP.
2. Install Docker and Docker Compose on the VPS.
3. Copy `.env.production.example` to `.env`.
4. Set `PUBLIC_HOST`, `ACME_EMAIL`, and a strong `GRAFANA_ADMIN_PASSWORD`.
5. Start the stack:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Public URLs

- Backend: `https://YOUR_DOMAIN/health`
- API: `https://YOUR_DOMAIN/api/users`
- Grafana: `https://YOUR_DOMAIN/grafana/`

## Optional Public Telemetry Ingest

If apps outside the Docker network need to send telemetry to this VPS, also load
the public telemetry override:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.telemetry-public.yml up -d --build
```

This publishes:

- OTLP gRPC: `YOUR_DOMAIN:4317`
- OTLP HTTP: `https://YOUR_DOMAIN:4318` if you terminate TLS separately, or `http://YOUR_DOMAIN:4318` directly from the collector

For most deployments, keep `4317` and `4318` closed publicly and send telemetry
from apps on the same Docker network.

## Health Checks

```bash
curl -I https://YOUR_DOMAIN/health
curl -I https://YOUR_DOMAIN/grafana/api/health
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

Prometheus targets should show `up` inside Grafana or by execing from the VPS.
