# Operations Runbook

## Scope

This runbook covers production incident handling for the Agencyfic OMS API and web stack.

## Service Endpoints

- API liveness: `GET /health/live`
- API readiness: `GET /health/ready`
- API default health: `GET /health`

## Severity Levels

- **SEV-1**: Full outage, data corruption risk, or checkout/order sync fully blocked.
- **SEV-2**: Major feature unavailable (sync delays, notifications failing broadly).
- **SEV-3**: Partial degradation with workaround.

## Incident Workflow

1. **Acknowledge**
   - Confirm incident in monitoring.
   - Create incident channel/ticket.
2. **Stabilize**
   - Check `/health/ready` and dependency statuses (DB/Redis).
   - Pause risky deployments or migrations.
   - If queue backlog is growing, scale worker replicas.
3. **Diagnose**
   - Review API logs, queue failures, and webhook ingestion errors.
   - Verify linked account status transitions and `SyncLog` failure messages.
   - Validate notification webhook provider responses (email/sms/whatsapp endpoints).
4. **Mitigate**
   - Restart unhealthy workloads.
   - Roll back latest release if regression suspected.
   - Apply temporary rate-limit tightening on auth-sensitive endpoints when needed.
5. **Recover**
   - Confirm probes healthy for sustained period.
   - Validate critical user journeys:
     - login + OTP verify
     - order sync trigger
     - webhook-driven sync
     - notification dispatch
6. **Close**
   - Publish incident summary and timeline.
   - Capture action items with owners and due dates.

## Common Failure Playbooks

### 1) Readiness failing (DB false / Redis false)

- Verify environment variables and connectivity:
  - `DATABASE_URL`
  - `REDIS_URL`
- Confirm PostgreSQL accepts `SELECT 1`.
- Confirm Redis responds to `PING`.
- If DB migration mismatch is detected, run migration procedure and recheck readiness.

### 2) Queue backlog or repeated worker failures

- Inspect worker logs for `failed` jobs and retry exhaustion.
- Confirm Redis latency and connection stability.
- Check malformed webhook payload spikes.
- Temporarily reduce enqueue rate (scheduler interval / upstream webhook pressure) and scale workers.

### 3) Marketplace sync degradation

- Check `WebhookEvent` unprocessed volume and recent errors.
- Inspect `SyncLog` for platform-specific failures.
- Verify linked accounts still `syncEnabled` and not in persistent `error` session state.

### 4) Notification delivery degradation

- Check configured webhook URLs:
  - `EMAIL_WEBHOOK_URL`
  - `SMS_WEBHOOK_URL`
  - `WHATSAPP_WEBHOOK_URL`
- Validate provider response codes and timeout behavior (`NOTIFICATION_WEBHOOK_TIMEOUT_MS`).
- Confirm fallback persistence in `NotificationLog`.

## Escalation Matrix

- **Primary on-call**: API/platform engineer
- **Secondary on-call**: infra/SRE engineer
- **Escalate to product owner** for SEV-1 within 15 minutes.

## Post-Incident Review Template

- Incident ID:
- Start time / End time:
- Impacted capabilities:
- Root cause:
- Immediate mitigation:
- Long-term preventive actions:
- Owners and deadlines:
