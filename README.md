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
2. Start API with `npm run dev:api`.
3. Start admin web with `npm run dev:admin`.
4. Start student H5 with `npm run dev:student`.

## API persistence

The API runs with in-memory demo data by default. Set `DATABASE_URL` from
`apps/api/.env.example` to enable PostgreSQL writes for audit logs and
notification logs. Initialize the database schema with `infra/db/schema.sql`.
