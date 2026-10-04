from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
APP_JS = ROOT / "frontend" / "static" / "js" / "app.js"

if not APP_JS.exists():
    raise SystemExit(f"Could not find: {APP_JS}")

text = APP_JS.read_text(encoding="utf-8")

pattern = re.compile(
    r"async function securityPage\(\) \{.*?\n\}\n(?=async function feedbackPage\(\))",
    re.S,
)

replacement = """
async function securityPage() {
    if (!['owner', 'admin'].includes(me.role)) {
        return unauthorized('Security & Audit');
    }

    $('#page').innerHTML = `
        <div class="page-head">
            <div>
                <div class="eyebrow">CONTROL & TRACEABILITY</div>
                <h1>Security & Audit</h1>
                <p>Business-scoped audit events. Secrets and passwords are never displayed here.</p>
            </div>
        </div>
        <div class="card">
            <div class="small muted">Loading audit events...</div>
        </div>
    `;

    try {
        const xs = await api('/api/insights/audit');

        $('#page').innerHTML = `
            <div class="page-head">
                <div>
                    <div class="eyebrow">CONTROL & TRACEABILITY</div>
                    <h1>Security & Audit</h1>
                    <p>Business-scoped audit events. Secrets and passwords are never displayed here.</p>
                </div>
            </div>

            <div class="card table-wrap">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Action</th>
                            <th>Entity</th>
                            <th>User</th>
                            <th>Details</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${
                            Array.isArray(xs) && xs.length
                                ? xs.map(x => `
                                    <tr>
                                        <td><b>${esc(x.action || '—')}</b></td>
                                        <td>
                                            ${esc(x.entity_type || '—')}
                                            ${x.entity_id ? '#' + esc(x.entity_id) : ''}
                                        </td>
                                        <td>#${esc(x.user_id || '—')}</td>
                                        <td>${esc(x.details || '—')}</td>
                                        <td>${date(x.created_at)}</td>
                                    </tr>
                                `).join('')
                                : `
                                    <tr>
                                        <td colspan="5">No audit events yet.</td>
                                    </tr>
                                `
                        }
                    </tbody>
                </table>
            </div>
        `;
    } catch (e) {
        $('#page').innerHTML = `
            <div class="page-head">
                <div>
                    <div class="eyebrow">CONTROL & TRACEABILITY</div>
                    <h1>Security & Audit</h1>
                    <p>Business-scoped audit events.</p>
                </div>
            </div>

            <div class="card">
                <h3>Audit information is temporarily unavailable</h3>
                <p class="muted" style="margin-top:8px">
                    The Security & Audit page is working, but the audit records could not be loaded.
                </p>
                <div style="margin-top:14px">
                    <button class="btn btn-primary" onclick="securityPage()">Try again</button>
                </div>
            </div>
        `;
    }
}
"""

new_text, count = pattern.subn(replacement, text, count=1)

if count != 1:
    raise SystemExit("Could not find the existing securityPage() function. No changes were made.")

backup = APP_JS.with_suffix(".js.security-backup")
if not backup.exists():
    backup.write_text(text, encoding="utf-8")

APP_JS.write_text(new_text, encoding="utf-8")

print("Security & Audit has been fixed.")
print(f"Updated: {APP_JS}")
print(f"Backup:  {backup}")
