from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
APP_JS = ROOT / "frontend" / "static" / "js" / "app.js"
APP_HTML = ROOT / "frontend" / "templates" / "app.html"

if not APP_JS.exists():
    raise SystemExit(f"Missing: {APP_JS}")
if not APP_HTML.exists():
    raise SystemExit(f"Missing: {APP_HTML}")

js = APP_JS.read_text(encoding="utf-8")
html = APP_HTML.read_text(encoding="utf-8")

# Give Security & Audit its own unique function name so it can never
# accidentally resolve to the Customer Feedback renderer.
if "async function securityAuditPage()" not in js:
    js, n1 = re.subn(
        r"async function securityPage\(\)",
        "async function securityAuditPage()",
        js,
        count=1
    )
    if n1 != 1:
        raise SystemExit("Could not find securityPage() in app.js.")

js, n2 = re.subn(
    r"security:\s*securityPage",
    "security: securityAuditPage",
    js,
    count=1
)
if n2 != 1:
    raise SystemExit("Could not update the security route in app.js.")

# Force browsers/CDN to fetch the new JavaScript instead of an older cached copy.
html, n3 = re.subn(
    r'/static/js/app\.js\?v=[^"\']+',
    '/static/js/app.js?v=20261004-2',
    html,
    count=1
)
if n3 != 1:
    raise SystemExit("Could not find the app.js cache version in app.html.")

# Keep customer.js in the same version family.
html = re.sub(
    r'/static/js/customer\.js\?v=[^"\']+',
    '/static/js/customer.js?v=20261004-2',
    html,
    count=1
)

# Backups
for original, suffix in [(APP_JS, ".security-route-backup"), (APP_HTML, ".security-cache-backup")]:
    backup = Path(str(original) + suffix)
    if not backup.exists():
        backup.write_text(original.read_text(encoding="utf-8"), encoding="utf-8")

APP_JS.write_text(js, encoding="utf-8")
APP_HTML.write_text(html, encoding="utf-8")

print("SUCCESS")
print("Security & Audit now uses the unique securityAuditPage() renderer.")
print("The app.js cache version was changed to 20261004-2.")
print("No products, photos, orders, suppliers, or database records were changed.")
