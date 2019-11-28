---
title: "WebUSB"
date: 2019-11-28T10:18:29-05:00
---

### 1. Overview

CanoKey supports the [WebUSB](https://wicg.github.io/webusb/) protocol for easier management. You can use our open-source [console](http://) to manage your CanoKey. Or, you can develop your own console via WebUSB APIs.

#### 1.1 Driver

CanoKey is a [WinUSB device](https://docs.microsoft.com/en-us/windows-hardware/drivers/usbcon/automatic-installation-of-winusb), whose firmware defines certain Microsoft operating system (OS) feature descriptors that report the compatible ID as "WINUSB". Therefore, you do not need additional drivers when you use it on Windows. And of course, no drivers are required on Linux or macOS.

#### 1.2 Communication Pipe

CanoKey uses the control transfer. The default EP size is 16 bytes.

### 2. Messages

Basically, the messages on the WebUSB interface are APDU commands.
