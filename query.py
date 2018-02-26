from contextlib import contextmanager
import os

import psycopg2


@contextmanager
def connect():
    with psycopg2.connect("dbname='%s' user='%s' host='db' password='%s'" % (
            os.environ['POSTGRESQL_DATABASE'],
            os.environ['POSTGRESQL_USER'],
            os.environ['POSTGRESQL_PASSWORD'])) as conn:
        yield conn

def most_recent():
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, entry_date, doc FROM lmp ORDER BY entry_date DESC LIMIT 1;")
            row_id, entry_date, doc = cur.fetchone()
            return doc

