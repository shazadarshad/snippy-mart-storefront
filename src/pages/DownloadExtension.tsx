
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Download, ShieldCheck, Zap, Terminal } from 'lucide-react';
import { useEffect, useState } from 'react';

const DownloadExtension = () => {
    const [downloadUrl, setDownloadUrl] = useState<string>('');

    useEffect(() => {
        const { data } = supabase.storage
            .from('extension-artifacts')
            .getPublicUrl('latest.zip');
        setDownloadUrl(data.publicUrl);
    }, []);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/20 overflow-hidden font-display relative">
            {/* Background Gradients */}
            <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 py-20 relative z-10 flex flex-col items-center justify-center min-h-screen">

                {/* Hero Section */}
                <div className="text-center space-y-6 max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4 shadow-xl">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-sm font-mono tracking-wide text-gray-300">SYSTEM OPERATIONAL v1.0.0</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 pb-4">
                        Cursor Smart Recovery.
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        The automated guardian for your development workflow. <br />
                        Instantly restores team access, limits velocity, and keeps you coding.
                    </p>

                    <div className="pt-8 flex flex-col md:flex-row gap-4 justify-center items-center">
                        <Button
                            size="lg"
                            className="h-14 px-8 text-lg rounded-full bg-white text-black hover:bg-gray-200 transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] font-bold group"
                            onClick={() => window.location.href = downloadUrl}
                        >
                            <Download className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                            Download Extension
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-14 px-8 text-lg rounded-full border-white/20 bg-white/5 backdrop-blur hover:bg-white/10 transition-all font-bold"
                            onClick={() => document.getElementById('install-guide')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Installation Guide
                        </Button>
                    </div>
                </div>



                {/* Expanded Features Section */}
                <div className="mt-32 w-full max-w-6xl">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                            Uninterrupted Coding Flow.
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Stop worrying about access limits. The system handles the logistics while you focus on shipping code.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all group">
                            <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Zap className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Instant Resurrection</h3>
                            <p className="text-gray-400 leading-relaxed">
                                The moment you are removed from a team, the extension detects it and instantly invites you to a fresh, healthy team. typically in under 2 seconds.
                            </p>
                        </div>

                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all group">
                            <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Intelligent Stealth</h3>
                            <p className="text-gray-400 leading-relaxed">
                                We don't just spam invites. The system "heals" teams, manages velocity limits (users/24h), and adds random delays to mimic human behavior and avoid detection.
                            </p>
                        </div>

                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-green-500/30 transition-all group">
                            <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Terminal className="w-6 h-6 text-green-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Zero Config Required</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Install it and forget it. It runs silently in the background. No toggles to flip, no settings to manage. It just works when you need it most.
                            </p>
                        </div>

                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-yellow-500/30 transition-all group">
                            <div className="h-12 w-12 rounded-xl bg-yellow-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Download className="w-6 h-6 text-yellow-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Auto-Updating Core</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Security patches and new evasion logic are pushed automatically. Your extension stays ahead of the curve without manual re-installs.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Installation Guide */}
                <div id="install-guide" className="mt-32 max-w-4xl w-full animate-in fade-in duration-1000">
                    <h2 className="text-3xl font-bold text-center mb-12">Installation in 3 Steps</h2>
                    <div className="space-y-4">
                        {[
                            { step: "01", title: "Download & Extract", desc: "Download the zip file above and extract it to a folder (e.g., Downloads/cursor-extension)." },
                            { step: "02", title: "Open Extensions Page", desc: "Go to chrome://extensions in your browser and enable 'Developer Mode' (top right)." },
                            { step: "03", title: "Load Unpacked", desc: "Click 'Load Unpacked' and select the folder you just extracted. Pin the extension!" }
                        ].map((step, i) => (
                            <div key={i} className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                <span className="text-6xl font-black text-white/5 font-mono">{step.step}</span>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-xl font-bold text-white mb-1">{step.title}</h3>
                                    <p className="text-gray-400">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-20 text-center text-gray-500 text-sm">
                    © 2026 Snippy Mart. Secure Distribution Channel.
                </div>
            </div>
        </div>
    );
};

export default DownloadExtension;
