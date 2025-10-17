# Mongo EJSON Backup → Google Drive (personal)

Server app that:
- streams MongoDB collections using mongodb driver (no mongodump required)
- serializes to EJSON newline gzipped files, packs into tar.gz
- uploads to **your personal Google Drive** folder (via OAuth2 refresh token)
- keeps only N latest backups locally and on Drive
- runs on schedule every 6 hours (Asia/Colombo)
- exposes API endpoints to trigger backup and restore

## Setup

1. `cp .env.example .env` and edit `.env`.
   - Set `MONGO_URI`
   - Set `DRIVE_FOLDER_ID` to a folder you created in your personal Drive.
   - Create OAuth credentials in Google Cloud Console → Credentials → OAuth client ID (Desktop).
   - Fill `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`.
2. Obtain a `GOOGLE_OAUTH_REFRESH_TOKEN`:
   - Run locally: `npm run get-token` (or `node get-refresh-token.js`), open the URL, sign in with the Google account you want to store backups in, paste the code back. Copy printed refresh token to `.env`.
3. Install deps: `npm install`
4. Test one-off backup: `npm run once`
   - The first run will fetch an access token using the refresh token and save `drive_access_token.json` in project root.
5. Run as service: use systemd / pm2 and ensure `.env` and token file are secured.

## API
- `GET /health`
- `GET /backups` — list drive backups (returns file id & name)
- `POST /backup` — trigger backup now
- `POST /restore` — body: `{ driveFileId?: string, localFileName?: string, dropExisting?: boolean }`

## Notes
- Keep `.env`, `drive_access_token.json` out of git.
- Personal Drive has storage quota; monitor usage.
- For extremely large DBs or higher durability consider GCS or Shared Drive with service account.

