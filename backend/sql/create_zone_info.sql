-- create_zone_info.sql
-- Creates tables used by the zone info features and seeds them with mock data.
-- NOTE: There is no table named `zone-info` in the codebase; the backend uses
--       `zone_visitors` and `exhibitions`. This file creates those tables.
-- create_zone_info.sql
-- Creates the database `heatmap_final`, the tables used by the zone info
-- features, and seeds mock data for zones and exhibitions.

-- Note: `CREATE DATABASE` must be run as a separate statement (not inside a
-- transaction). When run with psql you can execute this file directly; if the
-- database already exists, the CREATE DATABASE statement will fail. If you
-- prefer idempotent behavior, run the CREATE DATABASE step manually or
-- use a wrapper script that checks pg_catalog.pg_database.

-- 1) Create the database
CREATE DATABASE heatmap_final;

-- 2) Connect to the newly created database (psql meta-command)
\c heatmap_final

-- 3) Create tables

-- zone_visitors stores current visitor counts. Columns:
--   zone_id  - serial primary key
--   zone     - zone identifier (e.g. 'zone1')
--   visitors - integer count
CREATE TABLE IF NOT EXISTS zone_visitors (
  zone_id SERIAL PRIMARY KEY,
  zone VARCHAR NOT NULL UNIQUE,
  visitors INTEGER DEFAULT 0
);

-- exhibitions stores individual exhibition names per zone
CREATE TABLE IF NOT EXISTS exhibitions (
  id SERIAL PRIMARY KEY,
  zone VARCHAR NOT NULL REFERENCES zone_visitors(zone) ON DELETE CASCADE,
  exhibition_name TEXT NOT NULL
);

-- 4) Seed zone_visitors with 8 zones (zone1..zone8). Adjust visitor counts as needed.
INSERT INTO zone_visitors (zone, visitors) VALUES
  ('zone1', 6),
  ('zone2', 12),
  ('zone3', 15),
  ('zone4', 8),
  ('zone5', 20),
  ('zone6', 14),
  ('zone7', 5),
  ('zone8', 0)
ON CONFLICT (zone) DO NOTHING;

-- 5) Seed exhibitions for each zone. These match the frontend mock exhibition lists.
INSERT INTO exhibitions (zone, exhibition_name) VALUES
  ('zone1','Emergency Medicine'),
  ('zone1','Healthcare Robotics'),
  ('zone1','Telemedicine Showcase'),
  ('zone1','Patient Safety Workshop'),
  ('zone1','Public Health Posters'),

  ('zone2','Civil Engineering Seminar'),
  ('zone2','Structural Design Demos'),
  ('zone2','Automation & Control'),
  ('zone2','Sustainable Construction'),
  ('zone2','Materials Lab'),

  ('zone3','Student Robotics Showcase'),
  ('zone3','Embedded Systems Projects'),
  ('zone3','Hackathon Highlights'),
  ('zone3','AI & ML Demos'),
  ('zone3','IoT Prototype Gallery'),

  ('zone4','Indie Game Showcase'),
  ('zone4','VR Arena'),
  ('zone4','Esports Tournament'),
  ('zone4','Retro Arcade Corner'),
  ('zone4','Game Dev Workshop'),

  ('zone5','Hydroponics Demo'),
  ('zone5','Precision Farming Tech'),
  ('zone5','Crop Drone Demonstration'),
  ('zone5','Soil Health Lab'),
  ('zone5','Organic Produce Market'),

  ('zone6','Factory Automation'),
  ('zone6','3D Printing Workshop'),
  ('zone6','CNC Demonstrations'),
  ('zone6','Industrial IoT Solutions'),
  ('zone6','Supply Chain Tech'),

  ('zone7','Home Automation Demos'),
  ('zone7','Energy Management Systems'),
  ('zone7','Assistive Living Tech'),
  ('zone7','Voice Assistant Integrations'),
  ('zone7','Smart Appliance Showcase'),

  ('zone8','Barista Robotics'),
  ('zone8','IoT Ordering Systems'),
  ('zone8','Advanced Coffee Brewing'),
  ('zone8','Sustainable Packaging'),
  ('zone8','Live Acoustic Sessions')
ON CONFLICT DO NOTHING;

-- Done. If you want to run this file safely from psql and avoid errors when the
-- database already exists, run the CREATE DATABASE line separately and then
-- run the remainder (or remove the CREATE DATABASE and \c lines).


