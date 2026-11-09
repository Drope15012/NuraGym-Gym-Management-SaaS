# NuraGym Architecture

NuraGym is a React, Express, and MySQL SaaS platform.

- Frontend: React + Vite dashboard.
- Backend: Express REST API.
- Database: MySQL 8+ for runtime data.
- Schema and seed SQL: `database/schema.sql` and `database/seed.sql`.
- Local runtime: Node.js backend, MySQL database, and Vite frontend.

Core tenant isolation is handled through the `gym` field on users, memberships, payments, and classes.
