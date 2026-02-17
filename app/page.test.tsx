import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

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

describe('Home Page', () => {
    it('should render the main title', () => {
        render(<Home />);
        expect(screen.getByText(/Metadata Shredder/i)).toBeInTheDocument();
        const clientSideTexts = screen.getAllByText(/100% Client-Side/i);
        expect(clientSideTexts.length).toBeGreaterThan(0);
    });

    it('should show the drop zone initially', () => {
        render(<Home />);
        // DropZone text
        expect(screen.getByText(/Drag & Drop or Click to Upload/i)).toBeInTheDocument();
    });

    it('should show the live log terminal', () => {
        render(<Home />);
        expect(screen.getByText(/SYSTEM_LOG_STREAM/i)).toBeInTheDocument();
    });
});
