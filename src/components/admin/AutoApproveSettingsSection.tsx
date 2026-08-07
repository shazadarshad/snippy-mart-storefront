import { useState } from 'react';
import { Zap, ShieldCheck, Smartphone, CheckCircle2, RefreshCw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminSmsAutoApprove } from '@/hooks/useAdminSmsAutoApprove';
import { toast } from 'sonner';

const AutoApproveSettingsSection = () => {
  const { enabled, maxLimit, logs, toggleAutoApprove, setMaxLimit, processIncomingSms } =
    useAdminSmsAutoApprove();

  const [testSender, setTestSender] = useState('DF-Alert');
  const [testBody, setTestBody] = useState('Inward CEFTS of LKR 499.00 was performed on your account no 001XXXXXX987. Account Balance - Rs. 34,874.36');
  const [simulating, setSimulating] = useState(false);

  const handleSimulateSms = async () => {
    setSimulating(true);
    try {
      const result = await processIncomingSms(testSender, testBody);
      if (result.matched) {
        toast.success(`Simulated match success! Order #${result.orderNumber} shifted to Payment Confirmed.`);
      } else {
        toast.info(`Simulation finished — no matching pending order < LKR ${maxLimit} found for this SMS.`);
      }
    } catch (e) {
      toast.error('Simulation error');
    } finally {
      setSimulating(false);
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
        <CardContent className="space-y-4 pt-0">
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
              <span className="text-[10px] font-bold text-muted-foreground">Test incoming SMS logic</span>
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

          {/* Recent Audit Log */}
          {logs.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Recent Auto-Approved Transactions ({logs.length})
              </h4>
              <div className="divide-y divide-border/50 border border-border/60 rounded-xl overflow-hidden text-xs">
                {logs.map((log) => (
                  <div key={log.id} className="p-2.5 flex items-center justify-between bg-card/50">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 font-mono font-bold text-[10px]">
                        #{log.orderNumber}
                      </span>
                      <span className="font-semibold text-foreground">{log.customerName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-primary tabular-nums">LKR {log.amount}</span>
                      <span className="text-[10px] text-muted-foreground">{log.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoApproveSettingsSection;
