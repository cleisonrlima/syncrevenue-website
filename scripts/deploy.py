#!/usr/bin/env python3
"""
Deploy syncrevenue-website to Hostinger VPS.

Usage (from project root):
    python3 scripts/deploy.py           # upload dist/ + restart
    python3 scripts/deploy.py --verify  # also open browser check after deploy
"""

import os
import sys
import time
import urllib.request
import argparse

try:
    import paramiko
except ImportError:
    print("ERROR: paramiko not installed. Run: pip install paramiko")
    sys.exit(1)

# ── Config ─────────────────────────────────────────────────────────────────
SSH_HOST = "185.28.21.212"
SSH_PORT = 65002
SSH_USER = "u718339656"
SSH_PASS = "fsM^9eFs"

APP_ROOT  = f"/home/{SSH_USER}/domains/white-octopus-759195.hostingersite.com"
NODE_BIN  = "/opt/alt/alt-nodejs22/root/usr/bin"
SITE_URL  = "https://white-octopus-759195.hostingersite.com"

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EXCLUDE = {".test.js", ".spec.js", "test-utils"}

# ── Helpers ────────────────────────────────────────────────────────────────

def connect():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=SSH_HOST, port=SSH_PORT, username=SSH_USER,
                password=SSH_PASS, timeout=30)
    return ssh


def run(ssh, cmd, timeout=300):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    stdout.channel.set_combine_stderr(True)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    code = stdout.channel.recv_exit_status()
    return out, code


def upload_dir(sftp, local_dir, remote_dir):
    try:
        sftp.stat(remote_dir)
    except FileNotFoundError:
        sftp.mkdir(remote_dir)

    for item in os.listdir(local_dir):
        if any(pat in item for pat in EXCLUDE):
            continue
        lp = os.path.join(local_dir, item)
        rp = remote_dir + "/" + item
        if os.path.isfile(lp):
            sftp.put(lp, rp)
        elif os.path.isdir(lp):
            upload_dir(sftp, lp, rp)


def check_url(url, expected_text, label):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "deploy-check/1.0"})
        resp = urllib.request.urlopen(req, timeout=15)
        body = resp.read().decode("utf-8", errors="replace")
        ok = expected_text.lower() in body.lower()
        print(f"  {label}: HTTP {resp.status} {'✓' if ok else '? expected text not found'}")
        return ok
    except Exception as e:
        print(f"  {label}: ERROR — {e}")
        return False


# ── Main ───────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify", action="store_true",
                        help="Run HTTP checks after deploy")
    parser.add_argument("--skip-npm", action="store_true",
                        help="Skip npm ci (use if dependencies did not change)")
    args = parser.parse_args()

    dist_dir = os.path.join(PROJECT_ROOT, "dist")
    if not os.path.isdir(dist_dir):
        print("ERROR: dist/ not found. Run the build first:")
        print(f"  VITE_SITE_URL={SITE_URL} npm run build")
        sys.exit(1)

    print(f"Connecting to {SSH_HOST}:{SSH_PORT}...")
    ssh = connect()
    print("Connected.\n")

    # ── Upload files ──────────────────────────────────────────────────────
    print("Uploading dist/ ...")
    sftp = ssh.open_sftp()
    upload_dir(sftp, dist_dir, f"{APP_ROOT}/dist")

    print("Uploading package files ...")
    sftp.put(os.path.join(PROJECT_ROOT, "package.json"),
             f"{APP_ROOT}/package.json")
    sftp.put(os.path.join(PROJECT_ROOT, "package-lock.json"),
             f"{APP_ROOT}/package-lock.json")
    sftp.close()
    print("Upload complete.\n")

    # ── npm ci ────────────────────────────────────────────────────────────
    if not args.skip_npm:
        print("Running npm ci --omit=dev ...")
        out, code = run(ssh,
            f"cd {APP_ROOT} && PATH={NODE_BIN}:$PATH npm ci --omit=dev 2>&1",
            timeout=300)
        if code != 0:
            print(f"ERROR: npm ci failed (exit {code}):\n{out}")
            ssh.close()
            sys.exit(1)
        # Show only summary line
        for line in out.splitlines():
            if "added" in line or "audit" in line or "vulnerability" in line:
                print(f"  {line}")
        print()

    # ── Restart Passenger ─────────────────────────────────────────────────
    print("Restarting Passenger ...")
    run(ssh, f"mkdir -p {APP_ROOT}/tmp && touch {APP_ROOT}/tmp/restart.txt")
    ssh.close()
    print("Restart triggered. Waiting 4s...")
    time.sleep(4)

    # ── Verify ────────────────────────────────────────────────────────────
    if args.verify:
        print("\nVerifying ...")
        ok = all([
            check_url(SITE_URL + "/",           "SyncRevenue",  "Landing"),
            check_url(SITE_URL + "/api/health", '"ok"',         "Health API"),
            check_url(SITE_URL + "/privacy",    "Privacy",      "Privacy page"),
        ])
        print()
        if not ok:
            print("WARNING: one or more checks failed.")
            sys.exit(1)

    print(f"Deploy complete → {SITE_URL}")


if __name__ == "__main__":
    main()
