#!/usr/bin/env python3

import glob
import json
from jsonschema import validate
from jsonmerge import Merger
import os

schema = json.load(open('/app/json-schema/powerlines.schema.json'))

merger = Merger(schema)

doc = {}
for filename in sorted(glob.glob('/app/powerlines/*.json')):
    addition = json.load(open(filename))
    doc = merger.merge(doc, addition)

os.mkdir('/app/data')
with open('/app/data/powerlines.json', 'w') as out:
    json.dump(doc, out)

