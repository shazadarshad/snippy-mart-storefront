import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Download, ShieldCheck, Zap, Terminal, FileDown, Chrome, UserPlus } from 'lucide-react';
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
                        <span className="text-sm font-mono tracking-wide text-gray-300">ELITE ACCESS v1.0.0</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 pb-4">
                        Elite Auto-Login.
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        The ultimate access pass for your purchased products. <br />
                        One click to securely auto-login to all your Snippy Mart services.
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

                {/* Installation Guide */}
                <div id="install-guide" className="mt-32 max-w-5xl w-full animate-in fade-in duration-1000">
                    <h2 className="text-4xl font-black text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        Get Started in 3 Steps
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all duration-300 flex flex-col items-center text-center mt-6">
                            <div className="absolute -top-6 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl font-black shadow-lg shadow-blue-500/25 border-4 border-black">
                                1
                            </div>
                            <div className="h-16 w-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 mt-2 group-hover:scale-110 group-hover:bg-blue-500/30 transition-all">
                                <FileDown className="w-8 h-8 text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-white">Download & Extract</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                Download the ZIP and extract it to a folder on your computer.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300 flex flex-col items-center text-center mt-6">
                            <div className="absolute -top-6 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl font-black shadow-lg shadow-purple-500/25 border-4 border-black">
                                2
                            </div>
                            <div className="h-16 w-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 mt-2 group-hover:scale-110 group-hover:bg-purple-500/30 transition-all">
                                <Chrome className="w-8 h-8 text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-white">Load in Chrome</h3>
                            <p className="text-gray-400 leading-relaxed text-sm w-full">
                                Go to <span className="text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded font-mono inline-block break-all">chrome://extensions</span>, turn on Developer mode, click <span className="text-white font-medium">Load unpacked</span>, and select the folder.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-green-500/50 hover:bg-white/10 transition-all duration-300 flex flex-col items-center text-center mt-6">
                            <div className="absolute -top-6 w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-xl font-black shadow-lg shadow-green-500/25 border-4 border-black">
                                3
                            </div>
                            <div className="h-16 w-16 rounded-2xl bg-green-500/20 flex items-center justify-center mb-6 mt-2 group-hover:scale-110 group-hover:bg-green-500/30 transition-all">
                                <UserPlus className="w-8 h-8 text-green-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-white">Register & Access</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                Click the Elite icon, register your User ID, and auto-login to your purchased products instantly!
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-32 text-center text-gray-500 text-sm">
                    © 2026 Snippy Mart. Secure Distribution Channel.
                </div>
            </div>
        </div>
    );
};

export default DownloadExtension;
