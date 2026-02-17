import { Camera, FileText, Terminal, Shield } from 'lucide-react';

export function Features() {
    const features = [
        {
            icon: <Camera className="w-6 h-6 text-emerald-500" />,
            title: "Social Safe (Image Mode)",
            description: "Instantly removes GPS, Exif, faces, and device data. Injects invisible \"visual noise\" to AI-proof your photos against tracking, facial recognition, and scraper bots.",
            risks: ["GPS Location", "Exif Data", "Face Data"]
        },
        {
            icon: <FileText className="w-6 h-6 text-blue-500" />,
            title: "Corporate Safe (Document Mode)",
            description: "Cleans hidden metadata from PDFs. Removes author names, editing history, and XML data packets that could reveal sensitive corporate information.",
            risks: ["Author Name", "Edit History", "Software Ver"]
        },
        {
            icon: <Terminal className="w-6 h-6 text-amber-500" />,
            title: "Developer Mode (Log Sanitizer)",
            description: "Auto-redacts sensitive data from logs and configs. Masks IPs, emails, API keys, and auth tokens in .log, .json, .env, and .sql files.",
            risks: ["API Keys", "IP Addresses", "Auth Tokens"]
        }
    ];

    return (
        <div className="w-full max-w-4xl mt-16 grid gap-8">
            <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-white">How it Works</h2>
                <p className="text-neutral-400 max-w-2xl mx-auto">
                    The shredder automatically detects the file type and applies the appropriate cleaning method.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {features.map((feature, idx) => (
                    <div key={idx} className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-xl hover:bg-neutral-900 transition-colors">
                        <div className="mb-4 bg-neutral-950 w-12 h-12 rounded-lg flex items-center justify-center border border-neutral-800">
                            {feature.icon}
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                        <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
                            {feature.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {feature.risks.map((risk, rIdx) => (
                                <span key={rIdx} className="text-[10px] px-2 py-1 rounded bg-neutral-800 text-neutral-500 border border-neutral-700">
                                    {risk}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 p-6 bg-emerald-950/20 border border-emerald-900/50 rounded-xl flex items-start gap-4">
                <div className="bg-emerald-500/10 p-2 rounded-lg">
                    <Shield className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-emerald-400 mb-1">100% Client-Side Privacy</h3>
                    <p className="text-sm text-emerald-200/70">
                        All processing happens directly in your browser's memory. Your files are never uploaded to any server,
                        guaranteeing zero data leakage. You can even use this tool offline.
                    </p>
                </div>
            </div>
        </div>
    );
}
