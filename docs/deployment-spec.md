# Finel container deployment specification

## Purpose and scope

This specification defines the first reproducible deployment unit for Finel. The
unit contains only the application delivery boundary: Next.js, Spring Boot,
PostgreSQL, and Nginx. It does not provision a server, configure DNS, obtain TLS
certificates, install Tailscale, or introduce n8n/RAG/CI.

The deployment must be reproducible from the repository plus an untracked
production environment file and TLS certificate files.

## Target topology

```text
Internet / Tailscale
        |
    Nginx :80/:443
      |          |
  /api/*      all other paths
      |          |
Spring :8080   Next.js :3000
      |
PostgreSQL :5432
```

Only Nginx publishes host ports. PostgreSQL, Spring Boot, and Next.js communicate
on the private Compose network. `/internal/revalidate` is a Next.js route, not a
Spring API route; Nginx must return `403` for every external `/internal/` request.
Spring calls that route directly over the Compose network.

## Repository deliverables

| Path | Responsibility |
| --- | --- |
| `frontend/Dockerfile` | Builds and runs the production Next.js server without copying development files or `.env` files into the image. |
| `docker-compose.yml` | Defines Nginx, frontend, backend, PostgreSQL, their private network, named database volume, health/start ordering, and only ports 80/443. |
| `nginx/conf.d/finel.conf` | HTTPS redirect, TLS virtual host, proxy routing, forwarding headers, upload size limit, and `/internal/` denial. |
| `.dockerignore` | Excludes repository secrets, Git metadata, build outputs, dependencies, IDE files, and unrelated local artifacts from the Compose build context. |
| `backend/.dockerignore` | Excludes backend secrets, Gradle output, and local artifacts from the backend image context. |
| `frontend/.dockerignore` | Excludes frontend secrets, dependencies, Next build output, and local artifacts from the frontend image context. |
| `frontend/.env.production.example` | Documents frontend production variable names and safe example values; contains no secret. |
| `deploy/README.md` | Documents server prerequisites, first deployment, update, rollback, logs, backup, and restore verification. |

## Compose services and network rules

### `postgres`

- Uses a pinned PostgreSQL major image and a named volume mounted at
  `/var/lib/postgresql/data`.
- Reads only `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` from the
  untracked root `.env`.
- Has no `ports` entry. Its only consumer is `finel-backend`.
- Provides a `pg_isready` health check.

### `finel-backend`

- Builds from `backend/Dockerfile` using `backend/` as the build context.
- Has no `ports` entry and is addressed by the Compose service hostname
  `finel-backend`.
- Receives DB/JWT/mail/Cloudinary settings, `FRONTEND_ORIGIN`, cookie settings,
  Flyway setting, `NEXT_REVALIDATE_URL`, and `REVALIDATE_SECRET`.
- Uses `DB_URL=jdbc:postgresql://postgres:5432/${POSTGRES_DB}`; `localhost` is
  never used for container-to-container traffic.
- Uses `NEXT_REVALIDATE_URL=http://finel-frontend:3000/internal/revalidate`.
- Keeps `ddl-auto=validate`. Flyway activation is an explicit deployment choice:
  `true` only for a new Flyway-owned database or an already approved baseline.

### `finel-frontend`

- Builds from `frontend/Dockerfile` using `frontend/` as its build context.
- Has no `ports` entry and is addressed as `finel-frontend:3000`.
- Receives `REVALIDATE_SECRET` at runtime only.
- Receives `NEXT_PUBLIC_API_BASE_URL=/api`, `SERVER_API_BASE_URL=http://finel-backend:8080`,
  and `NEXT_PUBLIC_SITE_URL=https://<public-domain>` as build arguments because
  Next.js can inline or evaluate these during `next build`.
- `NEXT_PUBLIC_API_BASE_URL` must never contain a Docker hostname: browser code
  cannot resolve the private Compose DNS name.

### `nginx`

