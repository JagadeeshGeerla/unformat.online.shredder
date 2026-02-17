'use client';

import { useState, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface DropZoneProps {
    onFileSelect: (file: File) => void;
    className?: string;
    disabled?: boolean;
}

export function DropZone({ onFileSelect, className, disabled }: DropZoneProps) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (disabled) return;
        setIsDragOver(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (disabled) return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    }, [onFileSelect, disabled]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
        }
    }, [onFileSelect, disabled]);

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={twMerge(
                'relative group cursor-pointer transition-all duration-300',
                'border-2 border-dashed rounded-xl p-12 text-center',
                'flex flex-col items-center justify-center gap-4',
                isDragOver
                    ? 'border-emerald-500 bg-emerald-500/5 scale-[1.02] shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                    : 'border-neutral-700 bg-neutral-900/50 hover:border-neutral-500 hover:bg-neutral-800/50',
                disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
                className
            )}
        >
            <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                onChange={handleChange}
                disabled={disabled}
            />

            <div className={clsx(
                "p-4 rounded-full transition-colors duration-300",
                isDragOver ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-800 text-neutral-400 group-hover:bg-neutral-700 group-hover:text-neutral-200"
            )}>
                <Upload size={32} />
            </div>

            <div className="space-y-1">
                <h3 className="text-lg font-medium text-neutral-200">
                    {isDragOver ? 'DROP_FILE_HERE' : 'Drag & Drop or Click to Upload'}
                </h3>
                <p className="text-sm text-neutral-500 font-mono">
                    Supports JPG, PNG, PDF, TXT, LOG, JSON
                </p>
            </div>

            {isDragOver && (
                <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500 rounded-xl animate-pulse" />
            )}
        </div>
    );
}
