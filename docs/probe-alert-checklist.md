# Probe and Alert Checklist

## Health Probes

### API

- [ ] Liveness probe configured on `GET /health/live`
- [ ] Readiness probe configured on `GET /health/ready`
- [ ] Probe intervals and failure thresholds tuned to avoid flapping
- [ ] Readiness failure removes pod/instance from traffic

### Dependencies

- [ ] PostgreSQL connectivity alert (failed `SELECT 1`/connection pool exhaustion)
- [ ] Redis connectivity and latency alert

## Queue and Integration Alerts

- [ ] BullMQ failed jobs alert per queue:
  - `order_sync_queue`
  - `token_refresh_queue`
  - `label_generation_queue`
  - `ai_processing_queue`
  - `notification_queue`
- [ ] Queue depth/backlog threshold alerts
- [ ] Retry exhaustion alerts
- [ ] Webhook ingestion error-rate alert
- [ ] `WebhookEvent` unprocessed growth alert
- [ ] `SyncLog` failed/success ratio alert

## Auth and Security Alerts

- [ ] Login failure spike alert
- [ ] OTP verify failure spike alert
- [ ] Rate-limit trigger anomaly alert for auth-sensitive endpoints
- [ ] JWT/auth error-rate alert

## Notification Delivery Alerts

- [ ] Email webhook non-2xx ratio alert
- [ ] SMS webhook non-2xx ratio alert
- [ ] WhatsApp webhook non-2xx ratio alert
- [ ] Notification timeout alert (`NOTIFICATION_WEBHOOK_TIMEOUT_MS` breaches)

## API Reliability and SLO Alerts

- [ ] p95/p99 latency alert (API)
- [ ] 5xx error-rate alert
- [ ] Route-level alerting for:
  - `/api/orders/sync`
  - `/api/webhooks/*`
  - `/api/auth/login`
  - `/api/auth/verify-otp`

## Operational Hygiene

- [ ] Alert routing to on-call + backup
- [ ] Alert deduplication configured
- [ ] Runbook link attached to each pager alert
- [ ] Weekly alert review to remove noisy signals
- [ ] Monthly game-day covering queue failure + dependency outage scenarios
