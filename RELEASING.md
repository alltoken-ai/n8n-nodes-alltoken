# Releasing to npm

This document is for maintainers with `npm publish` permission on `n8n-nodes-alltoken`. End users who just want to install the node should follow [README.md](./README.md) instead.

---

## 0. One-time setup (per maintainer)

### 0.1 npm account

Sign up at https://www.npmjs.com (free). Maintainers publish under the shared `alltoken-ai` org account.

### 0.2 Enable 2FA (strongly recommended)

npmjs.com → Account → Security → Enable 2FA → choose `Authorization and Publishing`. npm 7+ requires OTP confirmation on `publish` when 2FA is on.

### 0.3 Install Node + npm

```bash
node --version    # must be >= 20.15
npm --version     # ships with node
```

### 0.4 Login

```bash
npm login
# enter npm username, password, email, and (if 2FA is on) OTP
npm whoami        # should echo your npm username
```

Credentials are stored in `~/.npmrc` after first login.

---

## 1. Pre-release checks (run every release)

```bash
cd /path/to/n8n-nodes-alltoken
```

### 1.1 Clean git state

```bash
git status                                # working tree must be clean
git checkout main                         # release from main
git pull origin main                      # pull latest
```

> Do not publish from a feature branch. Merge to main first.

### 1.2 Check name availability / version

First release:
```bash
npm view n8n-nodes-alltoken
# expect 404 / "is not in the npm registry" → name is free
```

Subsequent releases: the command returns the current published version. Confirm that `package.json#version` is higher than what's on npm (npm forbids overwriting published versions).

### 1.3 Full pipeline

```bash
rm -rf dist node_modules/.cache
npm install
npm run build              # tsc + gulp icons + codex JSON
npm run lint               # must be 0 errors
npm test                   # currently 29/29
npx tsc --noEmit           # must be clean
```

Stop and fix anything that fails before publishing.

### 1.4 Dry run

```bash
npm publish --dry-run
```

The printed file list should include:

- ✅ all `.js`/`.d.ts`/`.svg`/`.json` under `dist/`
- ✅ `package.json`
- ✅ `README.md`
- ✅ `LICENSE`
- ✅ `index.js`
- ❌ **no** `src/`, `node_modules/`, `__tests__/`, `docker-compose.yml`, `.git/`, etc.

Package size should be roughly **20–50 KB**. A large jump usually means `files` field or `.npmignore` is misconfigured.

---

## 2. Publish

```bash
npm publish
```

This is a public package (no `private: true` in `package.json`), so no `--access public` flag needed.

If 2FA is on, expect an OTP prompt or browser confirmation. Success looks like:

```
+ n8n-nodes-alltoken@0.2.0
```

---

## 3. Post-release verification (required)

### 3.1 npm page

Open https://www.npmjs.com/package/n8n-nodes-alltoken and confirm:

- Version number is correct
- README renders properly
- The "Files" tab shows `dist/`, `README.md`, `LICENSE`
- The repository link points to GitHub

### 3.2 Install into a fresh n8n

Spin up a clean n8n instance (not your dev container, a brand-new one):

```bash
docker run -d --name n8n-fresh -p 15678:5678 n8nio/n8n:latest
# wait ~15 seconds for n8n to start
open http://localhost:15678
```

In the n8n UI:

1. Register a throwaway owner account
2. Settings → Community Nodes → **Install**
3. Enter `n8n-nodes-alltoken` → install
4. n8n auto-restarts
5. New workflow → Add Node → search "AllToken" → both **AllToken** and **AllToken Chat Model** should appear
6. Configure the credential → run a Chat → confirm a response comes back

Tear down:
```bash
docker rm -f n8n-fresh
```

---

## 4. After a release

### 4.1 Found a serious bug, want to revoke

**npm does not allow casual revocation.** Rules:

- Within **72 hours** of publish you can `npm unpublish n8n-nodes-alltoken@<version>`, but this is **strongly discouraged** — it breaks anyone who already depends on that version.
- After 72 hours, use `npm deprecate` instead (marks deprecated but installable):
  ```bash
  npm deprecate n8n-nodes-alltoken@0.2.0 "bug: use 0.2.1 instead"
  ```

The correct fix is to ship a patch version and let users upgrade.

### 4.2 Publish a new version

```bash
# patch:  0.2.0 → 0.2.1   (bug fix)
# minor:  0.2.0 → 0.3.0   (new feature, backward compatible)
# major:  0.2.0 → 1.0.0   (breaking change)
npm version patch -m "release v%s: <one-line description>"
git push --follow-tags
npm publish
```

`npm version` bumps `package.json#version`, tags the commit, and creates a release commit automatically.

### 4.3 Apply for n8n verified status (optional, later)

After publishing, you can apply for n8n's "verified" badge so the installer doesn't show the "unverified community node" warning. See https://docs.n8n.io/integrations/creating-nodes/build/reference/verified-nodes/ for the process. Not required for the first release — wait until you have some real usage.

---

## 5. Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `403 Forbidden — You do not have permission` | not logged in / no publish rights / name taken | `npm whoami`; if name is taken, switch to a scoped name like `@alltoken-ai/n8n-nodes-alltoken` |
| `402 Payment Required` | private package without paid plan | not applicable here; verify `package.json` has no `private: true` |
| `403 — You must verify your email` | npm account email not verified | click the verification link in your inbox |
| `EPUBLISHCONFLICT` / `cannot publish over the previously published versions` | version already on npm | `npm version patch` and retry |
| `npm ERR! 401 Unauthorized` | token expired | `npm logout && npm login` |
| `prepublishOnly` fails | build or lint failed | fix the underlying error; the hook is there for protection |

---

## 6. Minimal checklist (quick reference)

```bash
# 1. Prepare
cd /path/to/n8n-nodes-alltoken
git checkout main && git pull
npm whoami    # confirm logged in

# 2. Pre-flight
npm install
npm run build && npm run lint && npm test
npm publish --dry-run    # review file list

# 3. Publish
npm publish

# 4. Verify
open https://www.npmjs.com/package/n8n-nodes-alltoken
```

Four steps, ten minutes.

---

**Questions?** Open a GitHub issue at https://github.com/alltoken-ai/n8n-nodes-alltoken/issues.
