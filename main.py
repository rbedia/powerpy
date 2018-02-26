import bottle
from bottle import route, static_file
import json

import query
import system

DEBUG = False
pjm_system_url = 'http://oasis.pjm.com/system.htm'
system_file = '/tmp/system.htm'
cache_time = 5 * 60
app_root = '/app'
static_root = app_root + '/static'

def powerpy_static(path):
    return static_file(path, root=static_root)

@route('/static/<path:path>')
def static(path):
    return powerpy_static(path)

@route('/lmp')
def lmp():
    return {'lmp': query.most_recent()['lmp']}

@route('/limits')
def limits():
    return {'limits': query.most_recent()['limits']}

@route('/powerlines.json')
def lines():
    return powerpy_static('powerlines.json')

@route('/transfer')
def transfer():
    return {'transfer': query.most_recent()['transfer']}

@route('/')
def index():
    return powerpy_static('index.html')

if DEBUG:
    bottle.debug(True)

application = bottle.default_app()

