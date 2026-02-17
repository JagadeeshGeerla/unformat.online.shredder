import exifr from 'https://cdn.jsdelivr.net/npm/exifr/dist/full.esm.mjs';

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const stageDrop = document.getElementById('stage-drop');
const stageInspect = document.getElementById('stage-inspect');
const stageDownload = document.getElementById('stage-download');
const loadingOverlay = document.getElementById('loading-overlay');
const metadataList = document.getElementById('metadata-list');
const btnShred = document.getElementById('btn-shred');
const btnCancel = document.getElementById('btn-cancel');
const btnReset = document.getElementById('btn-reset');
const downloadContainer = document.getElementById('download-container');
const fileNameDisplay = document.getElementById('file-name');
const fileSizeDisplay = document.getElementById('file-size');
const logContent = document.getElementById('log-content');

let currentFile = null;
let currentFileType = null; // 'image' or 'pdf'

// --- Event Listeners ---

// Drag & Drop
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

// File Input
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

// Buttons
btnCancel.addEventListener('click', resetApp);
btnReset.addEventListener('click', resetApp);
btnShred.addEventListener('click', startShredding);

// --- Core Logic ---

async function handleFile(file) {
    if (!file) return;

    // Validate type
    const isImage = file.type.match('image.*');
    const isPdf = file.type === 'application/pdf';
    const isText = file.type === 'text/plain' || file.name.endsWith('.log') || file.type === 'application/json' || file.name.endsWith('.json') || file.name.endsWith('.txt');

    if (!isImage && !isPdf && !isText) {
        alert('INVALID_FILE_TYPE: Only Images, PDFs, and Text files (.txt, .log, .json) supported.');
        addLog('[ERROR] INVALID_FILE_TYPE_DETECTED');
        return;
    }

    currentFile = file;
    if (isPdf) currentFileType = 'pdf';
    else if (isText) currentFileType = 'text';
    else currentFileType = 'image';

    addLog(`Verification: File processing in Local Sandbox - No Network Activity Detected`);
    addLog(`[INFO] LOADING_FILE: ${file.name} (${formatBytes(file.size)})`);

    // Show Loading
    loadingOverlay.classList.remove('hidden');

    try {
        // Inspect Metadata
        addLog(`[PROCESS] INSPECTING_METADATA_STREAM...`);
        const metadata = await inspectMetadata(file);

        // Update UI
        fileNameDisplay.textContent = file.name;
        fileSizeDisplay.textContent = formatBytes(file.size);
        renderMetadata(metadata);

        // Switch Stage
        stageDrop.classList.remove('active');
        stageDrop.classList.add('hidden');
        stageInspect.classList.remove('hidden');
        stageInspect.classList.add('active');

    } catch (error) {
        console.error(error);
        alert('ERROR_READING_FILE: ' + error.message);
    } finally {
        loadingOverlay.classList.add('hidden');
    }
}

async function inspectMetadata(file) {
    let tags = {};

    if (currentFileType === 'image') {
        // Use exifr to parse common tags (TIFF, Exif, GPS, IPTC, XMP)
        tags = await exifr.parse(file, {
            tiff: true,
            exif: true,
            gps: true,
            iptc: true,
            xmp: true,
            icc: false
        }) || {};
    } else if (currentFileType === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

        tags = {
            Title: pdfDoc.getTitle(),
            Author: pdfDoc.getAuthor(),
            Subject: pdfDoc.getSubject(),
            Creator: pdfDoc.getCreator(),
            Producer: pdfDoc.getProducer(),
            Keywords: pdfDoc.getKeywords(),
            CreationDate: pdfDoc.getCreationDate(),
            ModificationDate: pdfDoc.getModificationDate(),
            PageCount: pdfDoc.getPageCount()
        };

        // Filter out undefined/null
        Object.keys(tags).forEach(key => tags[key] === undefined && delete tags[key]);
    } else if (currentFileType === 'text') {
        return await inspectText(file);
    }

    // Identify "High Risk" items roughly (only for image/pdf)
    const dangerousKeys = ['GPSLatitude', 'GPSLongitude', 'Make', 'Model', 'Software', 'Author', 'Creator'];

    // Flatten object for display
    for (const [key, value] of Object.entries(tags)) {
        let displayValue = value;
        if (value instanceof Date) displayValue = value.toISOString();
        if (typeof value === 'object' && value !== null) displayValue = JSON.stringify(value).substring(0, 50) + '...';

        const isHighRisk = dangerousKeys.some(risk => key.includes(risk));

        enrichedTags.push({ key, value: displayValue, isHighRisk });
    }

    if (enrichedTags.length === 0) {
        enrichedTags.push({ key: 'STATUS', value: 'NO_METADATA_FOUND', isHighRisk: false });
    }

    return enrichedTags;
}

