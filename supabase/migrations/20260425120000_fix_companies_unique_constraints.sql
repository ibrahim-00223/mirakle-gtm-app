-- Fix: replace partial unique indexes with real UNIQUE constraints
-- PostgREST requires proper UNIQUE constraints for upsert ON CONFLICT to work.
-- Partial indexes (WHERE website_url IS NOT NULL) are not recognised by PostgREST.
-- NULL values are always allowed in UNIQUE columns (NULL != NULL in SQL).

DROP INDEX IF EXISTS companies_website_url_unique;
DROP INDEX IF EXISTS companies_name_unique;

ALTER TABLE companies
  ADD CONSTRAINT companies_website_url_key UNIQUE (website_url);

ALTER TABLE companies
  ADD CONSTRAINT companies_name_key UNIQUE (name);
