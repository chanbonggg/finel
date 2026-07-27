# Finel deployment runbook

This runbook deploys the repository-managed Compose stack. It does not install
Docker, configure DNS, or issue TLS certificates; complete those server tasks
before the first launch.

## Server inputs

1. Clone the intended Git revision on the server.
2. Copy `.env.production.example` to the repository-root `.env` and replace every
   placeholder with production values. Keep `SPRING_FLYWAY_ENABLED=false` for an
   existing database unless its Flyway baseline has been separately approved.
3. Place the certificate chain and private key at:

   ```text
   nginx/certs/fullchain.pem
   nginx/certs/privkey.pem
   ```

   These files are ignored by Git. If using ACME HTTP-01, put challenge files
   under `nginx/acme-challenge/`; port 80 serves only that path before redirecting
   all other traffic to HTTPS.

## First deployment

```bash
docker compose config
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 nginx finel-frontend finel-backend postgres
```

Only Nginx publishes ports 80 and 443. Do not add public `ports` mappings for
PostgreSQL, Spring Boot, or Next.js.

## Update and rollback

To update, select the intended revision, then rebuild and restart the services.

```bash
git fetch --all --prune
git checkout <intended-revision>
docker compose up -d --build
docker compose ps
```

To roll back, check out the last known-good revision and repeat the same Compose
command. The named PostgreSQL volume is retained; application rollback does not
reverse database migrations. Restore a verified database backup if a database
rollback is required.

## Backup and restore verification

Run this on the server and copy the created dump to encrypted storage outside the
server. Replace the output filename with the current date.

```bash
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > deploy/backups/finel-YYYY-MM-DD.dump
```

Create `deploy/backups/` with permissions appropriate for database backups; it is
ignored by Git. At least once, verify recovery in an empty disposable PostgreSQL
instance using `pg_restore`, then start the backend against that restored database
and confirm JPA validation succeeds. Do not test a restore against the production
volume.

## Deployment checks

- Confirm public pages and `/api/*` work through the HTTPS hostname.
- Confirm external `/internal/revalidate` returns `403`.
- Test login, CSRF-protected admin mutations, image upload, and inquiry mail.
- Edit a product/category and confirm a cache-invalidation success or failure log;
  an invalidation failure must not fail the already committed mutation.
- Run `docker compose restart`, then confirm existing data remains.
- Review logs without copying secrets, cookies, tokens, or customer data into
  tickets or Git.
