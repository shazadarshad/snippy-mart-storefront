import { useState } from 'react';
import { Mail, Server, Lock, Eye, EyeOff, Send, CheckCircle, AlertCircle, Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    useEmailSettings,
    useUpdateEmailSettings,
    useSendTestEmail,
    type EmailSettingsInput,
} from '@/hooks/useEmailSettings';

const AdminEmailSettings = () => {
    const { data: settings, isLoading } = useEmailSettings();
    const updateSettings = useUpdateEmailSettings();
    const sendTestEmail = useSendTestEmail();

    const [showPassword, setShowPassword] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [formData, setFormData] = useState<EmailSettingsInput>({
        smtp_host: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_password: '',
        smtp_secure: true,
        from_email: '',
        from_name: 'Snippy Mart',
        reply_to_email: '',
    });

    // Update form when settings load
    useState(() => {
        if (settings) {
            setFormData({
                smtp_host: settings.smtp_host || '',
                smtp_port: settings.smtp_port || 587,
                smtp_user: settings.smtp_user || '',
                smtp_password: settings.smtp_password || '',
                smtp_secure: settings.smtp_secure ?? true,
                from_email: settings.from_email || '',
                from_name: settings.from_name || 'Snippy Mart',
                reply_to_email: settings.reply_to_email || '',
            });
        }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateSettings.mutate(formData);
    };

    const handleSendTest = () => {
        if (testEmail) {
            sendTestEmail.mutate(testEmail);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Email Settings</h1>
                <p className="text-muted-foreground">Configure SMTP to send automated emails</p>
            </div>

            <div className="grid gap-6 max-w-2xl">
                {/* Status Card */}
                <Card className={`border-2 ${settings?.is_configured ? 'border-success/50 bg-success/5' : 'border-warning/50 bg-warning/5'}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                        {settings?.is_configured ? (
                            <>
                                <CheckCircle className="w-8 h-8 text-success" />
                                <div>
                                    <p className="font-bold text-success">Email Configured</p>
                                    <p className="text-sm text-muted-foreground">Your SMTP settings are active</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-8 h-8 text-warning" />
                                <div>
                                    <p className="font-bold text-warning">Not Configured</p>
                                    <p className="text-sm text-muted-foreground">Enter your SMTP credentials below</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* SMTP Settings Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="w-5 h-5" />
                            SMTP Configuration
                        </CardTitle>
                        <CardDescription>
                            Enter your email provider's SMTP credentials. For Hostinger, use smtp.hostinger.com
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* SMTP Host & Port */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-2 space-y-2">
                                    <Label htmlFor="smtp_host">SMTP Host</Label>
                                    <Input
                                        id="smtp_host"
                                        name="smtp_host"
                                        placeholder="smtp.hostinger.com"
                                        value={formData.smtp_host}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="smtp_port">Port</Label>
                                    <Input
                                        id="smtp_port"
                                        name="smtp_port"
                                        type="number"
                                        placeholder="587"
                                        value={formData.smtp_port}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Username */}
                            <div className="space-y-2">
                                <Label htmlFor="smtp_user">Username (Email)</Label>
                                <Input
                                    id="smtp_user"
                                    name="smtp_user"
                                    type="email"
                                    placeholder="orders@snippymart.com"
                                    value={formData.smtp_user}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="smtp_password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="smtp_password"
                                        name="smtp_password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={formData.smtp_password}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* TLS/SSL Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                                <div className="flex items-center gap-3">
                                    <Lock className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">Use TLS/SSL</p>
                                        <p className="text-sm text-muted-foreground">Enable secure connection (recommended)</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={formData.smtp_secure}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, smtp_secure: checked }))}
                                />
                            </div>

                            {/* From Email & Name */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="from_email">From Email</Label>
                                    <Input
                                        id="from_email"
                                        name="from_email"
                                        type="email"
                                        placeholder="orders@snippymart.com"
                                        value={formData.from_email}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="from_name">From Name</Label>
                                    <Input
                                        id="from_name"
                                        name="from_name"
                                        placeholder="Snippy Mart"
                                        value={formData.from_name}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Reply To */}
                            <div className="space-y-2">
                                <Label htmlFor="reply_to_email">Reply-To Email (Optional)</Label>
                                <Input
                                    id="reply_to_email"
                                    name="reply_to_email"
                                    type="email"
                                    placeholder="support@snippymart.com"
                                    value={formData.reply_to_email}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Save Button */}
                            <Button type="submit" className="w-full" disabled={updateSettings.isPending}>
                                {updateSettings.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                Save Settings
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Test Email */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5" />
                            Send Test Email
                        </CardTitle>
                        <CardDescription>
                            Verify your configuration by sending a test email
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-3">
                            <Input
                                type="email"
                                placeholder="your@email.com"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                className="flex-1"
                            />
                            <Button
                                onClick={handleSendTest}
                                disabled={!testEmail || sendTestEmail.isPending || !settings?.is_configured}
                            >
                                {sendTestEmail.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send
                                    </>
                                )}
                            </Button>
                        </div>
                        {!settings?.is_configured && (
                            <p className="text-sm text-warning mt-2">Save SMTP settings first before sending a test email.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Hostinger Help */}
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4">
                        <p className="font-bold text-primary mb-2">📧 Hostinger SMTP Settings</p>
                        <div className="text-sm text-muted-foreground space-y-1">
                            <p><strong>Host:</strong> smtp.hostinger.com</p>
                            <p><strong>Port:</strong> 587 (TLS) or 465 (SSL)</p>
                            <p><strong>Username:</strong> Your full email (orders@snippymart.com)</p>
                            <p><strong>Password:</strong> Your email password</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminEmailSettings;
