# MobileStore frontend

Responsive React + TypeScript storefront scaffold in `services/mobile-store-web`.

## Local development

```powershell
npm --prefix services/mobile-store-web install
npm --prefix services/mobile-store-web run dev
```

By default the UI uses the in-memory demo client. Set `VITE_API_BASE_URL` to the API origin ending in `/api` (for example `https://api.example.com/api`) to use the typed Axios client. For live Razorpay checkout, also set the public `VITE_RAZORPAY_KEY_ID`; payment signatures must be verified by the API. Vite reads these variables at build time.

## Build and static hosting

```powershell
npm --prefix services/mobile-store-web run build
```

The static output is `services/mobile-store-web/dist`. Configure the static host to serve `index.html` as the fallback for unknown routes so `/cart`, `/account`, `/create-account`, `/services`, and `/admin` load through the SPA router. Set the API base URL in the static host's build environment before building. This scaffold does not deploy or provision hosting.

## Preview states

In development, the bottom-right Preview menu switches between data, loading, empty, and error states. The selected state is also available as `?previewState=data|loading|empty|error`.
