import { describe, it, expect, vi } from 'vitest';
import { getFileType, inspectFile, shredFile } from './file-processing';

describe('File Processing Logic', () => {

    // File Type Detection
    describe('getFileType', () => {
        it('should identify images', () => {
            const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
            expect(getFileType(file)).toBe('image');

            const heic = new File([''], 'photo.heic', { type: '' });
            expect(getFileType(heic)).toBe('image');
        });

        it('should identify PDFs', () => {
            const file = new File([''], 'test.pdf', { type: 'application/pdf' });
            expect(getFileType(file)).toBe('pdf');
        });

        it('should identify Text/Developer files', () => {
            expect(getFileType(new File([''], 'test.txt', { type: 'text/plain' }))).toBe('text');
            expect(getFileType(new File([''], 'data.json', { type: 'application/json' }))).toBe('text');
            expect(getFileType(new File([''], 'query.sql', { type: '' }))).toBe('text');
            expect(getFileType(new File([''], '.env', { type: '' }))).toBe('text');
        });
    });

    // Text Redaction
    describe('Enhanced Redaction (Shredding)', () => {
        it('should redact IPv4 addresses', async () => {
            const content = 'Server running at 192.168.1.1';
            const file = new File([content], 'server.log', { type: 'text/plain' });
            const logFn = vi.fn();

            const blob = await shredFile(file, 'text', logFn);
            const redactedText = await blob.text();

            expect(redactedText).toContain('xxx.xxx.xxx.xxx');
        });

        it('should redact Email addresses', async () => {
            const content = 'Contact admin@example.com for support.';
            const file = new File([content], 'contact.txt', { type: 'text/plain' });
            const logFn = vi.fn();

            const blob = await shredFile(file, 'text', logFn);
            const redactedText = await blob.text();

            // Check for pattern u***@d***.com
            // Actual logic: admin@example.com -> a***@e***.com depending on regex groups
            // My logic was: '$1***@$2.$3' where $1 is first char, $2 is domain part, $3 is tld
            expect(redactedText).toMatch(/a\*\*\*@example\.com/);
        });

        it('should redact API Keys', async () => {
            const content = 'sk-abcdef1234567890abcdef1234567890';
            const file = new File([content], 'config.json', { type: 'application/json' });
            const logFn = vi.fn();

            const blob = await shredFile(file, 'text', logFn);
            const redactedText = await blob.text();

            expect(redactedText).toContain('sk-********************');
        });

        it('should redact Auth Headers', async () => {
            const content = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
            const file = new File([content], 'request.log', { type: 'text/plain' });
            const logFn = vi.fn();

            const blob = await shredFile(file, 'text', logFn);
            const redactedText = await blob.text();

            expect(redactedText).toContain('Authorization: Bearer ********************');
        });
    });

});
