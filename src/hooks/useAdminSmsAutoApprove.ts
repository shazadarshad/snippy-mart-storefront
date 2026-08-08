import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { parseDfAlertSms, ParsedBankSms } from '@/utils/parseDfAlertSms';
import { toast } from 'sonner';

const AUTO_APPROVE_KEY = 'snippy_admin_sms_auto_approve';
const AUTO_APPROVE_LIMIT_KEY = 'snippy_admin_sms_max_limit';
const DEFAULT_MAX_LIMIT = 700; // Hard limit threshold (LKR)

export interface AutoApproveLog {
  id: string;
  orderNumber: string;
  amount: number;
  customerName: string;
  timestamp: string;
}

export function useAdminSmsAutoApprove(active: boolean = true) {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(AUTO_APPROVE_KEY);
      return stored === 'true'; // Disabled by default unless explicitly toggled ON
    } catch {
      return false;
    }
  });

  const [maxLimit, setMaxLimit] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(AUTO_APPROVE_LIMIT_KEY);
      return stored ? parseFloat(stored) : DEFAULT_MAX_LIMIT;
    } catch {
      return DEFAULT_MAX_LIMIT;
    }
  });

  const [logs, setLogs] = useState<AutoApproveLog[]>([]);
  const lastProcessedText = useRef<string>('');

  useEffect(() => {
    try {
      localStorage.setItem(AUTO_APPROVE_KEY, String(enabled));
    } catch {
      /* ignore */
    }
  }, [enabled]);

  useEffect(() => {
    try {
      localStorage.setItem(AUTO_APPROVE_LIMIT_KEY, String(maxLimit));
    } catch {
      /* ignore */
    }
  }, [maxLimit]);

  const toggleAutoApprove = useCallback((val?: boolean) => {
    setEnabled((prev) => (typeof val === 'boolean' ? val : !prev));
  }, []);

  /**
   * Process an incoming SMS message or copied bank text.
   */
  const processIncomingSms = useCallback(
    async (sender: string, body: string): Promise<{ matched: boolean; orderNumber?: string; amount?: number }> => {
      if (!enabled || !active) {
        return { matched: false };
      }

      const cleanText = `${sender}:${body}`.trim();
      if (lastProcessedText.current === cleanText) {
        return { matched: false }; // Prevent duplicate processing of same text
      }

      const parsed: ParsedBankSms = parseDfAlertSms(sender, body);

      if (!parsed.isDfAlert) {
        return { matched: false };
      }

      if (!parsed.amount || parsed.amount <= 0) {
        return { matched: false };
      }

      // Hard Limit Threshold Guard (< 700 LKR)
      if (parsed.amount >= maxLimit) {
        toast.info(
          `DF-Alert Payment received (LKR ${parsed.amount}), but requires manual review (Threshold: LKR ${maxLimit}).`
        );
        return { matched: false };
      }

      // Look for pending orders placed in the last 30 minutes
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

      const { data: pendingOrders, error } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, customer_name, security_metadata, notes')
        .eq('status', 'pending')
        .gte('created_at', thirtyMinsAgo)
        .order('created_at', { ascending: false });

      if (error || !pendingOrders || pendingOrders.length === 0) {
        console.log(`[SMS-AutoApprove] DF-Alert SMS received (LKR ${parsed.amount}), but no pending orders found.`);
        return { matched: false };
      }

      // Match order by exact price (allowing small float tolerance)
      const matchingOrder = pendingOrders.find(
        (o) => Math.abs(Number(o.total_amount) - parsed.amount!) < 1.0
      );

      if (!matchingOrder) {
        console.log(
          `[SMS-AutoApprove] DF-Alert SMS (LKR ${parsed.amount}) did not match any pending order totals.`
        );
        return { matched: false };
      }

      lastProcessedText.current = cleanText;

      // Shift to Payment Confirmed (status = 'processing')
      const updatedMetadata = {
        ...(typeof matchingOrder.security_metadata === 'object' ? matchingOrder.security_metadata : {}),
        auto_approved: true,
        auto_approved_at: new Date().toISOString(),
        sms_sender: parsed.sender,
        sms_amount: parsed.amount,
        sms_ref: parsed.referenceNumber || null,
      };

      const updatedNotes = [
        matchingOrder.notes,
        `⚡ Auto-Approved via DF-Alert SMS (LKR ${parsed.amount})`,
      ]
        .filter(Boolean)
        .join(' | ');

      const { error: updateErr } = await supabase
        .from('orders')
        .update({
          status: 'processing', // Shift to Payment Confirmed
          notes: updatedNotes,
          security_metadata: updatedMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', matchingOrder.id);

      if (updateErr) {
        console.error('[SMS-AutoApprove] Failed to update order status:', updateErr.message);
        toast.error(`Auto-approve failed for Order #${matchingOrder.order_number}: ${updateErr.message}`);
        return { matched: false };
      }

      // Trigger automatic status email via edge function
      try {
        await supabase.functions.invoke('handle-order-status-change', {
          body: {
            order: {
              ...matchingOrder,
              status: 'processing',
              security_metadata: updatedMetadata,
            },
            old_order: { ...matchingOrder, status: 'pending' },
            custom_message: `Payment of LKR ${parsed.amount} verified automatically via DF-Alert.`,
          },
        });
      } catch (e) {
        console.warn('[SMS-AutoApprove] Edge notification function call warning:', e);
      }

      // Success notification & log
      const logEntry: AutoApproveLog = {
        id: matchingOrder.id,
        orderNumber: matchingOrder.order_number,
        amount: parsed.amount,
        customerName: matchingOrder.customer_name || 'Customer',
        timestamp: new Date().toLocaleTimeString(),
      };

      setLogs((prev) => [logEntry, ...prev.slice(0, 19)]);

      toast.success(
        `⚡ Auto-Approved Order #${matchingOrder.order_number} (${matchingOrder.customer_name}) — LKR ${parsed.amount} Payment Confirmed!`,
        { duration: 8000 }
      );

      return {
        matched: true,
        orderNumber: matchingOrder.order_number,
        amount: parsed.amount,
      };
    },
    [enabled, active, maxLimit]
  );

  // Auto-scan Clipboard on App Focus for copied bank SMS
  useEffect(() => {
    if (!enabled || !active) return;

    const checkClipboardForSms = async () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
          const text = await navigator.clipboard.readText();
          if (text && (text.includes('DF-Alert') || text.includes('Inward CEFTS') || text.includes('CEFTS of LKR'))) {
            await processIncomingSms('DF-Alert', text);
          }
        }
      } catch {
        /* Clipboard permission or browser restriction — ignore */
      }
    };

    window.addEventListener('focus', checkClipboardForSms);
    return () => {
      window.removeEventListener('focus', checkClipboardForSms);
    };
  }, [enabled, active, processIncomingSms]);

  // Global listener for custom window SMS events (e.g. from Android SMS Receiver bridge)
  useEffect(() => {
    if (!enabled || !active) return;

    const handleSmsEvent = (evt: Event) => {
      const customEvt = evt as CustomEvent<{ sender?: string; body?: string }>;
      if (customEvt.detail?.body) {
        void processIncomingSms(customEvt.detail.sender || 'DF-Alert', customEvt.detail.body);
      }
    };

    window.addEventListener('snippy_sms_received', handleSmsEvent);
    return () => {
      window.removeEventListener('snippy_sms_received', handleSmsEvent);
    };
  }, [enabled, active, processIncomingSms]);

  return {
    enabled,
    maxLimit,
    logs,
    toggleAutoApprove,
    setMaxLimit,
    processIncomingSms,
  };
}
