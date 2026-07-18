import { Check } from 'lucide-react';

interface FormattedDescriptionProps {
  description: string;
  className?: string;
}

/** Bullet / checklist markers the storefront understands */
const BULLET_RE = /^(?:[\*\-•✅⭐✓✔▪▸●◦·☑]|\u2705|\u2713|\u2714)\s*/;

/** Lines that should render as section headings */
function isHeaderLine(trimmed: string, isBullet: boolean): boolean {
  if (isBullet || !trimmed) return false;

  // Emoji-leading section titles (short only — long how-to / notes stay body text)
  if (
    /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(trimmed) &&
    trimmed.length <= 72 &&
    !trimmed.includes('. ')
  ) {
    return true;
  }

  // ALL CAPS short headers
  if (trimmed.toUpperCase() === trimmed && /[A-Z]/.test(trimmed) && trimmed.length > 3 && trimmed.length < 80) {
    return true;
  }

  // Common section labels (with or without trailing colon)
  const headerOnly = trimmed.replace(/:$/, '').trim();
  const knownHeaders = [
    'what you get',
    "what's included",
    'whats included',
    'how it works',
    'included',
    'features',
    'premium benefits',
    'pricing',
    'plan details',
    'perfect for',
    'important',
    'note',
    'sm details',
    'compatible with',
    'api documentation',
    'includes',
  ];
  if (knownHeaders.includes(headerOnly.toLowerCase())) return true;

  // Short Title Case line ending with colon
  if (trimmed.endsWith(':') && trimmed.length <= 48 && !trimmed.includes('.')) {
    return true;
  }

  return (
    trimmed.startsWith('💼') ||
    trimmed.startsWith('💡') ||
    trimmed.startsWith('🎯') ||
    trimmed.startsWith('🛡️') ||
    trimmed.startsWith('✨') ||
    trimmed.startsWith('🚀') ||
    trimmed.startsWith('📦') ||
    trimmed.startsWith('⚠️')
  );
}

export const FormattedDescription = ({ description, className }: FormattedDescriptionProps) => {
  if (!description) return null;

  // Support real newlines only. If someone pasted literal "\n", treat as line breaks.
  // Does NOT support /n, /b, \b, or other escape codes.
  const normalized = description
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\\n/g, '\n');

  const renderLineWithBold = (text: string) => {
    // **bold** only — no /b or other markup
    const parts = text.split(/(\*\*[^*]+?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <span key={i} className="font-bold text-foreground whitespace-pre-wrap">
            {part.slice(2, -2)}
          </span>
        );
      }
      return (
        <span key={i} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    });
  };

  const lines = normalized.split('\n');

  return (
    <div className={className}>
      <div className="space-y-1">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-3" />;
          }

          const isBullet = BULLET_RE.test(trimmed);

          // "🎬 Feature Name: details..." → checklist row (not a giant heading)
          const emojiFeature = trimmed.match(
            /^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}](?:\uFE0F)?)\s+(.+)$/u
          );
          const isEmojiFeatureBullet =
            !!emojiFeature &&
            /:/.test(emojiFeature[2]) &&
            emojiFeature[2].length > 24 &&
            !isBullet;

          if (isBullet || isEmojiFeatureBullet) {
            let body = isBullet
              ? trimmed.replace(BULLET_RE, '')
              : emojiFeature![2].trim();

            // Auto-bold "Label:" at start of feature lines when no ** yet
            if (!body.includes('**')) {
              body = body.replace(/^([^:]{2,48}):\s*/, '**$1:** ');
            }

            return (
              <div key={idx} className="flex items-start gap-3 my-2 px-1">
                <div className="mt-1.5 h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <p className="text-[15px] text-muted-foreground leading-relaxed">
                  {renderLineWithBold(body)}
                </p>
              </div>
            );
          }

          if (isHeaderLine(trimmed, isBullet)) {
            return (
              <h3
                key={idx}
                className="text-[17px] font-bold text-foreground mt-8 mb-4 first:mt-0 flex items-center gap-2"
              >
                {renderLineWithBold(trimmed.replace(/:$/, ''))}
              </h3>
            );
          }

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
