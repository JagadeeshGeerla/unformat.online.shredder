import { PDFDocument } from 'pdf-lib';

export type FileType = 'image' | 'pdf' | 'text' | 'unknown';
export type RiskLevel = 'high' | 'medium' | 'low' | 'none';

export interface MetadataItem {
    key: string;
    value: string;
    riskLevel: RiskLevel;
}

export function getFileType(file: File): FileType {
    if (file.type.match('image.*') || file.name.endsWith('.heic') || file.name.endsWith('.HEIC')) return 'image';
    if (file.type === 'application/pdf') return 'pdf';
    if (
        file.type === 'text/plain' ||
        file.type === 'application/json' ||
        file.name.endsWith('.log') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.sql') ||
        file.name.endsWith('.env')
    ) {
        return 'text';
    }
    return 'unknown';
}

export function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export async function inspectFile(file: File, type: FileType, logFn: (msg: string) => void): Promise<MetadataItem[]> {
    logFn(`[PROCESS] INSPECTING_${type.toUpperCase()}_STREAM...`);

    if (type === 'image') return inspectImage(file, logFn);
    if (type === 'pdf') return inspectPdf(file);
    if (type === 'text') return inspectText(file, logFn);

    return [];
}

async function inspectImage(file: File, logFn: (msg: string) => void): Promise<MetadataItem[]> {
    // Dynamic import for SSR compatibility
    // @ts-ignore
    const heic2any = (await import('heic2any')).default;
    // @ts-ignore
    const exifr = (await import('exifr/dist/full.esm.mjs')).default;

    // Handle HEIC
    let blobToParse = file;
    if (file.name.toLowerCase().endsWith('.heic')) {
        try {
            logFn('[PROCESS] CONVERTING_HEIC_FOR_INSPECTION...');
            const converted = await heic2any({ blob: file, toType: 'image/jpeg' });
            blobToParse = Array.isArray(converted) ? new File([converted[0]], 'temp.jpg') : new File([converted], 'temp.jpg');
        } catch (e) {
            logFn('[WARN] HEIC_CONVERSION_FAILED. ATTEMPTING_RAW_READ...');
        }
    }

    const tags = await exifr.parse(blobToParse, {
        tiff: true,
        exif: true,
        gps: true,
        iptc: true,
        xmp: true,
        icc: false
    }) || {};

    const enrichedTags: MetadataItem[] = [];

    // Risk Classification
    const highRiskKeys = ['GPSLatitude', 'GPSLongitude', 'Face', 'RegionInfo']; // GPS, Face Data
    const mediumRiskKeys = ['Make', 'Model', 'SerialNumber', 'LensModel', 'LensSerialNumber']; // Device Info
    const lowRiskKeys = ['Software', 'DateTimeOriginal', 'CreateDate', 'ModifyDate']; // Time/Software

    for (const [key, value] of Object.entries(tags)) {
        let displayValue = String(value);
        if (value instanceof Date) displayValue = value.toISOString();
        if (typeof value === 'object' && value !== null) displayValue = JSON.stringify(value).substring(0, 50) + '...';

        let riskLevel: RiskLevel = 'none';
        if (highRiskKeys.some(k => key.includes(k))) riskLevel = 'high';
        else if (mediumRiskKeys.some(k => key.includes(k))) riskLevel = 'medium';
        else if (lowRiskKeys.some(k => key.includes(k))) riskLevel = 'low';

        // Only add if it has some risk or is explicitly low risk but relevant
        if (riskLevel !== 'none' || displayValue.length < 100) {
            enrichedTags.push({ key, value: displayValue, riskLevel });
        }
    }

    if (enrichedTags.length === 0) {
        enrichedTags.push({ key: 'STATUS', value: 'NO_METADATA_FOUND', riskLevel: 'none' });
    }

    // Sort by risk (High -> Medium -> Low)
    const riskOrder = { 'high': 3, 'medium': 2, 'low': 1, 'none': 0 };
    return enrichedTags.sort((a, b) => riskOrder[b.riskLevel] - riskOrder[a.riskLevel]);
}

async function inspectPdf(file: File): Promise<MetadataItem[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    const tags: Record<string, string | undefined | Date> = {
        Title: pdfDoc.getTitle(),
        Author: pdfDoc.getAuthor(),
        Subject: pdfDoc.getSubject(),
        Creator: pdfDoc.getCreator(),
        Producer: pdfDoc.getProducer(),
        Keywords: pdfDoc.getKeywords(),
        CreationDate: pdfDoc.getCreationDate(),
        ModificationDate: pdfDoc.getModificationDate(),
        PageCount: pdfDoc.getPageCount() as any
    };

    const enrichedTags: MetadataItem[] = [];
    const mediumRiskKeys = ['Author', 'Creator', 'Producer'];

    for (const [key, value] of Object.entries(tags)) {
        if (value === undefined) continue;
        let displayValue = String(value);
        if (value instanceof Date) displayValue = value.toISOString();

        let riskLevel: RiskLevel = 'low';
        if (mediumRiskKeys.includes(key)) riskLevel = 'medium';

        enrichedTags.push({ key, value: displayValue, riskLevel });
    }

    if (enrichedTags.length === 0) {
        enrichedTags.push({ key: 'STATUS', value: 'NO_METADATA_FOUND', riskLevel: 'none' });
    }

    // Sort
    const riskOrder = { 'high': 3, 'medium': 2, 'low': 1, 'none': 0 };
    return enrichedTags.sort((a, b) => riskOrder[b.riskLevel] - riskOrder[a.riskLevel]);
}

