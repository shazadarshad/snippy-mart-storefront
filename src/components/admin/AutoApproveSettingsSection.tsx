import { useState, useEffect } from 'react';
import { Zap, ShieldCheck, Smartphone, CheckCircle2, RefreshCw, MessageSquare, Clock, ArrowUpRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminSmsAutoApprove } from '@/hooks/useAdminSmsAutoApprove';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DbBankSmsLog {
  id: string;
  sender: string;
  body: string;
  amount: number;
  reference_number: string | null;
  received_at: string;
  claimed_order_id: string | null;
  claimed_at: string | null;
  orders?: { order_number: string; customer_name: string } | null;
}

const AutoApproveSettingsSection = () => {
  const { enabled, maxLimit, logs, toggleAutoApprove, setMaxLimit, processIncomingSms } =
    useAdminSmsAutoApprove();

  const [testSender, setTestSender] = useState('DF-Alert');
  const [testBody, setTestBody] = useState('Inward CEFTS of LKR 499.00 was performed on your account no 001XXXXXX987. Account Balance - Rs. 34,874.36');
  const [simulating, setSimulating] = useState(false);
  const [dbSmsLogs, setDbSmsLogs] = useState<DbBankSmsLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchBankSmsLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('bank_sms_logs')
        .select('*, orders:claimed_order_id(order_number, customer_name)')
        .order('received_at', { ascending: false })
        .limit(25);

      if (!error && data) {
        setDbSmsLogs(data as unknown as DbBankSmsLog[]);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    void fetchBankSmsLogs();
  }, []);

  const handleSimulateSms = async () => {
    setSimulating(true);
    try {
      const result = await processIncomingSms(testSender, testBody);
      if (result.matched) {
        toast.success(`Simulated match success! Order #${result.orderNumber} shifted to Payment Confirmed.`);
      } else {
        toast.info(`Simulation finished — no matching pending order < LKR ${maxLimit} found for this SMS.`);
      }
      await fetchBankSmsLogs();
    } catch (e) {
      toast.error('Simulation error');
    } finally {
      setSimulating(false);
    }
  };

  const handleRunMatcherRpc = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('smart-sms-matcher', {
        body: { max_threshold: maxLimit },
      });
      if (!error) {
        toast.success(`Smart Matcher executed: ${data?.matches_count || 0} order(s) auto-approved!`);
        await fetchBankSmsLogs();
      } else {
        toast.error(`Matcher error: ${error.message}`);
      }
    } catch (e) {
      toast.error('Matcher invocation failed');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/80 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">DF-Alert SMS Auto-Approval</CardTitle>
                <CardDescription className="text-xs">
                  Automatically verify payments & shift status to Payment Confirmed for small orders.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">
                {enabled ? 'Active' : 'Disabled'}
              </span>
              <Switch checked={enabled} onCheckedChange={() => toggleAutoApprove()} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/50 space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Maximum Threshold (LKR)
              </label>
              <Input
                type="number"
                value={maxLimit}
                onChange={(e) => setMaxLimit(parseFloat(e.target.value) || 700)}
                className="h-9 text-xs font-bold"
              />
              <p className="text-[10px] text-muted-foreground">
                Orders &lt; LKR {maxLimit} matching DF-Alert SMS will auto-shift to Payment Confirmed.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/50 space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-primary" />
                Allowed SMS Sender
              </label>
              <Input value="DF-Alert (Default)" disabled className="h-9 text-xs font-bold opacity-80" />
              <p className="text-[10px] text-muted-foreground">
                Only SMS from senders containing <code className="font-mono text-primary">DF-Alert</code> are processed.
              </p>
            </div>
          </div>

          {/* Test Simulator */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> SMS Auto-Approve Simulator
              </h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRunMatcherRpc}
                className="h-7 text-[11px] font-bold text-primary hover:bg-primary/10"
              >
                Run Matcher Engine Now
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                placeholder="Sender"
                value={testSender}
                onChange={(e) => setTestSender(e.target.value)}
                className="h-8 text-xs font-semibold"
              />
              <Input
                placeholder="SMS Body"
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                className="h-8 text-xs font-semibold sm:col-span-2"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSimulateSms}
              disabled={simulating}
              className="w-full sm:w-auto h-8 text-xs font-bold bg-background hover:bg-secondary"
            >
              {simulating ? 'Processing...' : 'Run Test SMS Match'}
            </Button>
          </div>

          {/* Live Supabase Bank SMS Logs Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                Live Bank SMS Logs ({dbSmsLogs.length})
              </h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={fetchBankSmsLogs}
                disabled={loadingLogs}
                className="h-7 text-[11px] font-bold text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`w-3 h-3 ${loadingLogs ? 'animate-spin' : ''}`} /> Refresh Logs
              </Button>
            </div>

            {dbSmsLogs.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
                No bank SMS logs received yet. Once DF-Alert SMS messages arrive on your phone, they will appear here.
              </div>
            ) : (
              <div className="divide-y divide-border/50 border border-border/60 rounded-2xl overflow-hidden text-xs bg-card/60">
                {dbSmsLogs.map((log) => (
                  <div key={log.id} className="p-3 space-y-1.5 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{log.sender}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-mono font-bold text-[11px]">
                          LKR {Number(log.amount).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                        <Clock className="w-3 h-3" />
                        {new Date(log.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 font-mono bg-background/50 p-2 rounded-lg border border-border/40">
                      {log.body}
                    </p>
                    <div className="flex items-center justify-between pt-0.5 text-[10px]">
                      {log.claimed_order_id ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> Matched to Order #{log.orders?.order_number || log.claimed_order_id.slice(0, 8)} ({log.orders?.customer_name || 'Customer'})
                        </span>
                      ) : (
                        <span className="font-semibold text-amber-500">Unclaimed / Pending Match</span>
                      )}
                      {log.reference_number && (
                        <span className="font-mono text-muted-foreground">Ref: {log.reference_number}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoApproveSettingsSection;
