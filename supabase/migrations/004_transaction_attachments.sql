-- Add photo and voice memo columns to transactions
-- These were defined in the TypeScript Transaction type but missing from the DB schema
-- Photos are stored as base64 data URLs (compressed to ~200KB)
-- Voice memos are stored as base64 WebM audio data URLs (max 10s)

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS voice_memo_url TEXT;
