#!/usr/bin/env python

from datetime import datetime
import json
import os
import time

import psycopg2
from psycopg2.extras import Json
import schedule

from pjm import LMPLoader


last_updated_format = '%a %b %d %H:%M:%S EST %Y'

def save_lmp():
    print(datetime.now(), "Saving LMP data")
    with psycopg2.connect("dbname='%s' user='%s' host='db' password='%s'" % (
            os.environ['POSTGRESQL_DATABASE'],
            os.environ['POSTGRESQL_USER'],
            os.environ['POSTGRESQL_PASSWORD'])) as conn:

        with conn.cursor() as cur:
            pjm_url = 'http://oasis.pjm.com/system.htm'
            system_file = '/tmp/system2.htm'
            cache_time = 5 * 60
            loader = LMPLoader(pjm_url, system_file, cache_time)
            data = loader.parse()
            last_updated = datetime.strptime(data['last_updated'], last_updated_format)
            cur.execute("INSERT INTO lmp(entry_date, doc) VALUES(%s, %s);",
                    (last_updated, Json(data)))


schedule.every(5).minutes.do(save_lmp)

while True:
    schedule.run_pending()
    time.sleep(1)

