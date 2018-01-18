import bottle
from bottle import route, static_file
import json

import system

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
    system.download(pjm_system_url, system_file, cache_time)
    return system.parse_lmp(system_file)

@route('/limits')
def limits():
    system.download(pjm_system_url, system_file, cache_time)
    return system.parse_limits(system_file)

@route('/powerlines.json')
def lines():
    return powerpy_static('powerlines.json')

@route('/transfer')
def transfer():
    system.download(pjm_system_url, system_file, cache_time)
    return system.parse_transfer(system_file)

@route('/')
def index():
    return powerpy_static('index.html')

application = bottle.default_app()

