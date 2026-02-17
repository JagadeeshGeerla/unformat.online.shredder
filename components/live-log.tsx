'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogEntry {
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'process' | 'action';
}

interface LiveLogProps {
    logs: LogEntry[];
}

export default function LiveLog({ logs }: LiveLogProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="w-full max-w-2xl mt-8 rounded-lg overflow-hidden border border-neutral-800 bg-black shadow-2xl">
            <div className="bg-neutral-900 px-3 py-1 border-b border-neutral-800 flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-400 tracking-wider">&gt;&gt; SYSTEM_LOG_STREAM</span>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-neutral-700"></div>
                    <div className="w-2 h-2 rounded-full bg-neutral-700"></div>
                    <div className="w-2 h-2 rounded-full bg-neutral-700"></div>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="h-48 overflow-y-auto p-3 font-mono text-xs space-y-1 scrollbar-custom"
            >
                <AnimatePresence initial={false}>
                    {logs.map((log) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-start gap-2 break-all"
                        >
                            <span className="text-neutral-500 shrink-0">[{log.timestamp}]</span>
                            <span className={getColor(log.type)}>{log.message}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {logs.length === 0 && (
                    <div className="text-neutral-600 italic">Waiting for input stream...</div>
                )}
            </div>
        </div>
    );
}

function getColor(type: LogEntry['type']) {
    switch (type) {
        case 'error': return 'text-red-500';
        case 'warning': return 'text-amber-500';
        case 'success': return 'text-emerald-500';
        case 'process': return 'text-blue-400';
        case 'action': return 'text-purple-400';
        default: return 'text-neutral-300';
    }
}
