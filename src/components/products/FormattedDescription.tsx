import { Check } from 'lucide-react';

interface FormattedDescriptionProps {
    description: string;
    className?: string;
}

export const FormattedDescription = ({ description, className }: FormattedDescriptionProps) => {
    if (!description) return null;

    // Helper to render bold text
    const renderLineWithBold = (text: string) => {
        // Matches **text**
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <span key={i} className="font-bold text-foreground whitespace-pre-wrap">{part.slice(2, -2)}</span>;
            }
            return <span key={i} className="whitespace-pre-wrap">{part}</span>;
        });
    };

    const lines = description.split('\n');
    return (
        <div className={className}>
            <div className="space-y-1">
                {lines.map((line, idx) => {
                    const trimmed = line.trim();
                    if (!trimmed) {
                        return <div key={idx} className="h-3" />;
                    }

                    // List items (Checkmarks and bullets)
                    if (/^[\*\-•✅⭐]/.test(trimmed)) {
                        return (
                            <div key={idx} className="flex items-start gap-3 my-2 px-1">
                                <div className="mt-1.5 h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Check className="w-3 h-3 text-primary" />
                                </div>
                                <p className="text-[15px] text-muted-foreground leading-relaxed">
                                    {renderLineWithBold(trimmed.replace(/^[\*\-•✅⭐]\s*/, ''))}
                                </p>
                            </div>
                        );
                    }

                    // Headings / Section titles (Starts with an emoji or is clearly a header)
                    // Also check for common structural cues like "What You Get"
                    const isBulletEmoji = /^[\*\-•✅⭐]/.test(trimmed);
                    const isHeader = (!isBulletEmoji && /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(trimmed)) ||
                        trimmed.toUpperCase() === trimmed && trimmed.length > 3 ||
                        trimmed.startsWith('💼') ||
                        trimmed.startsWith('💡') ||
                        trimmed.startsWith('🎯') ||
                        trimmed.startsWith('🛡️');

                    if (isHeader) {
                        return (
                            <h3 key={idx} className="text-[17px] font-bold text-foreground mt-8 mb-4 first:mt-0 flex items-center gap-2">
                                {renderLineWithBold(trimmed)}
                            </h3>
                        );
                    }

                    // Normal paragraph text
                    return (
                        <p key={idx} className="text-[15px] text-muted-foreground leading-relaxed mb-2">
                            {renderLineWithBold(trimmed)}
                        </p>
                    );
                })}
            </div>
        </div>
    );
};
