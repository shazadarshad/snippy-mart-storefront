import { ReactNode } from 'react';
import SEO from '@/components/seo/SEO';

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
            <div className="absolute top-1/4 left-0 w-72 h-72 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

            <SEO title={title} description={description} />

            <div className="container mx-auto px-4 max-w-4xl relative z-10">
                {/* Header */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4">
                        {title} <span className="gradient-text">{highlightedWord}</span>
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Last updated: {formattedDate}
                    </p>
                </div>

                {/* Content Card */}
                <div className="rounded-3xl bg-card/60 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden">
                    <div className="p-6 sm:p-8 md:p-12">
                        <div className="prose prose-lg max-w-none 
              prose-headings:font-display prose-headings:font-bold prose-headings:text-foreground
              prose-h2:text-xl prose-h2:sm:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/50
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-li:text-muted-foreground prose-li:marker:text-primary
              prose-strong:text-foreground prose-strong:font-semibold
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium
              prose-ul:my-4 prose-ul:space-y-2
              dark:prose-invert
            ">
                            {children}
                        </div>
                    </div>
                </div>

                {/* Contact CTA */}
                <div className="mt-12 text-center">
                    <p className="text-muted-foreground mb-4">
                        Have questions about this policy?
                    </p>
                    <a
                        href="https://wa.me/94787767869"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#25D366] text-white font-bold hover:bg-[#22c55e] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#25d366]/20"
                    >
                        Contact Us on WhatsApp
                    </a>
                </div>
            </div>
        </div>
    );
};

export default PolicyLayout;
