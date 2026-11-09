# API Reference

Base URL: `http://localhost:5000/api`

## Health

- `GET /health` (server-only check)
- `GET /api/health` (server and MySQL check)

## Auth

- `POST /users/register`
- `POST /users/login`
- `GET /users/me`

## Gyms

- `POST /gyms`
- `GET /gyms`
- `GET /gyms/:id`

## Operations

- `GET /memberships`
- `POST /memberships`
- `GET /payments`
- `POST /payments`
- `GET /classes`
- `POST /classes`
- `POST /classes/:id/book`
