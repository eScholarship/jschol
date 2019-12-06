#!/usr/bin/env python

import re, sys

prev = None
for line in sys.stdin:
  line = line.strip()
  if prev is not None:
    prev = prev + "\\n" + line
    if re.search(r'\);$', prev):
      print(prev)
      prev = None
  elif re.match(r'INSERT INTO', line) and not re.search(r'\);', line):
    prev = line
  else:
    print(line)

print(prev)