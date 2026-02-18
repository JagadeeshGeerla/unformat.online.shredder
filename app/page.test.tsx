import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from './page';
import * as FileProcessing from '@/lib/file-processing';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    ShieldCheck: () => <div data-testid="icon-shield" />,
    FileText: () => <div data-testid="icon-file" />,
    Trash2: () => <div data-testid="icon-trash" />,
    Download: () => <div data-testid="icon-download" />,
    RefreshCw: () => <div data-testid="icon-refresh" />,
    AlertTriangle: () => <div data-testid="icon-alert" />,
    CheckCircle2: () => <div data-testid="icon-check" />,
    File: () => <div data-testid="icon-file-generic" />,
    X: () => <div data-testid="icon-x" />,
    Upload: () => <div data-testid="icon-upload" />,
    Camera: () => <div data-testid="icon-camera" />,
    Terminal: () => <div data-testid="icon-terminal" />,
    Shield: () => <div data-testid="icon-shield-new" />
}));

// Mock Link
vi.mock('next/link', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock File Processing
vi.mock('@/lib/file-processing', () => ({
    getFileType: vi.fn(),
    formatBytes: vi.fn((bytes) => `${bytes} B`),
    inspectFile: vi.fn(),
    shredFile: vi.fn()
}));

describe('Home Page Integration', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the initial state correctly', () => {
        render(<Home />);
        expect(screen.getByText(/Metadata Shredder/i)).toBeInTheDocument();
        expect(screen.getByText(/Drag & Drop/i)).toBeInTheDocument();
        expect(screen.getByText(/SYSTEM_LOG_STREAM/i)).toBeInTheDocument();
    });

    it('should handle full shredding flow', async () => {
        // Setup Mocks
        vi.mocked(FileProcessing.getFileType).mockReturnValue('image');
        vi.mocked(FileProcessing.inspectFile).mockResolvedValue([
            { key: 'GPS', value: '12.34, 56.78', riskLevel: 'high' }
        ]);
        vi.mocked(FileProcessing.shredFile).mockResolvedValue(new Blob(['clean'], { type: 'image/jpeg' }));

        render(<Home />);

        // 1. Upload File
        const file = new File(['dummy content'], 'photo.jpg', { type: 'image/jpeg' });
        // Find the hidden input
        const input = document.querySelector('input[type="file"]');
        expect(input).toBeInTheDocument();

        if (input) {
            fireEvent.change(input, { target: { files: [file] } });
        }

        // 2. Verify Inspection Stage
        await waitFor(() => {
            expect(screen.getByText(/photo.jpg/i)).toBeInTheDocument();
        });

        // Wait for metadata to load (Review Stage)
        await waitFor(() => {
            expect(screen.getByText(/12.34, 56.78/i)).toBeInTheDocument();
        });
        expect(screen.getByText(/Potential Privacy Risks Detected/i)).toBeInTheDocument();

        // 3. Initiate Shredding
        const shredButton = screen.getByText(/SHRED METADATA/i);
        fireEvent.click(shredButton);

        // 4. Verify Success Stage
        await waitFor(() => {
            expect(screen.getByText(/File Cleaned Successfully/i)).toBeInTheDocument();
        });
        expect(screen.getByText(/DOWNLOAD FILE/i)).toBeInTheDocument();
    });
});
