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

For a fresh application database, or after completing the Neon migration below,
start the complete stack:

```bash
docker compose config
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 nginx finel-frontend finel-backend postgres
```

Only Nginx publishes ports 80 and 443. Do not add public `ports` mappings for
PostgreSQL, Spring Boot, or Next.js.

## Neon to home-server migration

This is a one-time copy, not continuous replication. It does not delete the
Neon database. Keep Neon as the rollback source until the migration has been
stable for at least two weeks.

### Preconditions

- Complete a rehearsal restore before the production cutover.
- Use a PostgreSQL 18 `pg_dump` client and Neon’s direct/unpooled TLS URL.
- Confirm the target database settings (name, UTF-8 encoding, locale/collation,
  timezone) and required extensions match the source.
- Store the archive under `deploy/migrations/`; that directory is Git-ignored
  and must not be retained as an unencrypted long-term backup.
- Keep `SPRING_FLYWAY_ENABLED=false`. Do not run Flyway baseline or clean as
  part of this migration.

### Restore order

Do not run `docker compose up -d` yet: the backend would connect before the
database has been restored. The `finel-postgres-18-data` volume is deliberately
new; never reuse a PostgreSQL 16 data volume with PostgreSQL 18. PostgreSQL
18 mounts this volume at `/var/lib/postgresql` (not the legacy
`/var/lib/postgresql/data` path).

1. Freeze every Neon write path: admin changes, inquiry submissions, scheduled
   jobs, webhooks, and running backend instances. Drain in-flight requests.
2. Record source row counts, sequence values, and the final dump checksum. Take
   a Neon snapshot if available.
3. Start only the database, which initializes the empty database named by
   `POSTGRES_DB`:

   ```bash
   docker compose up -d postgres
   docker compose ps postgres
   ```

4. Copy the final custom-format archive into the PostgreSQL container, then
   restore it. Use the application database role for the restore, or grant that
   role the required database, schema, table, and sequence privileges afterward.

   ```bash
   docker cp deploy/migrations/finel-final.dump "$(docker compose ps -q postgres):/tmp/finel-final.dump"
   docker compose exec -T postgres sh -c 'pg_restore --dbname="$POSTGRES_DB" --username="$POSTGRES_USER" --no-owner --no-privileges --exit-on-error --single-transaction /tmp/finel-final.dump'
   docker compose exec -T postgres sh -c 'psql --dbname="$POSTGRES_DB" --username="$POSTGRES_USER" --command="ANALYZE;"'
   ```

5. Compare source and target counts, ID/sequence ranges, foreign keys, indexes,
   and extension availability. Start the backend only after JPA validation
   succeeds; then start frontend and Nginx.

If restore or validation fails before home-server writes are enabled, stop the
new stack and keep traffic on Neon. After home-server writes begin, do not
simply switch back to Neon because the data sets will diverge.

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
