# Security Policy

The brainArena security team takes all vulnerabilities seriously. We appreciate your efforts to responsibly disclose findings.

---

## 🛡️ Supported Versions

We provide security patches for the following versions of brainArena:

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

---

## 🚨 Reporting a Vulnerability

**Please DO NOT report security issues via public GitHub Issues or Pull Requests.**

Instead, report security concerns through one of the following channels:
- **Email**: Send detailed vulnerability reports to `security@brainarena.com`
- **Private GitHub Security Advisory**: Use GitHub's [Private Vulnerability Reporting](https://github.com/your-username/Quiz/security/advisories/new)

### What to Include in Your Report:
1. **Description**: Clear explanation of the vulnerability and its potential impact.
2. **Steps to Reproduce**: Minimal, reproducible steps or Proof of Concept (PoC).
3. **Affected Components**: Specific endpoints, controller functions, or client components.
4. **Proposed Fix**: Any suggested code changes or architectural mitigations (if known).

---

## ⏱️ Response & Disclosure Timeline

- **Initial Acknowledgment**: Within 24-48 hours.
- **Triage & Assessment**: Within 3-5 business days.
- **Fix & Patch Deployment**: Critical vulnerabilities are typically patched within 7 days.
- **Public Disclosure**: Coordinated with the reporter after the fix is safely deployed to production.

---

## 🔒 Security Best Practices for Self-Hosting

- Always use strong, randomly generated secrets for `JWT_SECRET` (at least 256 bits).
- Run MongoDB behind network authentication and firewall rules (never expose port `27017` publicly).
- Enforce HTTPS and secure cookies in production environments.
- Keep all npm packages updated via `npm audit`.
