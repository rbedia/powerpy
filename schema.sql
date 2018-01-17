CREATE TABLE lmp (
	id SERIAL PRIMARY KEY,
	entry_date TIMESTAMP NOT NULL,
	doc JSONB NOT NULL
);
CREATE INDEX lmp_entry_date on lmp(entry_date);
CREATE INDEX lmp_doc_gin on lmp using gin (doc);

