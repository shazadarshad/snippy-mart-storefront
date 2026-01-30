import React from 'react';
import { Download, FolderOpen, Puzzle, ToggleRight, Play, Pin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const DownloadExtension = () => {
    return (
        <div className="min-h-screen bg-background pt-24 pb-16">
            <div className="container px-4 mx-auto max-w-4xl">

                {/* Header Section */}
                <div className="text-center mb-16 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-4">
                        <Puzzle className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight text-foreground">
                        Cursor Smart <span className="gradient-text">Recovery</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        The ultimate companion for your team. Restore access in one click, monitor health, and never get locked out again.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform" onClick={() => window.open('/extension.zip', '_blank')}>
                            <Download className="w-5 h-5 mr-2" />
                            Download v1.0
                        </Button>
                        <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full" onClick={() => document.getElementById('steps')?.scrollIntoView({ behavior: 'smooth' })}>
                            How to Install
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold opacity-60">
                        Requires Google Chrome / Brave / Edge
                    </p>
                </div>

                {/* Steps Section */}
                <div id="steps" className="grid gap-12 relative">
                    {/* Connector Line */}
                    <div className="hidden md:block absolute left-[29px] top-8 bottom-8 w-0.5 bg-border/50 -z-10"></div>

                    <Step
                        number="1"
                        title="Download & Extract"
                        desc="Download the zip file and extract the contents to a folder. Keep this folder purely for the extension."
                        icon={FolderOpen}
                    />

                    <Step
                        number="2"
                        title="Open Extensions Page"
                        desc="In your browser, navigate to the extensions management page."
                        icon={Puzzle}
                        action={
                            <div className="mt-4 p-3 bg-secondary/50 rounded-lg font-mono text-sm text-muted-foreground flex items-center justify-between border border-border/50">
                                <span>chrome://extensions</span>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => navigator.clipboard.writeText('chrome://extensions')}>
                                    <span className="sr-only">Copy</span>
                                    <ExternalLink className="w-3 h-3" />
                                </Button>
                            </div>
                        }
                    />

                    <Step
                        number="3"
                        title="Enable Developer Mode"
                        desc="Toggle the switch in the top-right corner to enable advanced installation options."
                        icon={ToggleRight}
                    />

                    <Step
                        number="4"
                        title="Load Unpacked"
                        desc="Click the 'Load Unpacked' button and select the folder you extracted in Step 1."
                        icon={Play}
                    />

                    <Step
                        number="5"
                        title="Login & Pin"
                        desc="Click the puzzle icon in your toolbar, pin 'Cursor Smart Recovery', and enter your email."
                        icon={Pin}
                        isLast
                    />

                </div>

                {/* Support Section */}
                <Card className="mt-16 bg-card border-border overflow-hidden">
                    <CardContent className="p-8 text-center space-y-4">
                        <h3 className="text-2xl font-bold font-display">Need Help?</h3>
                        <p className="text-muted-foreground">
                            If you encounter any issues or the extension behaves unexpectedly, please contact support.
                        </p>
                        <div className="flex justify-center gap-2">
                            <span className="px-3 py-1 bg-secondary rounded-md text-xs font-mono">support@snippymart.com</span>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};

const Step = ({ number, title, desc, icon: Icon, action, isLast }: { number: string, title: string, desc: string, icon: any, action?: React.ReactNode, isLast?: boolean }) => (
    <div className="flex gap-6 md:gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: `${parseInt(number) * 100}ms` }}>
        <div className="flex-shrink-0 relative">
            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg z-10 relative border-4 border-background ${isLast ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'}`}>
                {number}
            </div>
        </div>
        <div className="pt-2 pb-8 flex-1">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-secondary/50 rounded-lg text-primary">
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold font-display">{title}</h3>
            </div>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">{desc}</p>
            {action}
        </div>
    </div>
);

export default DownloadExtension;
