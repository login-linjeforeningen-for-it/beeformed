<div align="center">

<img src="https://s3.login.no/beehive/img/logo/logo-white-small.svg" alt="Login logo" width="80" height="80" />

<h1>BeeFormed</h1>

<p>
  <img src="https://img.shields.io/badge/TypeScript-fd8738?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Bun-fd8738?style=flat-square&logo=bun&logoColor=white" alt="Bun" />
  <img src="https://img.shields.io/badge/Next.js-fd8738?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-fd8738?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-fd8738?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Fastify-fd8738?style=flat-square&logo=fastify&logoColor=white" alt="Fastify" />
  <img src="https://img.shields.io/badge/PostgreSQL-fd8738?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-fd8738?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Authentik-fd8738?style=flat-square&logo=authentik&logoColor=white" alt="Authentik" />
</p>

</div>

---

A self-hosted form system for creating, sharing, and managing event registrations, built for [Login](https://login.no).

## Features

- **Log in via Authentik** (OAuth2)
- **Create and manage forms**, including field definitions and publication window
- **Share a public form link** at `GET /f/:slug`
- **Anonymous and authenticated submissions** both supported
- **Capacity limits and waitlists**, with optional one-submission-per-user enforcement
- **Confirmation emails** with a QR code attachment for registered and waitlisted submitters
- **QR code scanner** in the admin UI to mark submissions as scanned at the door

## Getting Started

1. **Configure environment**

   Create a `.env` file in the repo root. See [Configuration](#configuration) below or grab the values from 1Password.

2. **Start**

   ```bash
   docker compose up --build
   ```

   | Service  | URL                       |
   |----------|---------------------------|
   | Frontend | http://localhost:8700     |
   | API      | http://localhost:8701/api |

## Configuration

All variables go in the root `.env` file, shared by both services.

| Name                  | Default     | Notes                                                                            |
|-----------------------|-------------|----------------------------------------------------------------------------------|
| `AUTH_URL`            |             | Base URL for your Authentik instance                                             |
| `AUTH_CLIENT_ID`      |             | OAuth2 client ID from Authentik                                                  |
| `AUTH_CLIENT_SECRET`  |             | OAuth2 client secret from Authentik                                              |
| `API_URL`             |             | Internal URL from the frontend container to the API container (e.g. `http://beeformed_api:8080/api`) |
| `NEXT_PUBLIC_API_URL` |             | Public URL of the API, baked into the frontend image at build time               |
| `FRONTEND_URL`        |             | Public URL of the frontend (used by the API for CORS)                            |
| `DB`                  | `beeformed` | Postgres database name                                                           |
| `DB_HOST`             | `postgres`  | Postgres host                                                                    |
| `DB_PORT`             | `5432`      | Postgres port                                                                    |
| `DB_USER`             | `beeformed` | Postgres username                                                                |
| `DB_PASSWORD`         |             | Postgres password                                                                |
| `DISABLE_SMTP`        | `false`     | Set to `true` to skip all email sending and queueing                             |
| `SMTP_HOST`           |             | SMTP server hostname (required unless `DISABLE_SMTP=true`)                       |
| `SMTP_PORT`           | `465`       | SMTP port                                                                        |
| `SMTP_SECURE`         |             | Set to `true` for TLS                                                            |
| `SMTP_FROM`           |             | From address for outgoing emails                                                 |
| `SMTP_NAME`           |             | Display name shown in the From field                                             |
| `SMTP_USER`           |             | SMTP username (optional)                                                         |
| `SMTP_PASSWORD`       |             | SMTP password (optional)                                                         |

Failed email deliveries are queued in `email_queue` and retried automatically.

## Project Structure

- `frontend/` - Next.js frontend
  - `src/app/f/[slug]/` - Public form page
  - `src/app/form/` - Admin form management pages
  - `src/app/submissions/` - Submission management
  - `src/app/qr/` - QR code scanner
  - `src/app/api/auth/` - Auth callback and session routes
- `api/` - Fastify API
  - `src/handlers/` - HTTP handlers
  - `src/utils/email/` - Email sending and queue management
  - `src/config.ts` - Configuration and environment variable loading
  - `src/db.ts` - Database client
- `db/` - Database schema