--If update, use this : ALTER TABLE exhibitions ADD COLUMN updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

--Needed ones for the review
BEGIN;

-- 1) Add column (nullable)
ALTER TABLE exhibitions
ADD COLUMN updated_date TIMESTAMP WITH TIME ZONE;

-- 2) Backfill existing rows with current time (or compute an appropriate timestamp)
UPDATE exhibitions
SET updated_date = NOW()
WHERE updated_date IS NULL;

-- 3) Set default for future inserts
ALTER TABLE exhibitions
ALTER COLUMN updated_date
SET DEFAULT NOW();

-- 4) (Optional) Make column NOT NULL if you want to enforce presence
ALTER TABLE exhibitions
ALTER COLUMN updated_date
SET NOT NULL;

COMMIT;

-- Add Column : ALTER TABLE exhibitions ADD COLUMN admin_name VARCHAR(255);
Here are the exact code changes you need (file → minimal change description). I’m listing only filenames and the precise code edits to make — no edits will be applied.

Backend schema / migration

create_zone_info.sql
Add column in CREATE TABLE exhibitions:
Add admin_name VARCHAR(255) (or TEXT) to the column list.
(Or) provide a migration SQL you will run:
ALTER TABLE exhibitions ADD COLUMN admin_name VARCHAR(255);
Backend code (API)

zoneInfoAPI.js
get handler SELECT: include admin_name (and updated_date if present) in projection:
FROM: SELECT id, exhibition_name FROM exhibitions WHERE zone = $1 ORDER BY id
TO: SELECT id, exhibition_name, updated_date, admin_name FROM exhibitions WHERE zone = $1 ORDER BY id
map DB rows to JSON to include admin_name:
Add admin_name: r.admin_name in the object returned per row.
addExhibitHandler (POST /api/zone-info/:zoneName/exhibit):
Accept adminName from body: const { exhibitName, adminName } = req.body || {};
INSERT should include admin_name and RETURN it:
FROM: INSERT INTO exhibitions(zone, exhibition_name) VALUES ($1, $2) RETURNING id, exhibition_name
TO: INSERT INTO exhibitions(zone, exhibition_name, admin_name) VALUES ($1, $2, $3) RETURNING id, exhibition_name, updated_date, admin_name
Pass params [zoneName, exhibitName.trim(), adminName || null]
postZoneInfoHandler (bulk replace POST /api/zone-info/:zoneName):
Accept either array of strings (legacy) or array of objects { exhibition_name, admin_name? }.
When building batch INSERT, include admin_name column and values (or insert NULL if not provided).
After transaction, SELECT id, exhibition_name, updated_date, admin_name ... to return the new rows.
(Optional) validate adminName server-side (length, type).
any other backend file with INSERT INTO exhibitions or SELECT ... FROM exhibitions
Update INSERT/RETURNING/SELECT to include admin_name where appropriate (search for all occurrences).
Backend tests/mocks