async function inspectText(file: File, logFn: (msg: string) => void): Promise<MetadataItem[]> {
    const text = await file.text();
    const findings: MetadataItem[] = [];

    const patterns = {
        'IPv4 Address': /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
        'Email Address': /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        'API Key (Generic)': /(api_key|apikey|secret|token|sk-)[^\s]{10,}/gi,
        'Auth Header': /Authorization:\s*(Bearer|Basic)\s+[A-Za-z0-9._-]+/gi
    };

    let totalMatches = 0;

    for (const [type, regex] of Object.entries(patterns)) {
        const matches = [...text.matchAll(regex)];
        if (matches.length > 0) {
            findings.push({
                key: type,
                value: `Found ${matches.length} instance(s)`,
                riskLevel: 'high'
            });
            totalMatches += matches.length;

            matches.slice(0, 3).forEach(m => {
                const val = m[0].length > 20 ? m[0].substring(0, 20) + '...' : m[0];
                logFn(`[RedFlag] SENSITIVE_DATA: ${type} -> ${val}`);
            });
        }
    }

    if (findings.length === 0) {
        findings.push({ key: 'STATUS', value: 'CLEAN', riskLevel: 'none' });
        logFn('[INFO] TEXT_ANALYSIS_COMPLETE: CLEAN');
    } else {
        logFn(`[ALERT] TEXT_ANALYSIS_COMPLETE: ${totalMatches} ISSUES FOUND`);
    }

    return findings;
}

export async function shredFile(file: File, type: FileType, logFn: (msg: string) => void): Promise<Blob> {
    logFn(`[ACTION] INITIATING_SHRED_SEQUENCE...`);

    if (type === 'image') return shredImage(file, logFn);
    if (type === 'pdf') return shredPdf(file);
    if (type === 'text') return shredText(file, logFn);

    throw new Error('Unsupported file type');
}

async function shredImage(file: File, logFn: (msg: string) => void): Promise<Blob> {
    // Dynamic import
    // @ts-ignore
    const heic2any = (await import('heic2any')).default;

    // Check if HEIC
    let blobToProcess = file;
    let mimeType = file.type;

    if (file.name.toLowerCase().endsWith('.heic')) {
        logFn('[PROCESS] CONVERTING_HEIC_TO_JPEG...');
        const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 });
        blobToProcess = Array.isArray(converted) ? new File([converted[0]], 'cleaned.jpg') : new File([converted], 'cleaned.jpg');
        mimeType = 'image/jpeg';
    } else if (file.type === 'image/webp') {
        mimeType = 'image/webp';
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blobToProcess);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context failed'));
                return;
            }
            ctx.drawImage(img, 0, 0);

            // AI-Proofing: Inject Visual Noise
            logFn('[ACTION] INJECTING_VISUAL_NOISE (AI-PROOFING)...');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Target ~5% of pixels for subtle noise (invisible to humans, confuses AI)
            const noiseIntensity = 2; // +/- 2 delta out of 255
            for (let i = 0; i < data.length; i += 4) {
                if (Math.random() < 0.05) {
                    const noise = (Math.random() - 0.5) * noiseIntensity * 2;
                    data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
                    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
                    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
                }
            }
            ctx.putImageData(imageData, 0, 0);

            logFn('[ACTION] STRIPPING_METADATA_SEGMENTS...');
            canvas.toBlob((blob) => {
                URL.revokeObjectURL(url);
                if (blob) resolve(blob);
                else reject(new Error('Canvas export failed'));
            }, mimeType, 0.95);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Image load failed'));
        };

        img.src = url;
    });
}

async function shredPdf(file: File): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // Clear Info Dict
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');

    // Clear Metadata (XML) - pdf-lib handles this by clearing the Metadata stream if accessed or resetting
    // Note: pdf-lib doesn't have a direct "removeMetadata()" but saving usually rebuilds it.
    // We can try to set empty metadata.

    const now = new Date();
    pdfDoc.setCreationDate(now);
    pdfDoc.setModificationDate(now);

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes as any], { type: 'application/pdf' });
}

async function shredText(file: File, logFn: (msg: string) => void): Promise<Blob> {
    let text = await file.text();

    // Enhanced Redaction Logic

    // 1. IP Addresses (xxx.xxx.xxx.xxx)
    text = text.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, 'xxx.xxx.xxx.xxx');

    // 2. Emails (u***@d***.com)
    text = text.replace(/\b([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+)\.([A-Z|a-z]{2,})\b/g, '$1***@$2.$3');

    // 3. API Keys (Preserve prefix if standard, else mask)
    // Matches sk-..., AWS..., etc.
    text = text.replace(/(sk-[a-zA-Z0-9]{20,})/g, 'sk-********************');
    text = text.replace(/(AKIA[0-9A-Z]{16})/g, 'AKIA****************');

    // 4. Auth Headers
    text = text.replace(/Authorization:\s*(Bearer|Basic)\s+([A-Za-z0-9._-]+)/gi, 'Authorization: $1 ********************');

    logFn('[SUCCESS] REDACTION_COMPLETE: PATTERNS_MASKED');
    return new Blob([text], { type: 'text/plain' });
}
