// WhatsApp Automation Utility Functions

/**
 * Masks a phone number for privacy
 * Example: 9477123456 -> 947X...XXX
 */
export function maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 4) return phone;

    const first4 = phone.substring(0, 4);
    const lastDigit = phone.substring(phone.length - 1);

    return `${first4}X...XX${lastDigit}`;
}

/**
 * Generates the full order URL for a product
 */
export function generateOrderUrl(productSlug: string, baseUrl?: string): string {
    const base = baseUrl || 'https://snippymart.com';
    return `${base}/product/${productSlug}`;
}

/**
 * Normalizes trigger keywords (lowercase, trim, unique)
 */
export function normalizeTriggers(triggers: string[]): string[] {
    return Array.from(
        new Set(
            triggers
                .map(t => t.toLowerCase().trim())
                .filter(t => t.length > 0)
        )
    );
}

/**
 * Formats a WhatsApp message with common patterns
 * - *bold*
 * - _italic_
 * - ~strikethrough~
 */
export function formatWhatsAppMessage(message: string): string {
    // Already formatted, just return
    return message;
}

/**
 * Validates flow steps
 */
export function validateFlowSteps(steps: any[]): boolean {
    if (!Array.isArray(steps) || steps.length === 0) {
        return false;
    }

    return steps.every(step => {
        return (
            typeof step.title === 'string' &&
            typeof step.message === 'string' &&
            typeof step.delayMs === 'number' &&
            step.title.length > 0 &&
            step.message.length > 0 &&
            step.delayMs >= 0
        );
    });
}

/**
 * Calculates total delay from flow steps
 */
export function calculateTotalDelay(steps: { delayMs: number }[]): number {
    return steps.reduce((total, step) => total + step.delayMs, 0);
}

/**
 * Formats delay in human-readable format
 * Example: 3500 -> "3.5s"
 */
export function formatDelay(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Sanitizes phone number (removes spaces, dashes, etc.)
 */
export function sanitizePhoneNumber(phone: string): string {
    return phone.replace(/[^0-9+]/g, '');
}

/**
 * Validates event type
 */
export function isValidEventType(event: string): boolean {
    const validEvents = [
        'PRODUCT_VIEW',
        'ORDER_CLICK',
        'ESCALATION',
        'FALLBACK',
        'MENU_REQUEST',
    ];
    return validEvents.includes(event);
}

/**
 * Generates a preview of WhatsApp flow as text
 */
export function generateFlowPreview(steps: { title: string; message: string; delayMs: number }[]): string {
    return steps
        .map((step, index) => {
            const delay = formatDelay(step.delayMs);
            return `[Step ${index + 1}] (${delay} delay)\n*${step.title}*\n${step.message}`;
        })
        .join('\n\n---\n\n');
}

/**
 * Checks if current time is within business hours
 */
export function isWithinBusinessHours(businessHours: {
    start: string;
    end: string;
    days: string[];
}): boolean {
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[now.getDay()];

    // Check if today is a business day
    if (!businessHours.days.includes(currentDay)) {
        return false;
    }

    // Parse time
    const [startHour, startMin] = businessHours.start.split(':').map(Number);
    const [endHour, endMin] = businessHours.end.split(':').map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Parses WhatsApp message to extract intent/product request
 */
export function parseUserMessage(message: string, triggers: string[][]): string | null {
    const normalizedMessage = message.toLowerCase().trim();

    for (const productTriggers of triggers) {
        for (const trigger of productTriggers) {
            if (normalizedMessage.includes(trigger.toLowerCase())) {
                return trigger;
            }
        }
    }

    return null;
}