backend/__tests__/*.js (any test files)
Update mocked DB rows & expectations to include admin_name and adjust assertions.
Add tests for POST add exhibit with adminName in body and verify returned exhibition.admin_name.
Frontend UI

Heatmap.jsx
Add UI state for admin name:
const [adminNameInput, setAdminNameInput] = useState('');
Modify admin flow (after password accepted) to show an input for Admin Name (required or optional).
Modify submitExhibit() to include admin name in POST body:
FROM: body: JSON.stringify({ exhibitName: exhibitInput.trim() })
TO: body: JSON.stringify({ exhibitName: exhibitInput.trim(), adminName: adminNameInput.trim() })
When rendering exhibitions in modal/list, display admin name if present:
e.g., show ex.admin_name (or ex.adminName depending mapping) as small subtitle "Added by ...".
Keep backward compatibility: handle both typeof ex === 'string' and object shapes.
zoneInfoMock.js
Update mock exhibitions to include admin_name (e.g., { id: 1, exhibition_name: 'X', admin_name: 'Alice' }) so dev UI shows admin names.
frontend/src/components/Heatmap.test.jsx (or other frontend tests)
Update mocks and assertions to include admin_name.
Add test asserting submitExhibit sends adminName in POST payload.
Frontend formatting / types

If you use camelCase in the frontend JSON mapping:
Add mapping in backend or client to convert admin_name → adminName (decide one style and be consistent).
If TypeScript is used (not in this repo), update interfaces for Exhibition to include admin_name?: string or adminName?: string.
Docs / examples

frontend/README.md, backend/README.md, or any API docs
Update examples for:
POST /api/zone-info/:zoneName/exhibit request body to include adminName
GET /api/zone-info/:zoneName response example to include admin_name per exhibition
Optional / recommended (not strictly required but suggested)

backend/createTables.js (if it creates or seeds tables)
Add admin_name to CREATE TABLE or seed INSERTs if this script is used in dev.
Add server-side validation and sanitization in zoneInfoAPI.js.
Update CI tests or fixtures that assert shapes.
Quick grep checklist (files to search and edit)

Search repo for: exhibition_name, exhibitions, INSERT INTO exhibitions, SELECT .* FROM exhibitions, /api/zone-info — update each hit to include/handle admin_name.


----------------------------------------------------------------------------------------
Simple local-keyword search changes (local-only, no external API)
Below are small, safe improvements you can ask for. Each item is intentionally implementation-light — it describes what to change or add and why it helps.

Matching & relevance (algorithm-level)
Case-insensitive match: normalize both query and indexed strings (toLowerCase) before comparing.
Trim/normalize whitespace: collapse multiple spaces and trim ends in both query and source.
Partial / substring matches: support contains/substring matches (not just prefix). Useful for short keywords.
Prefix matches first: prefer prefix matches (startsWith) over substring matches when ranking.
Multi-word AND matching: split query on spaces and require all tokens to match (or score by how many match).
Token order relaxation: allow tokens in any order; rank exact-order matches slightly higher.
Fuzzy / typo tolerance (simple): Levenshtein distance threshold for short typos (or use trigram overlap). Keep threshold conservative.
Synonyms list: small static map (e.g., "restroom" → "toilet") to expand keywords during matching.
Stemming/lemmatization (light): basic rules (remove common suffixes like -s, -es, -ing) to improve matches.
Stopwords: ignore common stopwords (a, the, in) for matching and ranking.
Scoring & ranking tweaks
Weighted fields: if results have fields (title, tags, description), weight title higher than description.
Frequency / popularity boost: boost results with higher visitor count or recent hits (if available).
Recentness boost: optionally boost newer exhibits if you track creation timestamps.
Exact-match boost: give a sizeable score bump for exact equality.
Length normalization: penalize extremely short matches to avoid noisy hits.
UI / UX improvements (frontend)
Highlight matched tokens in the result list for visual feedback.
Autocomplete / suggestions (simple): suggest top N matching tokens as the user types using the same local algorithm.
Debounce typing input (e.g., 200–300 ms) to avoid excessive queries.
Show “no results” helpful message and suggested alternatives (e.g., “try fewer words”).
Keyboard support: arrow keys + Enter to pick suggestion.
Limit and paginate: only show top 5–10 matches and provide “show more” if needed.
Fuzzy-match toggle: provide a small UI toggle to turn on/off fuzzy matching if desired.
Query behavior & options
Search within current zone only: add a toggle to restrict search to the zone currently open.
Global vs zone search switch: let the user explicitly select "All zones" or "This zone".
Exact phrase mode: allow quoted search for exact phrase matches.
Regex / advanced mode (optional): advanced users can toggle regex matching (keep disabled by default).
Backend / data-side (light, local changes)
Normalize and store a lowercase search-key column or functional index (e.g., lower(exhibition_name)) to speed case-insensitive searches.
Return helpful metadata: include fields like zone, visitor_count, or created_at so frontend can show context/sort.
Simple search endpoint: keep an endpoint that accepts query + zone + options (fuzzy, limit, field) and returns ranked results.
Performance & safeguards
Limit worst-case work: cap number of scanned items or tokens to avoid slowdowns on large lists.
Debounce client-side and apply a small server-side rate limit if necessary.
Precompute lightweight token sets for exhibits at write time (split tokens, remove stopwords) to speed matching.
Testing & metrics (small)
Add a few deterministic unit tests for the local matching function: exact, partial, multi-word, fuzzy.
Log basic search metrics: query text, result count, latency — useful to tune scoring.
Small-ish but high-value UX touches
Show result count and query echo (“Showing 3 results for ‘museum wings’”).
Show “did you mean” suggestions using simple closest-token suggestion (edit distance).
Quick filters: tags or zone chips to refine results in one click.
Remember recent searches in localStorage for quick re-use.
Low-risk deployment notes
Make changes behind a feature flag or a frontend toggle for gradual rollout.
Keep defaults conservative (no aggressive fuzzy matching by default).
