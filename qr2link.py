#!/usr/bin/env python3
"""UPI QR -> one-tap pay link.
Usage: qr2link.py [--json] [--b64] <image-path | upi://pay?... | ->
  -       read from stdin (upi:// text, or image bytes)
  --b64   input (arg or stdin) is base64 image data (data: URI prefix ok)
  --json  print {"link":..., "upi":..., "pa":..., "pn":..., "am":..., "tr":..., ...}
Exit 1 with 'error: ...' on stderr on failure."""
import os, sys, json, base64
from urllib.parse import urlsplit, parse_qsl, urlencode, quote

BASE = os.environ.get("QRBATON_URL", "http://localhost:3000").rstrip("/") + "/"
HERE = os.path.dirname(os.path.realpath(__file__))
VENV = os.path.join(HERE, ".venv")

def die(m): print("error: " + m, file=sys.stderr); sys.exit(1)

def decode(data=None, path=None):
    try:
        import numpy as np, cv2
    except ImportError:
        if os.path.realpath(sys.prefix) != os.path.realpath(VENV) and os.path.exists(VENV + "/bin/python"):
            os.execv(VENV + "/bin/python", [VENV + "/bin/python", os.path.realpath(__file__)] + sys.argv[1:])
        die("opencv missing: python3 -m venv .venv && .venv/bin/pip install opencv-python-headless")
    if data is None:
        try: data = open(path, "rb").read()
        except OSError as e: die(f"cannot read {path}: {e.strerror}")
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_GRAYSCALE)
    if img is None: die("not a readable image")
    try:  # zbar is fastest/most robust when libzbar is installed
        from pyzbar.pyzbar import decode as zd
        for r in zd(img): return r.data.decode("utf-8", "replace")
    except Exception: pass
    det = cv2.QRCodeDetector()
    s, _, _ = det.detectAndDecode(img)
    if not s and max(img.shape) < 800:
        s, _, _ = det.detectAndDecode(cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_NEAREST))
    if not s: die("no QR code found in image")
    return s

def build(upi):
    upi = upi.strip(); u = urlsplit(upi)
    if u.scheme.lower() != "upi" or u.netloc.lower() != "pay":
        die(f"not a UPI payment QR (expected upi://pay?...): {upi[:120]}")
    params = parse_qsl(u.query)
    if not any(k == "pa" and "@" in v for k, v in params): die("UPI string has no valid pa (payee VPA)")
    return BASE + "?" + urlencode(params, quote_via=quote), upi, params

def main():
    a = sys.argv[1:]; js = "--json" in a; b64 = "--b64" in a
    a = [x for x in a if x not in ("--json", "--b64")]
    if len(a) != 1 or a[0] in ("-h", "--help"): print(__doc__, file=sys.stderr); sys.exit(2)
    src = a[0]
    raw = sys.stdin.buffer.read() if src == "-" else None
    if b64:
        t = (raw.decode() if raw is not None else (open(src).read() if os.path.isfile(src) else src)).strip()
        if t.startswith("data:"): t = t.split(",", 1)[1]
        try: upi = decode(data=base64.b64decode(t + "=" * (-len(t) % 4)))
        except ValueError: die("invalid base64")
    elif raw is not None:
        upi = raw.decode().strip() if raw[:4].lower() == b"upi:" else decode(data=raw)
    else:
        upi = src if src.lower().startswith("upi:") else decode(path=src)
    link, upi, params = build(upi)
    if js:
        o = {"link": link, "upi": upi}
        for k, v in params: o.setdefault(k, v)
        print(json.dumps(o))
    else: print(link)

if __name__ == "__main__": main()
