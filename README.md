# Palm Tree Motors owner portal

Fastify backend for the fictional Palm Tree Motors marketing site and owner portal. Issues owner session tokens and serves vehicle summaries with owner preferences layered on top.

- Node 20, TypeScript, Fastify, Jest
- `/` marketing site, `/owner` demo owner portal
- `POST /session`, `GET /vehicles/:vin`, `GET /healthz`

## Run locally

```bash
npm ci
npm run build
npm test
npm start
```

Open `http://localhost:3001` for the site, or `http://localhost:3001/owner` for the portal. The portal form is prefilled with demo owner `owner_demo`, VIN `50EA1TEA0RA000001` and region `NA`. Submitting it requests a token from `/session` and then the vehicle from `/vehicles/:vin`. Without `FLEET_API_URL`, this VIN has local demo data including battery, range, odometer, charging history and next service. Set `FLEET_API_URL` to use an external fleet service instead; the BFF requests `${FLEET_API_URL}/vehicles/:vin/summary`.

`APP_VERSION` and `APP_COLOR` optionally override the version and color in `/healthz` and the footer badge. By default, the package version and `stable` are shown. `PORT` defaults to `3001`. Set `SESSION_SIGNING_KEY` for a non-demo deployment.

## Run with Docker

```bash
docker build -t palmtree-owner-portal .
docker run --rm -p 3001:3001 -e APP_VERSION=5.3.1 -e APP_COLOR=stable palmtree-owner-portal
```

Visit `http://localhost:3001` or request `http://localhost:3001/healthz`. To connect a fleet service from the container, pass `FLEET_API_URL` with `-e` and make sure that address is reachable from inside the container.

Owned by Digital Experience (see CODEOWNERS). Palm Tree Motors is a fictional company used for demonstration purposes.
