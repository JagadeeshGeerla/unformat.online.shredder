# Sample Files for Testing

This directory contains sample files used to verify the functionality of Unformat.Shredder.

## Structure

### `/text`
- **`sensitive.log`**: Contains mock sensitive data to test the Redaction logic.
  - **IPv4**: `192.168.1.55`, `203.0.113.42`
  - **Email**: `admin@example.com`
  - **Auth Header**: Bearer Token

### `/code`
- **`config.json`**: Contains mock API keys to test Developer Mode.
  - **API Key**: `sk-live-...`, `sk-test-...`

### `/document`
- **`sample.pdf`**: Generated PDF containing standard metadata (Author, Producer, Creator) to test PDF stripping.

### `/images`
- Place any `.jpg`, `.png`, or `.heic` files here to test Image Mode.
- *Note*: You can use any personal photo; the processing is 100% client-side.
