# Teaching Evaluation Platform

Monorepo scaffold for a multi-tenant teaching evaluation platform.

## Apps

- `apps/api`: NestJS API
- `apps/admin-web`: React admin shell
- `apps/student-h5`: React student shell

## Packages

- `packages/shared`: shared types, domain helpers, response contracts

## Next steps

1. Install dependencies with `npm install`.
2. Start PostgreSQL and Redis with `npm run infra:up`.
3. Start API with `npm run dev:api`.
4. Start admin web with `npm run dev:admin`.
5. Start student H5 with `npm run dev:student`.

The API can also run without PostgreSQL/Redis for demo development; in that
mode core business data is in memory and resets when the API process restarts.

## Student H5 demo flow

1. Start the API: `npm run dev:api`.
2. Create `apps/student-h5/.env` from `apps/student-h5/.env.example`.
3. Start the student app: `npm run dev:student`.
4. Open the Vite URL printed by the student app.
5. If the API has no in-memory tasks yet, click `初始化演示数据` in the student
   page, or run `npm run demo:seed`.

Expected student demo environment:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_TENANT_ID=demo
VITE_USER_ID=u-student-1
```

## API persistence

The API runs with in-memory demo data by default. Set `DATABASE_URL` from
`apps/api/.env.example` to enable PostgreSQL writes for audit logs and
notification logs. Initialize the database schema with `infra/db/schema.sql`.

For local development, `infra/docker-compose.yml` starts PostgreSQL 16 and
Redis 7. PostgreSQL automatically mounts `infra/db/schema.sql` on first
container initialization. If the schema changes after the first boot, recreate
the database volume before reinitializing.

## API response contract

All API responses use `code/message/data/traceId`. If a request includes the
`x-trace-id` header, the API echoes it in successful and error envelopes;
otherwise the API generates a trace id. Unhandled errors are normalized through
the global exception filter.

## Current API surface

- Auth: `POST /api/auth/login`, `GET /api/auth/sso/callback`
- SSO callbacks normalize CAS/OIDC/OAuth2 payloads through provider adapters
  before issuing platform sessions.
- IAM: `GET /api/iam/access`, `GET /api/iam/can-access`
- Master data: `GET /api/master-data/teachers|students|courses`
- Master data import: `POST /api/master-data/teachers/import`,
  `POST /api/master-data/students/import`, `POST /api/master-data/courses/import`
- External master data sync: `POST /api/master-data/sync-jobs`
- Import jobs: `GET /api/master-data/import-jobs`
- Text analysis: `POST /api/analysis/texts/analyze`,
  `POST /api/analysis/summaries`, `GET /api/analysis/summaries`
- Object storage abstraction: `POST /api/storage/upload-targets`,
  `GET /api/storage/objects`, `DELETE /api/storage/objects/:objectId`
- Export jobs: `POST /api/exports/reports`, `GET /api/exports`
- Teacher workbench: `GET /api/teacher-workbench/teachers/:teacherId/results`,
  `POST /api/teacher-workbench/self-evaluations`,
  `GET /api/teacher-workbench/teachers/:teacherId/growth-archive`
- Supervision: `POST /api/supervision/observation-tasks`,
  `GET /api/supervision/observation-tasks`, `POST /api/supervision/observations`,
  `GET /api/supervision/observations/:observationId`
- Parent feedback: `POST /api/parent-feedback`, `GET /api/parent-feedback`,
  `POST /api/parent-feedback/:feedbackId/handle`
- Composite analysis: `GET /api/composite-analysis/teachers/:teacherId/profile`
- Templates, tasks, filling, reports, improvements, notification logs, and audit
  logs are implemented as tenant-scoped demo services.
- Demo seed: `POST /api/eval/demo/seed?tenantId=demo`

## Useful scripts

- `npm test`: run shared and API test suites.
- `npm run build`: build shared package, API, admin web, and student H5.
- `npm run demo:seed`: initialize the in-memory demo evaluation task through the
  running API. Override with `API_BASE_URL` and `TENANT_ID` if needed.
