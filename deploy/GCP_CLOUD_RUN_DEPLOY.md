# AuthFoundation Portal Cloud Run Deploy

This repository deploys the Nuxt authentication portal to Cloud Run.

## Target

- Repository: `Takeru-k7a/authfoundation-portal`
- Service: `authfoundation-portal`
- Domain: `portal.osolab-auth.jp`
- API origin: `https://auth.osolab-auth.jp`
- Artifact Registry repository: `auth`
- Region: `us-west1`

## One-Time GCP Workload Identity Update

The existing deploy service account was originally restricted to `Takeru-k7a/Auth`.
Allow this repository too.

```bash
PROJECT_ID=osolab
PROJECT_NUMBER=210279746180
DEPLOYER_SA=github-auth-deployer
BACKEND_REPO=Takeru-k7a/Auth
PORTAL_REPO=Takeru-k7a/authfoundation-portal

gcloud config set project "${PROJECT_ID}"

gcloud iam workload-identity-pools providers update-oidc github \
  --location=global \
  --workload-identity-pool=github-actions \
  --attribute-condition="attribute.repository in ['${BACKEND_REPO}','${PORTAL_REPO}']"

gcloud iam service-accounts add-iam-policy-binding \
  "${DEPLOYER_SA}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-actions/attribute.repository/${PORTAL_REPO}"
```

## GitHub Actions Variables

```powershell
cd D:\portfolio\authfoundation-portal
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\set-github-actions-config.ps1 -SkipSecrets
```

If secrets are not already set in this repository, create `deploy/github-actions.secrets.json` from the example and run without `-SkipSecrets`.

Current runtime variables:

```text
NUXT_PUBLIC_AUTH_API_BASE=https://auth.osolab-auth.jp
NUXT_PUBLIC_AUTH_CLIENT_ID=00000000000000000000000000000000
NUXT_PUBLIC_AUTH_SCOPE=openid profile email
```

`NUXT_PUBLIC_AUTH_CLIENT_ID` is the client used by the portal top page when it starts the authorization code + PKCE flow.

## Deploy

Run GitHub Actions workflow:

```text
Build and Deploy Auth Portal to Cloud Run
```

## Domain Mapping

After the Cloud Run service exists:

```bash
gcloud beta run domain-mappings create \
  --service=authfoundation-portal \
  --domain=portal.osolab-auth.jp \
  --region=us-west1
```

In Cloudflare DNS:

```text
Type: CNAME
Name: portal
Target: ghs.googlehosted.com
Proxy status: DNS only
```

Keep it DNS only until Google certificate provisioning finishes.
