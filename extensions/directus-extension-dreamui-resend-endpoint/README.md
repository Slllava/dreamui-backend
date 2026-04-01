# DreamUI Resend Endpoint

Directus endpoint extension that proxies Resend email activity for the admin module.

## Environment variables

- `RESEND_API_KEY` - required
- `RESEND_BASE_URL` - optional, defaults to `https://api.resend.com`
- `RESEND_DEFAULT_LIMIT` - optional, defaults to `20`

## Routes

- `GET /dreamui-resend/status`
- `GET /dreamui-resend/emails`
- `GET /dreamui-resend/emails/:id`
