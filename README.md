# owner-portal-bff

Backend-for-frontend for the owner web portal and mobile app. Issues owner session tokens and serves the vehicle summary (state of charge, range, software version) with owner preferences layered on top.

- Node 20, TypeScript, Fastify, Jest
- `POST /session`, `GET /vehicles/:vin`

```bash
npm ci && npm run build && npm test
```

Owned by Digital Experience (see CODEOWNERS).
