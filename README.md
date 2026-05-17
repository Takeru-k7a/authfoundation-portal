# AuthFoundation Portal

Nuxt scaffold for standalone authentication screens.

The current AuthFoundation API still owns the OIDC flow and accepts form posts. This UI keeps the screens separate while matching the existing API contract.

## Screens

- `/`
- `/login`
- `/signup`
- `/terms`
- `/callback?code=...&state=...`

`/` starts the OIDC authorization code flow with PKCE. It uses `client_id=00000000000000000000000000000000` by default, stores `state`, `nonce`, and `code_verifier` in `sessionStorage`, calls the AuthFoundation API `/authorize` endpoint, stores the returned authorization `session_id` in `localStorage`, and then moves to the returned screen URL.

`/callback` validates `state`, exchanges the returned authorization code at `/token`, and stores the returned tokens in `sessionStorage`. This is a scaffolding behavior for development; production authorization state should be tightened before storing long-lived tokens in the browser.

## Local Run

```powershell
cd D:\portfolio\authfoundation-portal
npm install
npm run dev
```

When the UI and API are served from the same origin, leave `NUXT_PUBLIC_AUTH_API_BASE` empty.

When using a separate API origin:

```powershell
$env:NUXT_PUBLIC_AUTH_API_BASE="https://auth.osolab-auth.jp"
$env:NUXT_PUBLIC_AUTH_CLIENT_ID="00000000000000000000000000000000"
$env:NUXT_PUBLIC_AUTH_SCOPE="openid profile email"
npm run dev
```

For a separate origin, AuthFoundation will also need CORS, `Access-Control-Expose-Headers: Location`, and cookie settings because login uses the auth session cookie.

## Existing API Contract

### Start Authorization

- `GET /authorize`
- Query: `response_type=code`
- Query: `client_id`
- Query: `redirect_uri`
- Query: `state`
- Query: `scope`
- Query: `code_challenge_method=S256`
- Query: `code_challenge`
- Query: `nonce`

The portal top page builds this URL and calls it with `x-auth-ui-session-mode: body`. In this mode the API returns JSON containing `session_id` and `redirect_url` instead of exposing `session_id` in the redirect URL.

### Login

- `POST /login`
- `Content-Type: application/x-www-form-urlencoded`
- Body: `session_id`, `email`, `password`
- Password is sent as upper-case SHA-256 hex to match the current templates.

### Signup

- `POST /Signup/Account`
- `Content-Type: application/x-www-form-urlencoded`
- Body: `session_id`, `email`, `password`

### Terms

- `POST /terms/list`
- `Content-Type: application/x-www-form-urlencoded`
- Body: `session_id`

- `POST /terms`
- `Content-Type: application/x-www-form-urlencoded`
- Body: `session_id`, `accepted`, repeated `term_ids`

### Token

- `POST /token`
- `Content-Type: application/x-www-form-urlencoded`
- Header: `x-flow-type: AuthorizationCode`
- Body: `grant_type=authorization_code`, `client_id`, `code`, `code_verifier`, `redirect_uri`

## Cloud Run Build

This app includes a basic Dockerfile and `.github/workflows/deploy-cloud-run.yml`.

Before the first deploy, update the GCP Workload Identity condition for this repository. See `deploy/GCP_CLOUD_RUN_DEPLOY.md`.

GitHub Actions variables can be applied from JSON:

```powershell
cd D:\portfolio\authfoundation-portal
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\set-github-actions-config.ps1 -SkipSecrets
```

Recommended production mapping:

- `https://portal.osolab-auth.jp` -> `authfoundation-portal` Cloud Run service
- `https://auth.osolab-auth.jp` -> `authfoundation-api` Cloud Run service

Required AuthFoundation API settings:

- `AuthUiBaseUrl=https://portal.osolab-auth.jp`
- `Cors__AllowedOrigins=https://portal.osolab-auth.jp`

Those values belong to the AuthFoundation API repository, not this portal repository.
