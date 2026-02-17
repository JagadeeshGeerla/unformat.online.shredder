# Unformat.Shredder

> **100% Client-Side Metadata Remover & Privacy Tool**  
> Securely strip hidden data from your files before sharing them. No server uploads, zero data leakage.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
[![Deployment](https://img.shields.io/badge/deployment-vercel-black.svg)](https://unformat-online-shredder.vercel.app)

## 🚀 Overview

**Unformat.Shredder** is a privacy-focused web application designed to clean sensitive metadata from images, documents, and logs. Built with Next.js and specialized client-side libraries, it ensures that your files never leave your device.

## ✨ Key Features

### 📸 Image Mode (Social Safe)
Protect your privacy before posting on social media.
- **Supported Formats**: `.jpg`, `.png`, `.heic`, `.webp`
- **Action**: Removes Exif, IPTC, and XMP metadata (GPS coordinates, camera model, software version, shutter speed, etc.).
- **Risk Analysis**: 
  - 🔴 **High**: GPS Location, Facial Recognition Data.
  - 🟠 **Medium**: Exif Data (Device Serial, Lens Info).
  - ⚪ **Low**: Timestamps, Editing Software.

### 🛡️ AI-Proof My Photos (Visual Noise Injection)
Make your photos unusable for AI training and tracking.
- **The Problem**: AI scrapers (Midjourney, Clearview AI) harvest public photos to train models or track faces.
- **The Solution**: We inject subtle "Visual Noise"—random, invisible pixel variations—that breaks AI fingerprinting algorithms without degrading image quality for humans.

### 📄 Document Mode (Corporate Safe)
Sanitize business documents before external sharing.
- **Supported Formats**: `.pdf`
- **Action**: Strips XML Metadata packets, Author Name, Creator Tool, and Producer fields.
- **Benefit**: Prevents leakage of internal usernames, software versions, and edit history.

### 💻 Developer Mode (Log Sanitizer)
Share logs and configs safely without leaking secrets.
- **Supported Formats**: `.log`, `.txt`, `.json`, `.sql`, `.env`
- **Action**: Uses advanced Regex patterns to auto-redact sensitive strings.
  - **IP Addresses**: `192.168.1.1` -> `xxx.xxx.xxx.xxx`
  - **Emails**: `admin@company.com` -> `a***@c***.com`
  - **API Keys**: `sk-12345...` -> `sk-********************`
  - **Auth Headers**: `Bearer eyJhbG...` -> `Bearer ********************`

## 🔒 Privacy Guarantee

This tool operates **100% Client-Side**.
- **No Uploads**: Files are processed in your browser memory using Web APIs (`FileReader`, `Canvas`, `Blob`).
- **Offline Capable**: Once loaded, the app works without an internet connection.
- **Verify**: Open your browser's Network tab—you will see **zero** file upload requests.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI/UX**: [Framer Motion](https://www.framer.com/motion/) (Animations), [Lucide React](https://lucide.dev/) (Icons)
- **Processing Libraries**:
  - `exifr` (Image metadata parsing)
  - `pdf-lib` (PDF manipulation)
  - `heic2any` (HEIC conversion)

## 📦 Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/JagadeeshGeerla/unformat.online.shredder.git
    cd unformat.online.shredder
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing

We use **Vitest** for unit and component testing to ensure reliability and privacy compliance.

```bash
# Run all tests
npm test

# Run tests in watch mode
npx vitest
```

**Test Coverage**:
- File Type Detection
- Redaction Logic (Regex validation)
- Risk Level Calculation
- Component Rendering

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
