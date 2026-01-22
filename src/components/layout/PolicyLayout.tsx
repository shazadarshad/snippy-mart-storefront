import { ReactNode } from 'react';
import SEO from '@/components/seo/SEO';
import { FileText, Calendar, MessageCircle } from 'lucide-react';

interface PolicyLayoutProps {
    title: string;
    highlightedWord: string;
    description: string;
    lastUpdated?: string;
    children: ReactNode;
}

const PolicyLayout = ({
    title,
    highlightedWord,
    description,
    lastUpdated,
    children
}: PolicyLayoutProps) => {
    const formattedDate = lastUpdated || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="min-h-screen pt-24 pb-20 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background pointer-events-none" />
            <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[200px] pointer-events-none" />

            <SEO title={title} description={description} />

            <div className="container mx-auto px-4 max-w-4xl relative z-10">
                {/* Header */}
                <div className="mb-10 md:mb-14 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
                        <FileText className="w-4 h-4" />
                        Legal Document
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4">
                        {title} <span className="gradient-text">{highlightedWord}</span>
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Last updated: {formattedDate}</span>
                    </div>
                </div>

                {/* Content Card */}
                <div className="rounded-3xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden">
                    {/* Gradient Top Border */}
                    <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />

                    <div className="p-6 sm:p-8 md:p-12 lg:p-14">
                        {/* Policy Content with Enhanced Styling */}
                        <div className="policy-content space-y-8">
                            {children}
                        </div>
                    </div>
                </div>

                {/* Contact CTA */}
                <div className="mt-12 md:mt-16">
                    <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 border border-[#25D366]/20 text-center">
                        <p className="text-foreground font-semibold text-lg mb-2">
                            Have questions about this policy?
                        </p>
                        <p className="text-muted-foreground text-sm mb-6">
                            We're available 24/7 to help clarify anything
                        </p>
                        <a
                            href="https://wa.me/94787767869"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-bold text-base hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-[#25d366]/20"
                        >
                            <MessageCircle className="w-5 h-5" />
                            Chat with Us on WhatsApp
                        </a>
                    </div>
                </div>
            </div>

            {/* Policy Content Styles */}
            <style>{`
                .policy-content h2 {
                    font-family: var(--font-display), system-ui, sans-serif;
                    font-weight: 700;
                    font-size: 1.35rem;
                    color: hsl(var(--foreground));
                    margin-top: 2.5rem;
                    margin-bottom: 1rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 1px solid hsl(var(--border) / 0.5);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .policy-content h2:first-child {
                    margin-top: 0;
                }
                
                .policy-content p {
                    color: hsl(var(--muted-foreground));
                    line-height: 1.8;
                    font-size: 0.95rem;
                    margin-bottom: 1rem;
                }
                
                .policy-content p:last-child {
                    margin-bottom: 0;
                }
                
                .policy-content ul {
                    margin: 1.25rem 0;
                    padding-left: 0;
                    list-style: none;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                
                .policy-content li {
                    color: hsl(var(--muted-foreground));
                    line-height: 1.7;
                    font-size: 0.95rem;
                    padding: 0.875rem 1rem 0.875rem 3rem;
                    background: hsl(var(--secondary) / 0.3);
                    border-radius: 0.75rem;
                    border: 1px solid hsl(var(--border) / 0.3);
                    position: relative;
                    transition: all 0.2s ease;
                }
                
                .policy-content li:hover {
                    background: hsl(var(--secondary) / 0.5);
                    border-color: hsl(var(--primary) / 0.2);
                }
                
                .policy-content li::before {
                    content: '';
                    position: absolute;
                    left: 1rem;
                    top: 1.1rem;
                    width: 8px;
                    height: 8px;
                    background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
                    border-radius: 50%;
                }
                
                .policy-content strong {
                    color: hsl(var(--foreground));
                    font-weight: 600;
                }
                
                .policy-content a {
                    color: hsl(var(--primary));
                    font-weight: 500;
                    text-decoration: none;
                    transition: opacity 0.2s;
                }
                
                .policy-content a:hover {
                    opacity: 0.8;
                    text-decoration: underline;
                }
                
                .policy-content ol {
                    margin: 1.25rem 0;
                    padding-left: 0;
                    list-style: none;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    counter-reset: policy-counter;
                }
                
                .policy-content ol li {
                    counter-increment: policy-counter;
                }
                
                .policy-content ol li::before {
                    content: counter(policy-counter);
                    width: 22px;
                    height: 22px;
                    background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                @media (min-width: 768px) {
                    .policy-content h2 {
                        font-size: 1.5rem;
                    }
                    
                    .policy-content p,
                    .policy-content li {
                        font-size: 1rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default PolicyLayout;
