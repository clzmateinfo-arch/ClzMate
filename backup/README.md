# Mongo EJSON Backup → Google Drive (personal)

Server app that:
- streams MongoDB collections using mongodb driver (no mongodump required)
- serializes to EJSON newline gzipped files, packs into tar.gz
- uploads to **your personal Google Drive** folder (via OAuth2 refresh token)
- keeps only N latest backups locally and on Drive
- runs on schedule every 12 hours (`0 */12 * * *`, Asia/Colombo)
- exposes API endpoints to trigger backup and restore

## Setup

1. `cp .env.example .env` and edit `.env`.
   - Set `MONGO_URI`
   - Set `DRIVE_FOLDER_ID` to a folder you created in your personal Drive.
   - Create OAuth credentials in Google Cloud Console → Credentials → OAuth client ID (Desktop).
   - Fill `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`.
2. Obtain a `GOOGLE_OAUTH_REFRESH_TOKEN`:
   - Run locally: `npm run get-token` (or `node get-refresh-token.js`), open the URL, sign in with the Google account you want to store backups in, paste the code back. Copy printed refresh token to `.env`.
3. Install deps: `npm install` (or `bash scripts/deploy.sh`)
4. Test one-off backup: `npm run once`
   - The first run will fetch an access token using the refresh token and save `drive_access_token.json` in project root.
5. Run as service: use systemd / pm2 and ensure `.env` and token file are secured.

## API
Every route except `GET /health` requires `x-api-key: <BACKUP_API_KEY>` or `Authorization: Bearer <BACKUP_API_KEY>`. The HTTP server refuses to start (exit 1) if `BACKUP_API_KEY` is unset or shorter than 24 characters; `npm run once` does not need it. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

- `GET /health` - unauthenticated liveness check
- `GET /backups` - list Drive backups (`name`, `size` only)
- `POST /backup` - trigger backup now (returns `name`, `driveFileId`)
- `POST /restore` - body: `{ driveFileId?: string, localFileName?: string, dropExisting?: boolean, confirm?: string }`
  - exactly one of `driveFileId` / `localFileName` (plain file name inside `BACKUP_DIR`, no path separators or `..`)
  - `dropExisting` defaults to `false`; when `true`, `confirm` must be `"RESTORE"`
  - invalid input returns 400

```
curl -H "x-api-key: $BACKUP_API_KEY" http://127.0.0.1:3500/backups
curl -X POST -H "x-api-key: $BACKUP_API_KEY" -H "Content-Type: application/json"   -d '{"localFileName":"backup_20250101_000000.tar.gz","dropExisting":true,"confirm":"RESTORE"}'   http://127.0.0.1:3500/restore
```

Limits: JSON body 10kb; POST routes rate limited to 10 requests/minute per IP (in memory).

## Configuration
- `HOST` (default `127.0.0.1`) - bind address. Set to `0.0.0.0` only behind a firewall or reverse proxy with TLS.
- `BACKUP_API_KEY` - required for the HTTP server.
- `SKIP_INITIAL_BACKUP=true` - skip the backup that normally runs at service startup (the 12-hour schedule still runs).

## Notes
- Keep `.env`, `drive_access_token.json` and service-account key JSON out of git (`.gitignore` covers `backup/*.json`, which also ignores `package-lock.json`; use `git add -f` to commit the lockfile so `scripts/deploy.sh` can use `npm ci`).
- Personal Drive has storage quota; monitor usage.
- For extremely large DBs or higher durability consider GCS or Shared Drive with service account.

