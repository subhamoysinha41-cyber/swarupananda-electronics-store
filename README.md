# SWARUPANANDA ELECTRONICS

Responsive mobile storefront and service API for SWARUPANANDA ELECTRONICS. Local project targets MongoDB, with optional Cloudinary uploads, Razorpay payments, and Azure Blob Storage enhancement.

## Local setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`. Configure `JWT_SECRET` to a unique long value for persistent local sessions. Keep provider credentials out of source control.
2. Start local dependencies with `docker compose up -d mongodb azurite`.
3. Install and run the API: `npm --prefix services/mobile-store-api install`, then `npm --prefix services/mobile-store-api run dev`. The API listens on `http://localhost:3001`.
4. Install and build the frontend: `npm --prefix services/mobile-store-web install`, then `npm --prefix services/mobile-store-web run build`.
5. Run checks with `npm test` and `npm run build`.

The Vite dev server is configured to bind on all interfaces and allow the VS Code preview iframe. The API base URL can be set with `VITE_API_BASE_URL`; an empty value uses same-origin `/api` requests.

## GitHub Pages storefront

Pushing to `main` builds and deploys the static frontend through GitHub Pages. On a new repository, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. The frontend uses its mock API client when `VITE_API_BASE_URL` is unset, so the published site is a demo storefront; GitHub Pages does not run the Node API or MongoDB. User accounts, service requests, and orders are not backed by a production database in this deployment.

For persistent data and real API operations, deploy the API separately and set `VITE_API_BASE_URL` for the Pages build. Do not put database credentials, JWT secrets, or payment secrets in frontend variables.

## Render API target (not deployed)

- API: Node web service rooted at `services/mobile-store-api`, start command `npm start`, bind to `process.env.PORT`, configure `DATABASE_URL`, `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, and provider secrets as needed.
- Frontend: static site rooted at `services/mobile-store-web`, build command `npm run build`, publish directory `dist`, set `VITE_API_BASE_URL` to the API service URL, and enable SPA fallback to `/index.html`.
