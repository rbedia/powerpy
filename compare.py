#!/usr/bin/env python

import json

import system

pjm_url = 'http://oasis.pjm.com/system.htm'
system_file = '/tmp/system2.htm'
cache_time = 5 * 60
system.download(pjm_url, system_file, cache_time)
buses = system.parse_lmp(system_file)

graph_file = 'powerlines.json'

nodes = {}

with open(graph_file) as fp:
    graph_data = json.load(fp)
    for node in graph_data['nodes']:
        if 'pjm' in node:
            node_id = node['pjm']
        else:
            node_id = node['name'].upper()

        nodes[node_id] = node

for bus in buses:
    if bus['name'] not in nodes:
        print(bus)
