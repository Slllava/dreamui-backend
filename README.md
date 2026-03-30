# Directus for Railway

This folder contains a minimal self-hosted Directus setup prepared for Railway.

## Local development

Directus 11 in this project should be run with Node 22.

```bash
nvm use 22
cp .env.example .env
npm install
npm run start
```

## Railway deploy

1. Create a Railway project and add a PostgreSQL service.
2. Set the app service to use Node 22.
3. Add the variables from `.env.example` to the Railway app service.
4. Set `PUBLIC_URL` to your Railway app URL.
5. Deploy. The `start` script runs `directus bootstrap` before `directus start`, so the schema and initial admin user are created automatically on first boot.

## Notes

- This repository was prepared on March 30, 2026 with `directus@11.17.1`.
- If you want to run it locally, reinstall dependencies under Node 22 so native modules are built correctly.
