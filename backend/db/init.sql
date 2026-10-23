BEGIN;
CREATE TABLE IF NOT EXISTS users (
 id SERIAL PRIMARY KEY, email VARCHAR(254) UNIQUE NOT NULL, password_hash TEXT NOT NULL,
 slug VARCHAR(80) UNIQUE NOT NULL, is_public BOOLEAN NOT NULL DEFAULT FALSE,
 allow_cv BOOLEAN NOT NULL DEFAULT FALSE, version INTEGER NOT NULL DEFAULT 1,
 session_version INTEGER NOT NULL DEFAULT 1, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS profiles (
 user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 full_name VARCHAR(160) NOT NULL, headline VARCHAR(160) NOT NULL DEFAULT '', bio TEXT NOT NULL DEFAULT '',
 email VARCHAR(254) NOT NULL, phone VARCHAR(40) NOT NULL DEFAULT '', city VARCHAR(160) NOT NULL DEFAULT '',
 linkedin_url TEXT NOT NULL DEFAULT '', github_url TEXT NOT NULL DEFAULT '', website_url TEXT NOT NULL DEFAULT '', photo_url TEXT NOT NULL DEFAULT ''
);
-- Tables séparées, contrat commun pour simplifier les formulaires typés.
CREATE TABLE IF NOT EXISTS experiences (
 id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 title VARCHAR(160) NOT NULL, subtitle VARCHAR(160) NOT NULL DEFAULT '', start_date VARCHAR(10) NOT NULL DEFAULT '', end_date VARCHAR(10) NOT NULL DEFAULT '',
 description TEXT NOT NULL DEFAULT '', technologies TEXT[] NOT NULL DEFAULT '{}', repo_url TEXT NOT NULL DEFAULT '', demo_url TEXT NOT NULL DEFAULT '', image_url TEXT NOT NULL DEFAULT '',
 category VARCHAR(30) NOT NULL DEFAULT 'Outil', level SMALLINT NOT NULL DEFAULT 3 CHECK(level BETWEEN 1 AND 5), sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS education (LIKE experiences INCLUDING ALL);
CREATE TABLE IF NOT EXISTS skills (LIKE experiences INCLUDING ALL);
CREATE TABLE IF NOT EXISTS projects (LIKE experiences INCLUDING ALL);
-- LIKE ne copie pas les clés étrangères ; les trois tables partagent volontairement la séquence d'identifiants.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='education_user_fk') THEN
 ALTER TABLE education ADD CONSTRAINT education_user_fk FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE;
 ALTER TABLE skills ADD CONSTRAINT skills_user_fk FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE;
 ALTER TABLE projects ADD CONSTRAINT projects_user_fk FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE;
 END IF;
END $$;
CREATE INDEX IF NOT EXISTS experiences_user_order ON experiences(user_id, sort_order, id);
CREATE INDEX IF NOT EXISTS education_user_order ON education(user_id, sort_order, id);
CREATE INDEX IF NOT EXISTS skills_user_order ON skills(user_id, sort_order, id);
CREATE INDEX IF NOT EXISTS projects_user_order ON projects(user_id, sort_order, id);
COMMIT;
