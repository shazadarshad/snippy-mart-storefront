// WhatsApp Automation Types
// Types for WhatsApp product configuration and logging

export interface WhatsAppFlowStep {
    title: string;
    message: string;
    delayMs: number;
}

export interface WhatsAppProductConfig {
    id: string;
    product_id: string;
    enabled: boolean;
    priority: number;
    menu_title: string;
    triggers: string[];
    flow_steps: WhatsAppFlowStep[];
    show_order_link: boolean;
    escalation_keywords: string[];
    created_at?: string;
    updated_at?: string;
}

export interface WhatsAppProductConfigFormData {
    product_id: string;
    enabled: boolean;
    priority: number;
    menu_title: string;
    triggers: string[];
    flow_steps: WhatsAppFlowStep[];
    show_order_link: boolean;
    escalation_keywords: string[];
}

export interface WhatsAppLog {
    id: string;
    phone: string;
    message: string | null;
    product_id: string | null;
    event: WhatsAppEventType;
    source: string;
    metadata: Record<string, any>;
    created_at: string;
}

export type WhatsAppEventType =
    | 'PRODUCT_VIEW'
    | 'ORDER_CLICK'
    | 'ESCALATION'
    | 'FALLBACK'
    | 'MENU_REQUEST';

export interface WhatsAppLogInput {
    phone: string;
    message?: string;
    productId?: string;
    event: WhatsAppEventType;
    metadata?: Record<string, any>;
}

export interface WhatsAppSettings {
    id: string;
    bot_enabled: boolean;
    default_fallback_message: string;
    business_hours_enabled: boolean;
    business_hours: {
        start?: string;
        end?: string;
        days?: string[];
    };
    rate_limit_per_minute: number;
    updated_at: string;
}

export interface WhatsAppSettingsFormData {
    bot_enabled: boolean;
    default_fallback_message: string;
    business_hours_enabled: boolean;
    business_hours: {
        start: string;
        end: string;
        days: string[];
    };
    rate_limit_per_minute: number;
}

// API Response Types
export interface WhatsAppProductMenuResponse {
    id: string;
    menuTitle: string;
    priority: number;
}

export interface WhatsAppProductFlowResponse {
    productId: string;
    flowSteps: WhatsAppFlowStep[];
    orderUrl: string;
    showOrderLink: boolean;
}

export interface WhatsAppLogResponse {
    success: boolean;
    id: string;
}

// Analytics Types
export interface WhatsAppStats {
    totalMessages: number;
    productViews: number;
    orderClicks: number;
    uniqueUsers: number;
}

export interface WhatsAppLogsFilter {
    startDate?: string;
    endDate?: string;
    productId?: string;
    event?: WhatsAppEventType;
    phone?: string;
    page?: number;
    limit?: number;
}

export interface WhatsAppProductWithConfig {
    id: string;
    name: string;
    slug: string;
    image_url: string;
    price: number;
    whatsapp_config: WhatsAppProductConfig | null;
}
