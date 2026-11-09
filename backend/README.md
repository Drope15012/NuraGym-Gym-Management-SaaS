# NuraGym Backend

Express + MySQL API for gyms, members, memberships, payments, and class bookings.

## Run locally

```bash
npm install
npm run dev
```

The API runs at `http://localhost:5000`.

The server connects to MySQL using `DB_*` values from `.env` and creates missing tables from `database/schema.sql` on startup.

The first startup also creates the local administrator account configured by `ADMIN_ID` and `ADMIN_PASSWORD`.

## Useful endpoints

- `GET /health`
- `GET /api/health`
- `POST /api/gyms`
- `POST /api/users/register`
- `POST /api/users/login`
- `POST /api/onboarding/batch` (admin only; accepts 10 to 100 gyms in one transaction)
- `GET /api/memberships`
- `GET /api/payments`
- `GET /api/classes`
