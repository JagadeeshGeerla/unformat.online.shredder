import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function createPdf() {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const fontSize = 30;

    page.drawText('Unformat.Shredder Sample PDF', {
        x: 50,
        y: height - 4 * fontSize,
        size: fontSize,
    });

    page.drawText('This PDF contains metadata that should be stripped.', {
        x: 50,
        y: height - 6 * fontSize,
        size: 15,
    });

    // Add Metadata
    pdfDoc.setTitle('Sensitive Document Title');
    pdfDoc.setAuthor('John Doe (CEO)');
    pdfDoc.setSubject('Top Secret Project');
    pdfDoc.setKeywords(['confidential', 'internal', 'budget']);
    pdfDoc.setProducer('Adobe Acrobat Pro 2024');
    pdfDoc.setCreator('Microsoft Word');
    pdfDoc.setCreationDate(new Date('2025-01-01T10:00:00Z'));
    pdfDoc.setModificationDate(new Date('2025-02-01T10:00:00Z'));

    const pdfBytes = await pdfDoc.save();

    const outputPath = path.resolve('sample/document/sample.pdf');
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, pdfBytes);

    console.log(`[SUCCESS] Created sample PDF at: ${outputPath}`);
}

createPdf().catch(console.error);
