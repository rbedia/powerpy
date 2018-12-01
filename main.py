import bottle
from bottle import route, static_file
import json

import query

DEBUG = False
app_root = '/app'
static_root = app_root + '/static'
data_root = app_root + '/data'

def powerpy_static(path):
    return static_file(path, root=static_root)

def powerpy_data(path):
    return static_file(path, root=data_root)

@route('/static/<path:path>')
def static(path):
    return powerpy_static(path)

@route('/lmp')
def lmp():
    return {'lmp': query.most_recent()['lmp']}

@route('/limits')
def limits():
    return {'limits': query.most_recent()['limits']}

@route('/pjm')
def pjm():
    return {'pjm': query.most_recent()}

@route('/powerlines.json')
def lines():
    return powerpy_data('powerlines.json')

@route('/transfer')
def transfer():
    return {'transfer': query.most_recent()['transfer']}

@route('/history/load/<hours:int>')
def history_load(hours):
    with query.connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT "
                "    date_trunc('hour', entry_date), "
                "    AVG((doc #> '{load,0}'->>'load')::int), "
                "    AVG((doc #> '{load,1}'->>'load')::int), "
                "    AVG((doc #> '{load,2}'->>'load')::int), "
                "    AVG((doc #> '{load,3}'->>'load')::int) "
                "FROM lmp "
                "GROUP BY date_trunc('hour', entry_date) "
                "ORDER BY date_trunc('hour', entry_date) DESC "
                "LIMIT %s;",
                (hours,)
            )
            dates = ['x']
            load_data = [
                ['PJM RTO'],
                ['PJM MID ATLANTIC'],
                ['PJM SOUTHERN'],
                ['PJM WESTERN'],
            ]
            rows = cur.fetchall()
            for row in rows:
                entry_date = row[0]
                dates.insert(1, entry_date.strftime("%Y-%m-%d %H:%M:%S"))
                for i in [0, 1, 2, 3]:
                    load_data[i].insert(1, int(row[i + 1]))
            return {'columns': [dates, *load_data]}

@route('/')
def index():
    return powerpy_static('index.html')

@route('/error')
def error():
    return powerpy_static('error.html')

if DEBUG:
    bottle.debug(True)

application = bottle.default_app()

