# Splash page generator for jschol

import json
import os
import os.path
import requests
import tempfile
import yaml

from PyPDF2 import PdfFileMerger, PdfFileReader
from fpdf import FPDF
#from libxmp import XMPFiles, consts

def application(environ, start_response):

  # Locate and parse the JSON attributes passed to us
  assert environ['REQUEST_METHOD'] == "POST"
  assert environ['CONTENT_TYPE'] == "application/json"
  rawAttrs = environ['wsgi.input'].read(int(environ.get('CONTENT_LENGTH', 0)))
  attrs = json.loads(rawAttrs.decode("UTF-8"))

  # Fetch the PDF file from mrtexpress
  with open('/apps/eschol/jschol/config/mrtExpress.yaml') as f:
    mrtConfig = yaml.safe_load(f)

  url = "https://%s/%s" % (mrtConfig['host'], attrs['mrtPath'])
  r = requests.get(url, auth=(mrtConfig['username'], mrtConfig['password']))
  r.raise_for_status()
  mrtPdfPath = None
  try:
    tmpDir = "/apps/eschol/jschol/splash/tmp"
    if not os.path.isdir(tmpDir):
      os.makedirs(tmpDir)
    handle, mrtPdfPath = tempfile.mkstemp(".pdf", "mrtTmp", tmpDir)
    handle, splPdfPath = tempfile.mkstemp(".pdf", "splTmp", tmpDir)
    handle, outPdfPath = tempfile.mkstemp(".pdf", "outTmp", tmpDir)
    print("mrtPdfPath=%r splPdfPath=%r" % (mrtPdfPath, splPdfPath))
    with open(mrtPdfPath, 'wb') as fd:
      for chunk in r.iter_content(chunk_size=8192):
        fd.write(chunk)

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font('Arial', 'B', 16)
    pdf.cell(40, 10, 'Hello World!')
    pdf.output(splPdfPath, 'F')

    merger = PdfFileMerger()
    r1 = PdfFileReader(open(splPdfPath, 'rb'))
    merger.append(r1)

    r2 = PdfFileReader(open(mrtPdfPath, 'rb'))
    try:
      infoIn = r2.getDocumentInfo()
    except Exception as err:
      if "not been decrypted" in str(err):
        assert r2.decrypt("") > 0
        print("decrypted")
      else:
          raise

    infoOut = {}
    for key in infoIn:
      infoOut[key] = str(infoIn[key])
    merger.addMetadata(infoOut)

    merger.append(r2)
    merger.write(open(outPdfPath, 'wb'))

    # Now let's do the XMP
    if False:
      xmpfile = XMPFiles(file_path=mrtPdfPath, open_forupdate=False)
      xmp = xmpfile.get_xmp()
      xmpfile.close_file()

      xmpfile = XMPFiles(file_path=outPdfPath, open_forupdate=True)
      if xmpfile.can_put_xmp(xmp):
        xmpfile.put_xmp(xmp)
        print("Wrote XMP")
      else:
        print("Couldn't write XMP")
      xmpfile.close_file()

    status = '200 OK'

    response_headers = [('Content-type', 'application/pdf'),
                        ('Content-Length', str(os.path.getsize(outPdfPath)))]

    start_response(status, response_headers)
    fi = open(outPdfPath, "rb")
    if 'wsgi.file_wrapper' in environ:
      return environ['wsgi.file_wrapper'](fi, 8192)
    else:
      return iter(lambda: fi.read(8192), '')

  finally:
    if mrtPdfPath is not None:
      print("FOO: would remove %r" % mrtPdfPath)
      #os.remove(mrtPdfPath)
    if splPdfPath is not None:
      print("FOO: would remove %r" % splPdfPath)
      #os.remove(splPdfPath)
    if outPdfPath is not None:
      print("FOO: would remove %r" % outPdfPath)
      #os.remove(outPdfPath)
