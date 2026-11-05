# Finel deployment runbook

This runbook deploys the repository-managed Compose stack behind Cloudflare
Tunnel. It does not install Docker, configure DNS, create the Tunnel, or
configure its public hostnames; complete those server tasks before the first
launch.

## Server inputs

1. Clone the intended Git revision on the server.
2. Copy `.env.production.example` to the repository-root `.env` and replace every
   placeholder with production values. Keep `SPRING_FLYWAY_ENABLED=false` for an
   existing database unless its Flyway baseline has been separately approved.
3. Configure the Tunnel public hostname (for example, `www.finel.co.kr`) to
   target `http://127.0.0.1:8081`. Cloudflare terminates TLS; do not add local
   certificate files or open public ports 80/443 for this stack.

## First deployment

For a fresh application database, or after completing the Neon migration below,
start the complete stack:

```bash
docker compose config
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 nginx finel-frontend finel-backend postgres
```

Only Nginx publishes `127.0.0.1:8081`, the Cloudflare Tunnel origin. Do not add
public `ports` mappings for PostgreSQL, Spring Boot, or Next.js.

## Catalog storage and schema rollout

- Check the target Flyway history and approve the additive V2 migration before starting the new backend. The backend uses `ddl-auto=validate` and requires the new product columns and `CatalogFile` table. The Neon smoke stack keeps Flyway off and requires a compatible test schema.
- The backend uses the `finel-catalog-data` volume at `/var/lib/finel/catalogs`. The image prepares the mount for its non-root `finel` user. Keep one backend writer per volume. The Neon smoke stack uses a separate volume. Preserve these volumes during container replacement.
- Nginx retains the 10 MiB request ceiling. Catalog chunks use up to 8 MiB each and completion can take up to 35 seconds for PDF inspection. The file response disables Nginx buffering and supports Range reads. Verify the full public proxy path with a representative 1 GB PDF before enabling the UI.
- Provision space for retained PDFs, up to four active uploads of 1 GB each, and temporary chunks. The application keeps a 256 MiB free-space reserve. Temporary sessions expire after one hour and are discarded on backend restart.
- For a consistent backup, pause catalog writes, take a PostgreSQL dump, and archive the volume's `files/` directory together. Restore both into isolated storage, retain the `finel` user's access, compare file counts and sizes with `CatalogFile`, and verify product references plus `200` and `206` downloads. Keep the database and files from the same backup point.
- A canceled product edit can leave a valid catalog available for reuse. After backup, an operator can audit unreferenced `CatalogFile` rows against `Product.catalogFileId`, verify no editor is using the candidate, and retire the metadata and its matching file together. Also reconcile any file without metadata after a crash between the file move and database commit. The app cleans up temporary files automatically. It never deletes a shared catalog when one product is deleted.

### Applying V2 on the server

Confirm the target database and take and verify a backup using the procedure below. In that database, check `SELECT to_regclass('public.flyway_schema_history');`. If the table exists, check `SELECT version, type, success FROM public.flyway_schema_history ORDER BY installed_rank;`. Proceed with a normal migration when the history shows a successful V1 and V2 is pending.

An existing populated schema without a history table needs a separately approved version 1 baseline. Compare its schema with V1 and test the baseline and V2 upgrade against a restored backup first. Keep automatic baselining off in the normal server profile.

With the approved revision checked out, build the images before the maintenance window. Start the backend first and verify its startup logs, health check, and successful version 2 history entry before switching the frontend. Use the following commands only for the confirmed V1-to-V2 path.

```bash
docker compose build finel-backend finel-frontend
SPRING_FLYWAY_ENABLED=true docker compose up -d --no-deps finel-backend
docker compose logs --tail=100 finel-backend
docker compose exec -T finel-backend curl -fsS http://localhost:8080/actuator/health
```

After those checks pass, start the new frontend with `docker compose up -d --no-deps finel-frontend` and recreate Nginx with `docker compose up -d --no-deps --force-recreate nginx` so it loads the revised configuration and resolves the current upstream containers. Verify the public and administrator flows over the HTTPS hostname. If the backend does not start, stop the rollout and investigate the migration or validation error before switching the frontend.

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

- Confirm public pages and `/api/*` work through the Cloudflare HTTPS hostname.
- Confirm external `/internal/revalidate` returns `403`.
- Test login, CSRF-protected admin mutations, image upload, and inquiry mail.
- Edit a product/category and confirm a cache-invalidation success or failure log;
  an invalidation failure must not fail the already committed mutation.
- Run `docker compose restart`, then confirm existing data remains.
- Review logs without copying secrets, cookies, tokens, or customer data into
  tickets or Git.
