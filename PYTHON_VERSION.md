# AURA Python Version

AURA Phase 3 is configured for **CPython 3.14.x**.

The project does not require Python 3.12. The dependency pins in `requirements.txt` were updated to releases with current Python 3.14 support/compatibility information.

## Windows setup

```powershell
py -3.14 --version
py -3.14 -m venv .venv
.venv\Scripts\activate
python --version
pip install --upgrade pip
pip install -r requirements.txt
```

The application code itself does not contain a Python 3.12-only setting that needs to be mechanically changed to `3.14`; Python compatibility is primarily determined by the interpreter and installed package versions.
