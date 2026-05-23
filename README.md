# AuthFoundation Portal

Nuxt UI for AuthFoundation authentication and OIDC front-channel screens.

The portal behaves as a lightweight OIDC client for development and operations: it starts Authorization Code + PKCE, renders login/signup/consent screens, exchanges the authorization code, calls UserInfo, and provides a simple logout action.

## Screens

- `/` starts authorization and receives `/?code=...&state=...` callbacks.
- `/login` posts user credentials to Auth API `/login`.
- `/signup` posts account creation data and completes mail verification with a code.
- `/terms` loads and submits required terms and requested scopes.
- `/callback?code=...&state=...` is kept as a legacy/dev callback page.

## Screen Flow

1. User opens `/` and clicks OIDC login.
2. Portal stores only transient `state`, `nonce`, and `code_verifier` in `sessionStorage`.
3. Portal calls `GET /authorize` with `x-auth-ui-response-mode: json`.
4. Auth API creates the authorization session, sets the session as an HttpOnly Cookie, and returns `redirect_url`.
5. Portal navigates to `redirect_url`, normally `/login`.
6. `/login`, `/signup`, and `/terms` post form data without `session_id`; Auth API reads the authorization session from Cookie.
7. After login and consent, Auth API redirects back to `/` with `code` and `state`.
8. Portal validates `state`, exchanges `code` at `POST /token`, calls `GET /userinfo`, and stores the development token/UserInfo snapshot in `localStorage`.
9. Portal removes callback query parameters from the URL.
10. Logout calls `POST /logout` and clears the local token/UserInfo snapshot.

Notes:

- `session_id` must not be placed in portal URLs, localStorage, or normal form bodies.
- Browser token storage is acceptable for this scaffold only. Production handling should move tokens to a hardened BFF/session design or otherwise reduce XSS exposure.

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

For a separate origin, AuthFoundation must allow CORS, expose the `Location` header, and set cookies in a way the browser will send back to the API origin.

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
- Header: `x-auth-ui-response-mode: json`

The API returns JSON with `redirect_url` and sets the authorization session as an HttpOnly Cookie. The authorization session ID must not be returned in the response body.

### Login

- `POST /login`
- `Content-Type: application/x-www-form-urlencoded`
- Body: `email`, `password`
- Cookie: authorization session Cookie from `/authorize`
- Redirect result: JSON `result=redirect` plus `Location` header

### Signup

- `POST /Signup/Account`
- `Content-Type: application/x-www-form-urlencoded`
- Body: `email`, `password`
- Cookie: authorization session Cookie from `/authorize`
- Response: `VerifyUrl`

Mail verification uses `GET /Signup/Verify?token=...&code=...`. The portal asks the user for the mail code and appends it to `VerifyUrl`.

### Terms

- `POST /terms/list`
- `Content-Type: application/x-www-form-urlencoded`
- Cookie: authorization session Cookie from `/authorize`
- Response terms item: `term_id`, `title`, `version`, `term_url`, `required`

- `POST /terms`
- `Content-Type: application/x-www-form-urlencoded`
- Cookie: authorization session Cookie from `/authorize`
- Body: `accepted`, repeated `term_ids`
- Redirect result: JSON `result=redirect` plus `Location` header

### Logout

- `POST /logout`
- `Content-Type: application/x-www-form-urlencoded`
- Body: `logout_all`
- Optional header: `Authorization: Bearer <access_token>`

### Token

- `POST /token`
- `Content-Type: application/x-www-form-urlencoded`
- Header: `x-flow-type: AuthorizationCode`
- Body: `grant_type=authorization_code`, `client_id`, `code`, `code_verifier`, `redirect_uri`

### UserInfo

- `GET /userinfo`
- Header: `Authorization: Bearer <access_token>`

## Cloud Run Build

This app includes a Dockerfile and `.github/workflows/deploy-cloud-run.yml`.

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
- Client redirect URI for `00000000000000000000000000000000` must include `https://portal.osolab-auth.jp/`

Those values belong to the AuthFoundation API repository, not this portal repository.
