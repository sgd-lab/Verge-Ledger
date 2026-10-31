# Privacy Notice

**Version**: 0.1.0  
**Effective Date**: 2026-10-31

Verge Ledger is designed from first principles to be offline-first and privacy-light. You can survey verges, calculate triage scores, receive cut-timing advice, and generate printable packs without creating an account or transmitting any personal data.

_Disclaimer: This notice explains our software design and data handling practices. It does not constitute formal legal advice._

---

## 1. Local Storage on Your Device

By default, all data you create remains exclusively on your device:

- **Workspaces, Segments, and Observations**: Stored in your browser's local IndexedDB database using Dexie.
- **Photos**: Photos captured during a survey are stored locally in IndexedDB as binary Blobs.
- **EXIF Metadata**: When exporting segments or evidence packs, all EXIF metadata—specifically GPS coordinates embedded in photo headers—is automatically stripped to safeguard private survey locations. Photos are never uploaded to any remote server in v0.1.0.

## 2. Optional Remote Synchronization

If you choose to sync a workspace with a self-hosted or community API server:

- **Client-Generated ULIDs**: Records use 26-character Crockford base32 ULIDs generated on your device to prevent collision.
- **Authentication via Edit Keys**: Workspaces are protected by a random 128-bit edit key displayed to you once upon creation. The server never stores your plaintext key; it stores an irreversible `scrypt` hash with a per-workspace cryptographic salt.
- **No Personal Identifiers**: No email addresses, user names, or phone numbers are requested or stored.
- **IP Logging**: Server request logs do not store raw IP addresses. If an IP is hashed for brute-force rate-limiting, the hash is automatically purged after 30 days.

## 3. Map Tiles and Third-Party Network Requests

- **No Analytics or Trackers**: Verge Ledger contains zero third-party analytics scripts, tracking cookies, advertising pixels, or telemetry collectors.
- **Map Tile Requests**: When displaying map views, map tiles are fetched from the configured tile provider (defaulting to OpenStreetMap / CartoDB). The tile provider necessarily receives your IP address and the geographic bounding box of the tiles requested. You may configure a custom tile URL via `VITE_TILE_URL` or use the non-map coordinate input alternative to avoid map tile requests entirely.

## 4. Sensitive Taxa Protection

If a surveyor records an indicator species flagged as sensitive (such as wild orchids or taxa vulnerable to unlawful harvesting):

- The application automatically warns the surveyor.
- All public-facing GeoJSON, CSV, and evidence pack exports coarsen the segment coordinates to a 1 km grid square resolution (`EXP-3`).

## 5. Data Deletion

- **Local Data**: You can delete segments, observations, or entire workspaces at any time from the app settings. Clearing your browser data immediately erases the local IndexedDB database.
- **Remote Sync Data**: You may issue a permanent workspace deletion request to the API server using your secret edit key. The server immediately hard-deletes the workspace and all associated records.

## 6. Contact

For privacy questions or data deletion requests regarding community instances:
Email: **privacy@vergeledger.org**
