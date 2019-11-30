---
title: "Admin Applet"
date: 2019-11-28T10:18:29-05:00
weight: 20
---

To manage your CanoKey, you can use the admin applet to

- Reset OpenPGP / PIV / OATH.
- Import FIDO private key and certification.

### 1. General Definitions

#### AID

The AID of the admin applet is `F000000000`.

#### Instructions

Instructions marked as Require PIN require a successful Verify PIN command to be performed before they are available.

| Name            | Code | Require PIN |
| --------------- | ---- | ----------- |
| Write FIDO Key  | 01h  | Y           |
| Write FIDO Cert | 02h  | Y           |
| Reset OpenPGP   | 03h  | Y           |
| Reset PIV       | 04h  | Y           |
| Reset OATH      | 05h  | Y           |
| Verify PIN      | 20h  | N           |
| Change PIN      | 21h  | Y           |
| Write SN        | 30h  | Y           |
| Select          | A4h  | N           |
| Vendor Specific | FFh  | Y           |

### 2. Select

Selects the application for use.

#### Request

| Field | Value |
| ----- | ----- |
| CLA   | 00h   |
| INS   | A4h   |
| P1    | 04h   |
| P2    | 00h   |
| Lc    | Length of AID (5) |
| Data  | AID (F0 00 00 00 00) |

#### Response

Empty

### 2. Verify PIN

Verify the PIN of this admin applet. The default PIN is `123456` (in string) or `31 32 33 34 35 36` (in hex).

{{% notice note %}}
PINs are independent between Admin / OpenPGP / PIV applets.
{{% /notice %}}

{{% notice warning %}}
The max retries is 3. When you exceed this limit, the applet will be locked. A successful verification will reset this limit.
{{% /notice %}}

#### Request

| Field | Value |
| ----- | ----- |
| CLA   | 00h   |
| INS   | 20h   |
| P1    | 00h   |
| P2    | 00h   |
| Lc    | Length of PIN |
| Data  | PIN |

#### Response

| SW   | Description |
| ---- | ----------- |
| 9000 | Success     |
| 63CX | Verification failed, X retries left |
| 6983 | Applet is blocked |

### 3. Change PIN

After a successful verification, you can use this command to change your PIN **directly**. The length of the PIN should be between 6 and 64.

#### Request

| Field | Value |
| ----- | ----- |
| CLA   | 00h   |
| INS   | 21h   |
| P1    | 00h   |
| P2    | 00h   |
| Lc    | Length of new PIN |
| Data  | New PIN |

#### Response

| SW   | Description |
| ---- | ----------- |
| 9000 | Success     |
| 6700 | Incorrect length |
