# Security Policy

## Reporting a vulnerability

Please report security problems privately through
[GitHub's private vulnerability reporting](https://github.com/koedame/usbmeter/security/advisories/new).
Do not open a public issue for them.

## Supported versions

Security fixes are applied to the version published on the project's website only.

## What counts as a vulnerability

USB Meter Web reads a Bluetooth meter in your browser. The readings stay in the page and are
never sent anywhere. The host that serves the page may inject its own script into the HTML; the
page's Content-Security-Policy blocks it. We treat these as vulnerabilities:

- The page loading or running script from anywhere other than its own files.
- The page sending data about you or your readings to another site.
- Data from a Bluetooth device making the page run code or download something unexpected.