- Is the only service with host bindings: `80:80` and `443:443`.
- Mounts the repository-managed Nginx configuration read-only.
- Mounts TLS certificate files from the server-local ignored `nginx/certs/`
  directory and serves ACME HTTP-01 challenge files from server-local
  `nginx/acme-challenge/`.
- Proxies `/api/` to `http://finel-backend:8080`; all normal site paths to
  `http://finel-frontend:3000`; and returns `403` before proxying `/internal/`.

## Nginx behavior

1. The port 80 server serves `/.well-known/acme-challenge/` from the ACME mount,
   then redirects every other request to the equivalent HTTPS URL.
2. The port 443 server uses the server-local certificate and key.
3. It sets `client_max_body_size 10m` for product-image upload requests.
4. Proxied requests preserve `Host`, the client IP chain, original scheme, and
   upgrade/connection headers.
5. Neither Spring Actuator nor `/internal/*` is intentionally public. Actuator
   has no public proxy location; `/internal/*` is explicitly denied.

## Production environment contract

The server-local root `.env` is never committed. It supplies Compose interpolation
and backend/PostgreSQL runtime variables. Required categories are:

| Category | Variables | Consumer |
| --- | --- | --- |
| Database | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | PostgreSQL, Spring |
| Public routing | `PUBLIC_SITE_URL`, `FRONTEND_ORIGIN` | Compose build, Spring CORS |
| Cookie/auth | `JWT_SECRET`, `AUTH_COOKIE_SECURE=true`, `AUTH_COOKIE_DOMAIN` | Spring |
| External services | `MAIL_*`, `CLOUDINARY_*` | Spring |
| Migration | `SPRING_FLYWAY_ENABLED` | Spring |
| Cache invalidation | `NEXT_REVALIDATE_URL`, `REVALIDATE_SECRET` | Spring; secret also frontend runtime |

`PUBLIC_SITE_URL` is a public HTTPS URL. `FRONTEND_ORIGIN` must exactly match its
origin. `AUTH_COOKIE_DOMAIN` remains blank for a single-host deployment.

## Cache invalidation contract

This behavior already exists in application code and is configured, not rebuilt:

1. Product/category mutation commits successfully.
2. Spring's `AFTER_COMMIT` listener posts to `NEXT_REVALIDATE_URL` with
   `x-revalidate-secret`.
3. Next validates the secret and expires relevant product/category tags and paths.
4. A timeout, network error, or non-2xx response logs a warning and does not undo
   the successful mutation.

The initial deployment verifies one successful mutation and an external `403` for
the same `/internal/revalidate` path through Nginx.

## Operational procedures and acceptance criteria

`deploy/README.md` must document these exact operations:

- first deployment: clone, create root `.env`, provide certificates, then
  `docker compose up -d --build`;
- update: fetch the intended Git revision, build/start, and inspect status/logs;
- rollback: check out the previous known-good revision and rerun Compose build/start;
- backup: run `pg_dump` from the PostgreSQL container to a host backup location;
- restore verification: restore a dump into an empty disposable PostgreSQL
  instance, then start the backend with that database and confirm it validates;
- sensitive-data rule: never copy `.env`, certificate private keys, cookies, or
  production logs into Git or issue reports.

The implementation is accepted when the following are demonstrated in a safe
deployment environment:

- `docker compose config` resolves successfully with the production `.env`;
- `docker compose up -d --build` starts all services;
- public traffic reaches Nginx, `/api/*` reaches Spring, and normal paths reach Next;
- login, CSRF, admin product/category mutations, Cloudinary signing/upload, and
  inquiry SMTP flow work;
- cache invalidation occurs after a successful mutation, but a forced frontend
  invalidation failure does not fail the mutation;
- database data persists through `docker compose restart`;
- only 80/443 are externally reachable and `/internal/*` is `403` externally;
- logs do not contain secret values;
- backup and restore verification succeeds.
