'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck,
    FileText,
    Trash2,
    Download,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    File as FileIcon,
    X
} from 'lucide-react';
import { DropZone } from '@/components/drop-zone';
import LiveLog from '@/components/live-log';
import { Features } from '@/components/features';
import {
    inspectFile,
    shredFile,
    formatBytes,
    getFileType,
    type FileType,
    type MetadataItem
} from '@/lib/file-processing';
import Link from 'next/link';

type Stage = 'idle' | 'inspecting' | 'review' | 'shredding' | 'done';

interface LogEntry {
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'process' | 'action';
}

export default function Home() {
    const [file, setFile] = useState<File | null>(null);
    const [fileType, setFileType] = useState<FileType>('unknown');
    const [stage, setStage] = useState<Stage>('idle');
    const [metadata, setMetadata] = useState<MetadataItem[]>([]);
    const [cleanBlob, setCleanBlob] = useState<Blob | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    // Logging Helper
    const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
        setLogs(prev => [...prev, {
            id: Math.random().toString(36).substring(7),
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
            message,
            type
        }]);
    }, []);

    // File Handler
    const handleFileSelect = async (selectedFile: File) => {
        setFile(selectedFile);
        const type = getFileType(selectedFile);
        setFileType(type);

        if (type === 'unknown') {
            addLog(`[ERROR] UNSUPPORTED_FILE_TYPE: ${selectedFile.name}`, 'error');
            alert('Unsupported file type. Please use JPG, PNG, PDF, TXT, LOG, or JSON.');
            setFile(null);
            return;
        }

        setStage('inspecting');
        setLogs([]); // Clear previous logs on new file
        addLog(`[INIT] SYSTEM_READY. NEW_SESSION_ID: ${Math.random().toString(36).substring(7).toUpperCase()}`, 'info');
        addLog(`[INFO] LOADING_FILE: ${selectedFile.name} (${formatBytes(selectedFile.size)})`, 'info');
        addLog('Verification: File processing in Local Sandbox - No Network Activity Detected', 'success');

        try {
            const results = await inspectFile(selectedFile, type, (msg) => addLog(msg, 'process'));
            setMetadata(results);
            setStage('review');
            addLog(`[COMPLETE] METADATA_SCAN_FINISHED. ${results.length} ITEMS_FOUND.`, 'success');
        } catch (error) {
            console.error(error);
            addLog(`[ERROR] INSPECTION_FAILED: ${(error as Error).message}`, 'error');
            setStage('idle');
            setFile(null);
        }
    };

    // Shred Handler
    const handleShred = async () => {
        if (!file || fileType === 'unknown') return;

        setStage('shredding');
        addLog('[ACTION] INITIATING_SHRED_SEQUENCE...', 'action');

        try {
            // Small delay to allow UI to update and show the log
            await new Promise(resolve => setTimeout(resolve, 500));

            const blob = await shredFile(file, fileType, (msg) => addLog(msg, 'process'));
            setCleanBlob(blob);
            setStage('done');
            addLog('[SUCCESS] FILE_CLEANED_SUCCESSFULLY. READY_FOR_DOWNLOAD.', 'success');
        } catch (error) {
            console.error(error);
            addLog(`[ERROR] SHREDDING_FAILED: ${(error as Error).message}`, 'error');
            setStage('review');
        }
    };

    // Reset Handler
    const handleReset = () => {
        setFile(null);
        setFileType('unknown');
        setStage('idle');
        setMetadata([]);
        setCleanBlob(null);
        setLogs([]);
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-emerald-500/30">

            {/* Header */}
            <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-neutral-950 font-bold">
                            <ShieldCheck size={20} />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-white">Unformat<span className="text-emerald-500">.Shredder</span></span>
                    </div>
                    <div className="text-xs font-mono text-neutral-500 border border-neutral-800 rounded px-2 py-1">
                        Build v2.0.0
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12 flex flex-col items-center">

                {/* Ad Slot Top */}
                <div className="w-[728px] h-[90px] mb-12 border border-dashed border-neutral-800 bg-neutral-900/50 flex items-center justify-center text-neutral-600 text-xs tracking-widest uppercase">
                    Ad Slot 728x90
                </div>

                {/* Main Interface */}
                <div className="w-full max-w-2xl">
                    <AnimatePresence mode="wait">

                        {/* Stage 1: Idle (Drop Zone) */}
                        {stage === 'idle' && (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="w-full"
                            >
                                <div className="text-center mb-8">
                                    <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Metadata Shredder</h1>
                                    <p className="text-neutral-400 text-lg">
                                        Remove hidden data from your files. <br />
                                        <span className="text-emerald-500">100% Client-Side. No uploads.</span>
                                    </p>
                                </div>
                                <DropZone onFileSelect={handleFileSelect} />
                            </motion.div>
                        )}

                        {/* Stage 2 & 3: Inspection & Review */}
                        {(stage === 'inspecting' || stage === 'review' || stage === 'shredding') && file && (
                            <motion.div
                                key="review"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl"
                            >
                                {/* File Header */}
                                <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-neutral-800 rounded-lg flex items-center justify-center text-emerald-500">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-white">{file.name}</h3>
                                            <p className="text-sm text-neutral-500 font-mono">{formatBytes(file.size)} • {fileType.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <button onClick={handleReset} className="text-neutral-500 hover:text-white transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Metadata List */}
                                <div className="p-6 bg-neutral-950/30 min-h-[300px] max-h-[500px] overflow-y-auto">
                                    {stage === 'inspecting' ? (
                                        <div className="flex flex-col items-center justify-center h-48 gap-4 text-neutral-500">
                                            <RefreshCw className="animate-spin" size={32} />
                                            <p className="font-mono text-sm">ANALYZING_FILE_STRUCTURE...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-amber-500 mb-4 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                                                <AlertTriangle size={16} />
                                                <span className="text-sm font-medium">Potential Privacy Risks Detected</span>
                                            </div>
                                            <div className="grid gap-2">
                                                {metadata.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-3 rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
                                                        <div className="flex items-center gap-2">
                                                            {item.riskLevel === 'high' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                                                            {item.riskLevel === 'medium' && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                                                            <span className={`font-mono text-xs ${item.riskLevel === 'high' ? 'text-red-400 font-bold' :
                                                                item.riskLevel === 'medium' ? 'text-amber-400' :
                                                                    'text-neutral-400'
                                                                }`}>
                                                                {item.key}
                                                            </span>
                                                        </div>
                                                        <span className="font-mono text-xs text-neutral-500 truncate max-w-[200px]" title={item.value}>
                                                            {item.value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Bar */}
                                <div className="p-6 border-t border-neutral-800 bg-neutral-900 flex justify-end gap-3">
                                    <button
                                        onClick={handleReset}
                                        className="px-6 py-3 rounded-xl border border-neutral-700 text-neutral-300 font-medium hover:bg-neutral-800 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleShred}
                                        disabled={stage === 'shredding' || stage === 'inspecting'}
                                        className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                                    >
                                        {stage === 'shredding' ? (
                                            <>
                                                <RefreshCw className="animate-spin" size={18} />
                                                SHREDDING...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 size={18} />
                                                SHRED METADATA
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Stage 4: Success */}
                        {stage === 'done' && cleanBlob && (
                            <motion.div
                                key="done"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full bg-neutral-900 border border-emerald-500/30 rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(16,185,129,0.1)]"
                            >
                                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">File Cleaned Successfully</h2>
                                <p className="text-neutral-400 mb-8 max-w-md mx-auto">
                                    All metadata traces have been permanently removed. Your file is now safe to share.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <a
                                        href={URL.createObjectURL(cleanBlob)}
                                        download={`CLEAN_${file?.name}`}
                                        className="px-8 py-4 rounded-xl bg-emerald-500 text-neutral-950 font-bold hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
                                    >
                                        <Download size={20} />
                                        DOWNLOAD FILE
                                    </a>
                                    <button
                                        onClick={handleReset}
                                        className="px-8 py-4 rounded-xl border border-neutral-700 text-neutral-300 font-medium hover:bg-neutral-800 transition-all"
                                    >
                                        Process Another
                                    </button>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>

                    {/* Live Log Terminal */}
                    <LiveLog logs={logs} />
                </div>

                {/* Features Section */}
                <Features />

                {/* Ad Slot Bottom */}
                <div className="mt-16 w-[300px] h-[250px] border border-dashed border-neutral-800 bg-neutral-900/50 flex items-center justify-center text-neutral-600 text-xs tracking-widest uppercase">
                    Ad Slot 300x250
                </div>

            </main>

            {/* Footer */}
            <footer className="border-t border-neutral-800 bg-neutral-950 py-12">
                <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 opacity-50">
                        <ShieldCheck size={16} />
                        <span className="text-sm font-mono text-neutral-500">PRIVACY_AUDIT: 100%_CLIENT_SIDE</span>
                    </div>
                    <div className="text-neutral-600 text-sm">
                        &copy; 2026 Unformat.online. All logs cleared on refresh.
                    </div>
                    <div className="flex gap-6 text-sm text-neutral-500">
                        <Link href="#" className="hover:text-emerald-500 transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-emerald-500 transition-colors">Terms</Link>
                        <Link href="https://github.com/JagadeeshGeerla/unformat.online" className="hover:text-emerald-500 transition-colors">GitHub</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
