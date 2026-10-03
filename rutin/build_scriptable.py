"""index.html arayüzünü Rutin.src.js içine gömerek Scriptable için Rutin.js üretir."""
import json, pathlib

here = pathlib.Path(__file__).parent
html = (here / "index.html").read_text()
src = (here / "Rutin.src.js").read_text()
marker = "/* ---------- uygulama (web arayüzü) ---------- */"
out = src.replace(marker, f"const APP_HTML = {json.dumps(html, ensure_ascii=False)};\n\n{marker}", 1)
(here / "Rutin.js").write_text(out)
print("Rutin.js yazıldı:", len(out), "bayt")
