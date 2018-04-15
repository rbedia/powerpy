#!/usr/bin/env python3

import json
from jsonschema import validate

schema = json.load(open('/app/json-schema/powerlines.schema.json'))
doc = json.load(open('/app/static/powerlines.json'))

print('Validating.')

validate(doc, schema)

