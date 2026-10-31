# Security Policy

## Supported versions

Security updates are provided for the latest release only:

| Version | Supported |
| --- | --- |
| 0.1.x | :white_check_mark: |
| < 0.1.0 | :x: |

## Reporting a vulnerability

If you discover a security vulnerability in Verge Ledger, please do not open a public issue.

Instead, please report it privately via GitHub Security Advisories or by emailing:
**security@vergeledger.org**

Please include:
- A description of the issue.
- Steps to reproduce or a proof of concept.
- Affected component (`packages/core`, `apps/web`, `apps/api`, etc.).

You will receive an acknowledgement within **7 calendar days**.

## Scope

The scope includes:
- The offline-first web application (`apps/web`).
- The optional Fastify API (`apps/api`).
- Core calculation and export logic (`packages/core`).
- Official deployment scripts and Docker configurations.

## Data handling disclosure

Verge Ledger is designed to be privacy-light:
- No user accounts or passwords exist.
- Photos and EXIF coordinates are stored solely on the client in IndexedDB and are stripped prior to export.
- Remote synchronization is optional; edit keys are hashed using `scrypt` with per-workspace salts.
- Server logs purge IP hashes after 30 days.
