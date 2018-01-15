import bottle
from bottle import route, static_file
import json

import system

pjm_system_url = 'http://oasis.pjm.com/system.htm'
system_file = '/tmp/system.htm'
cache_time = 5 * 60
app_root = '/home/dcat/powerpy'

@route('/lmp')
def lmp():
    system.download(pjm_system_url, system_file, cache_time)
    return json.dumps(system.parse_lmp(system_file))

@route('/limits')
def limits():
    system.download(pjm_system_url, system_file, cache_time)
    return json.dumps(system.parse_limits(system_file))

@route('/lines')
def lines():
    return static_file('powerlines.json', root=app_root)

@route('/transfer')
def transfer():
    system.download(pjm_system_url, system_file, cache_time)
    return json.dumps(system.parse_transfer(system_file))

@route('/')
def index():
    return ''

application = bottle.default_app()