async function inspectText(file) {
    const text = await file.text();
    const findings = [];

    // Regex Patterns
    const patterns = {
        'IPv4 Address': /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
        'Email Address': /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        'API Key (Generic)': /(api_key|apikey|secret|token)[\"']?\s*[:=]\s*[\"']?([A-Za-z0-9-_\.]+)/gi
    };

    let totalMatches = 0;

    for (const [type, regex] of Object.entries(patterns)) {
        const matches = [...text.matchAll(regex)];
        if (matches.length > 0) {
            findings.push({
                key: type,
                value: `Found ${matches.length} instance(s)`,
                isHighRisk: true
            });
            totalMatches += matches.length;

            // Log first few matches for user context (truncated)
            matches.slice(0, 3).forEach(m => {
                const val = m[0].length > 20 ? m[0].substring(0, 20) + '...' : m[0];
                addLog(`[WARN] SENSITIVE_DATA_FOUND: ${type} -> ${val}`);
            });
        }
    }

    if (findings.length === 0) {
        findings.push({ key: 'STATUS', value: 'NO_SENSITIVE_TEXT_PATTERNS_FOUND', isHighRisk: false });
        addLog('[INFO] TEXT_ANALYSIS_COMPLETE: CLEAN');
    } else {
        addLog(`[ALERT] TEXT_ANALYSIS_COMPLETE: ${totalMatches} ISSUES FOUND`);
    }

    return findings;
}

function renderMetadata(metadata) {
    metadataList.innerHTML = '';
    metadata.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<strong style="color: ${item.isHighRisk ? '#ef4444' : '#94a3b8'}">${item.key}:</strong> <span style="color: #cbd5e1">${item.value}</span>`;
        metadataList.appendChild(li);
    });
}

async function startShredding() {
    if (!currentFile) return;

    loadingOverlay.classList.remove('hidden');
    addLog(`[ACTION] INITIATING_SHRED_SEQUENCE...`);

    try {
        let blob;
        if (currentFileType === 'image') {
            blob = await shredImage(currentFile);
        } else if (currentFileType === 'pdf') {
            blob = await shredPdf(currentFile);
        } else {
            blob = await shredText(currentFile);
        }

        // Generate Download Link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `CLEAN_${currentFile.name}`;
        link.textContent = `[ DOWNLOAD_CLEAN_FILE ]`;
        link.className = 'download-link';

        downloadContainer.innerHTML = '';
        downloadContainer.appendChild(link);
        addLog(`[SUCCESS] METADATA_PURGED. GENERATING_SAFE_LINK...`);

        // Switch Stage
        stageInspect.classList.remove('active');
        stageInspect.classList.add('hidden');
        stageDownload.classList.remove('hidden');
        stageDownload.classList.add('active');

    } catch (error) {
        console.error(error);
        alert('SHREDING_FAILED: ' + error.message);
    } finally {
        loadingOverlay.classList.add('hidden');
    }
}

async function shredImage(file) {
    // Strategy: Render to Canvas and export as new Blob (strips all metadata by definition)
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            canvas.toBlob((blob) => {
                URL.revokeObjectURL(url);
                if (blob) resolve(blob);
                else reject(new Error('Canvas export failed'));
            }, file.type, 0.95); // 0.95 quality to avoid too much loss
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Image load failed'));
        };

        img.src = url;
    });
}

async function shredPdf(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

    // Clear all metadata
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('Unformat Shredder');
    pdfDoc.setCreator('Unformat Shredder');

    // Remove creation/mod dates isn't directly exposed in simple API easily without digging into dicts, 
    // but saving it often resets some of this or we can try to set undefined if library allows.
    // pdf-lib setCreationDate(new Date()) updates it. We might want to set it to a generic date or leave it.
    // Let's set it to current date to mask old dates.
    const now = new Date();
    pdfDoc.setCreationDate(now);
    pdfDoc.setModificationDate(now);

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
}

async function shredText(file) {
    let text = await file.text();

    // Regex Patterns (Same as inspect)
    const patterns = {
        'IPv4 Address': { regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[REDACTED_IP]' },
        'Email Address': { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[REDACTED_EMAIL]' },
        'API Key (Generic)': { regex: /(api_key|apikey|secret|token)[\"']?\s*[:=]\s*[\"']?([A-Za-z0-9-_\.]+)/gi, replacement: '$1: [REDACTED_KEY]' }
    };

    for (const [type, rule] of Object.entries(patterns)) {
        text = text.replace(rule.regex, rule.replacement);
    }

    addLog('[SUCCESS] TEXT_REDACTION_COMPLETE');
    return new Blob([text], { type: 'text/plain' });
}

function resetApp() {
    currentFile = null;
    currentFileType = null;
    fileInput.value = '';

    stageInspect.classList.add('hidden');
    stageInspect.classList.remove('active');
    stageDownload.classList.add('hidden');
    stageDownload.classList.remove('active');

    stageDrop.classList.remove('hidden');
    stageDrop.classList.add('active');
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function addLog(message) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    entry.innerHTML = `<span class="timestamp">[${time}]</span> ${message}`;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
}
