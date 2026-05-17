# AuthFoundation Portal Agent Notes

This repository is the Nuxt portal for AuthFoundation authentication screens.
Codex owns routine UI changes, local verification, and deployment through the existing GitHub Actions workflow.

## Boundaries

- Make UI and portal-flow changes in this repository.
- Do not change GCP IAM, Workload Identity, Secret Manager, DNS, or Cloud Run domain mappings without an explicit human approval in the current chat.
- Prefer deploying through GitHub Actions. Do not run direct `gcloud run deploy` from a local shell unless the owner explicitly asks for it.
- Keep API behavior changes in the `Auth` repository, not here.

## Current Production Targets

- Portal domain: `https://portal.osolab-auth.jp`
- Auth API domain: `https://auth.osolab-auth.jp`
- Cloud Run service: `authfoundation-portal`
- GitHub repository: `Takeru-k7a/authfoundation-portal`
- GCP project: `osolab`
- Region: `us-west1`
- Artifact Registry repository: `auth`
- Container image name: `authfoundation-auth-ui`

## Auth Flow

The portal top page starts OIDC authorization code flow with PKCE.

- Default `client_id`: `00000000000000000000000000000000`
- Default scope: `openid profile email`
- Start endpoint: Auth API `/authorize`
- Callback page: portal `/`
- Token endpoint: Auth API `/token`
- Token request header: `x-flow-type: AuthorizationCode`
- UserInfo endpoint: Auth API `/userinfo`

Flow summary:

1. `/` creates `code_verifier`, `code_challenge`, `state`, and `nonce`.
2. `/` stores transient authorization state in `sessionStorage`.
3. `/` calls `${NUXT_PUBLIC_AUTH_API_BASE}/authorize` with `x-auth-ui-session-mode: body`.
4. Auth API returns `session_id` in the JSON body and `redirect_url` without a `session_id` query parameter.
5. `/` stores `session_id` in `localStorage` and navigates to the returned screen URL, normally `/login`.
6. Login posts credentials and `session_id` in the form body to Auth API `/login`.
7. Auth API redirects back to `/?code=...&state=...`.
8. `/` validates `state` and exchanges the code at `/token`.
9. `/` stores returned tokens in `localStorage`, calls `/userinfo`, and stores UserInfo in `localStorage`.
10. `/` removes `code` and `state` from the browser URL with `history.replaceState`.

Production note: browser `localStorage` token storage is acceptable for this scaffold only, but should be replaced or tightened before handling sensitive production sessions.

## Runtime Configuration

Use public Nuxt runtime variables:

```text
NUXT_PUBLIC_AUTH_API_BASE=https://auth.osolab-auth.jp
NUXT_PUBLIC_AUTH_CLIENT_ID=00000000000000000000000000000000
NUXT_PUBLIC_AUTH_SCOPE=openid profile email
```

GitHub Actions variables are managed through `deploy/github-actions.variables.json` and `scripts/set-github-actions-config.ps1`.

## Local Verification

Run these before committing:

```powershell
npm install
npm run typecheck
npm run build
```

If dependencies are already installed and `package-lock.json` exists, do not delete the lockfile unless dependency resolution is intentionally being changed.

## Deployment Runbook

Use this path for routine portal deploys:

```powershell
git status --short
git add .
git commit -m "Update portal authorization flow"
git push origin main
gh workflow run deploy-cloud-run.yml -f deploy=true
gh run list --workflow deploy-cloud-run.yml --limit 1
gh run watch <run-id>
```

After workflow success, verify:

```powershell
curl.exe -I https://portal.osolab-auth.jp/
curl.exe -I https://portal.osolab-auth.jp/
```

If domain certificate provisioning is not ready, verify Cloud Run service URL instead and report the domain state separately.

## Coding Guidelines

- Keep components small and explicit; avoid hiding API contract details in over-generic helpers.
- Use PKCE and OIDC terms precisely in names and UI copy.
- Prefer ASCII in code identifiers and comments. Japanese UI copy is allowed.
- Do not log tokens, passwords, code verifiers, or authorization codes.
- Expose minimal debug information in UI. Debug payloads must not include secrets in future production pages.

## Known Coupling With Auth API

The Auth API must allow this origin in CORS:

```text
https://portal.osolab-auth.jp
```

The Auth API must also expose the `Location` header because login and terms endpoints return redirects consumed by the browser UI.

The default portal client must register this redirect URI:

```text
https://portal.osolab-auth.jp/
```

Portal-owned authorization session handling:

- Do not put `session_id` in portal URLs.
- Store the active authorization `session_id` in `localStorage` under `authfoundation.portal.authorization_session_id`.
- Send `session_id` to Auth API screen actions in `application/x-www-form-urlencoded` body fields.
- Keep `x-session-id` only as a legacy API compatibility path; new portal changes should not depend on it.

Portal-owned token and UserInfo handling:

- Use `/` as the primary authorization redirect URI.
- Store tokens in `localStorage` under `authfoundation.portal.tokens`.
- Store UserInfo claims in `localStorage` under `authfoundation.portal.user_info`.
- Remove callback query parameters after successful processing.
