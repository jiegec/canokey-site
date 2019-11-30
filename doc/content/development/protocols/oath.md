---
title: "OATH Applet"
date: 2019-11-28T10:18:29-05:00
weight: 10
---

The OATH protocol is used to manage and use OATH credentials with a CanoKey. It can be accessed over USB, using ISO 7816-4 commands as defined in this document.

### 1. General Definitions

#### AID

The AID of the admin applet is `A0000005272101`.

#### Instructions

| Name           | Code |
| -------------- | ---- |
| PUT            | 01h  |
| DELETE         | 02h  |
| LIST           | 03h  |
| CALCULATE      | 04h  |
| CALCULATE ALL  | 05h  |
| SEND REMAINING | 06h  |
| SELECT         | A4h  |

#### Algorithms

| Name           | Code |
| -------------- | ---- |
| HMAC-SHA1      | 01h  |
| HMAC-SHA256    | 02h  |

#### Types

| Name   | Code |
| ------ | ---- |
| HOTP   | 10h  |
| TOTP   | 20h  |

#### Properties

| Name            | Code | Description                                                  |
| --------------- | ---- | ------------------------------------------------------------ |
| Only increasing | 01h  | Enforces that a challenge is always higher than the previous |
| Require touch   | 02h  | Require button press to generate OATH codes                  |

### 2. Select

Selects the application for use.

#### Request

| Field | Value |
| ----- | ----- |
| CLA   | 00h   |
| INS   | A4h   |
| P1    | 04h   |
| P2    | 00h   |
| Lc    | Length of AID (7) |
| Data  | AID (A0 00 00 05 27 21 01) |

#### Response

| SW   | Description |
| ---- | ----------- |
| 9000 | Success     |

### 3. Put

Adds a new (or overwrites) OATH credential.

#### Request

| Field | Value |
| ----- | ----- |
| CLA   | 00h   |
| INS   | 01h   |
| P1    | 00h   |
| P2    | 00h   |
| Lc    | Length of data |
| Data  | See below      |

##### Data

Data is encoded in TLV-format.

| Tag | Length                       | Value |
| --- | ---------------------------- | ----- |
| 71h | Length of name, max 64 bytes | Name  |
| 73h | Length of key + 2            | Byte 1: High 4 bits is type, low 4 bits is algorithm <br> Byte 2: Number of digits in OATH code <br> Rest: Key |
| 78h | 1                            | Property byte |

#### Response

| SW   | Description |
| ---- | ----------- |
| 9000 | Success     |

