---
title: "Protocols"
date: 2019-11-28T10:18:22-05:00
---

CanoKey supports the following protocols:

- OpenPGP Smart Card 3.4
- PIV (NIST SP 800-73-4)
- OATH
- WebUSB

Besides, CanoKey also provides an additional admin applet to manage the key.

#### OpenPGP Smart Card 3.4

CanoKey implements all the mandatory features of the [specification](https://gnupg.org/ftp/specs/OpenPGP-smart-card-application-3.4.pdf). Besides, the following optional features are also implemented:

- PUT DATA with TAG `C4`
- Algorithms
  - RSA 2048
  - ECDSA and ECDH: secp256r1 (NIST P256)
  - ED25519 and Curve25519

Note that the following features are not supported:

- KDF
- Secure Messaging
- AES
- Command: MANAGE SECURITY ENVIRONMENT

#### PIV

CanoKey implements most of the mandatory features of the [specification](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-73-4.pdf).

The following features are not supported:

- Data objects:
  - Cardholder Fingerprints
  - Security Object
  - Cardholder Facial Image
- Secure Messaging

#### OATH

Please refer to the [OATH documentation](oath/).

#### Admin Applet

Please refer to the [Admin Applet documentation](admin/).

#### WebUSB

Please refer to the [WebUSB documentation](webusb/).
