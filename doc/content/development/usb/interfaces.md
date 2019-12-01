---
title: "Interfaces"
date: 2019-11-28T10:18:29-05:00
weight: 20
---

The CanoKey has four interfaces:

| Interface  | bNumEndpoints | bInterfaceClass | bInterfaceSubClass | bInterfaceProtocol |
| ---------- | ------------- | --------------- | ------------------ | ------------------ |
| 0. FIDO    | 2             | 03h             | 00h                | 00h                |
| 1. WebUSB  | 0             | FFh             | FFh                | FFh                |
| 2. CCID    | 2             | 0Bh             | 0Bh                | 00h                |
| 3. OpenPGP | 2             | 0Bh             | 00h                | 00h                |

{{% notice note %}}
Although OpenPGP also uses the CCID protocol, gpg-agent usually use the interface exclusively. Therefore, the CanoKey uses an independent interface for OpenPGP.
{{% /notice %}}