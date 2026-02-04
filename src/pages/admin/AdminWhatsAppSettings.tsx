// WhatsApp Bot Settings - Admin Panel
// /admin/whatsapp/settings

import { useState, useEffect } from 'react';
import { Power, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWhatsAppSettings, useUpdateWhatsAppSettings } from '@/hooks/useWhatsAppSettings';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AdminWhatsAppSettings = () => {
    const { data: settings, isLoading } = useWhatsAppSettings();
    const updateSettings = useUpdateWhatsAppSettings();

    const [botEnabled, setBotEnabled] = useState(true);
    const [fallbackMessage, setFallbackMessage] = useState('');
    const [businessHoursEnabled, setBusinessHoursEnabled] = useState(false);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('18:00');
    const [selectedDays, setSelectedDays] = useState<string[]>([
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
    ]);
    const [rateLimit, setRateLimit] = useState(100);

    // Load settings from server
    useEffect(() => {
        if (settings) {
            setBotEnabled(settings.bot_enabled);
            setFallbackMessage(settings.default_fallback_message);
            setBusinessHoursEnabled(settings.business_hours_enabled);
            setRateLimit(settings.rate_limit_per_minute);

            if (settings.business_hours) {
                setStartTime(settings.business_hours.start || '09:00');
                setEndTime(settings.business_hours.end || '18:00');
                setSelectedDays(settings.business_hours.days || []);
            }
        }
    }, [settings]);

    const handleToggleDay = (day: string) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    const handleSave = async () => {
        await updateSettings.mutateAsync({
            bot_enabled: botEnabled,
            default_fallback_message: fallbackMessage,
            business_hours_enabled: businessHoursEnabled,
            business_hours: {
                start: startTime,
                end: endTime,
                days: selectedDays,
            },
            rate_limit_per_minute: rateLimit,
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-muted-foreground">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">WhatsApp Bot Settings</h1>
                <p className="text-muted-foreground">
                    Configure global bot behavior, messages, and availability
                </p>
            </div>

            <div className="space-y-6">
                {/* Bot Status */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Power className="w-5 h-5" />
                                    Bot Status
                                </CardTitle>
                                <CardDescription>Enable or disable the WhatsApp bot globally</CardDescription>
                            </div>
                            <div className="flex items-center gap-3">
                                {botEnabled ? (
                                    <Badge className="bg-green-500">Active</Badge>
                                ) : (
                                    <Badge variant="secondary">Inactive</Badge>
                                )}
                                <Switch
                                    checked={botEnabled}
                                    onCheckedChange={setBotEnabled}
                                    className="scale-125"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    {!botEnabled && (
                        <CardContent>
                            <Alert>
                                <AlertCircle className="w-4 h-4" />
                                <AlertDescription>
                                    The WhatsApp bot is currently disabled. Users will not receive automated responses.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    )}
                </Card>

                {/* Default Messages */}
                <Card>
                    <CardHeader>
                        <CardTitle>Default Messages</CardTitle>
                        <CardDescription>
                            Messages sent when the bot doesn't understand user input
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Fallback Message</Label>
                            <Textarea
                                value={fallbackMessage}
                                onChange={(e) => setFallbackMessage(e.target.value)}
                                placeholder="Sorry, I didn't understand. Reply with *menu* to see available products."
                                className="mt-1 min-h-[100px]"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Use *text* for bold, _text_ for italic
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Business Hours */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Business Hours</CardTitle>
                                <CardDescription>
                                    Limit bot responses to specific times (optional)
                                </CardDescription>
                            </div>
                            <Switch
                                checked={businessHoursEnabled}
                                onCheckedChange={setBusinessHoursEnabled}
                            />
                        </div>
                    </CardHeader>
                    {businessHoursEnabled && (
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Start Time</Label>
                                    <Input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>End Time</Label>
                                    <Input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Active Days</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {DAYS.map((day) => (
                                        <Badge
                                            key={day}
                                            variant={selectedDays.includes(day) ? 'default' : 'outline'}
                                            className="cursor-pointer"
                                            onClick={() => handleToggleDay(day)}
                                        >
                                            {day.slice(0, 3)}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <Alert>
                                <AlertDescription>
                                    Bot will only respond between {startTime} - {endTime} on selected days.
                                    Outside these hours, users will receive an "out of office" message.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    )}
                </Card>

                {/* Rate Limiting */}
                <Card>
                    <CardHeader>
                        <CardTitle>Rate Limiting</CardTitle>
                        <CardDescription>
                            Prevent abuse by limiting requests per minute
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div>
                            <Label>Maximum Requests Per Minute</Label>
                            <Input
                                type="number"
                                value={rateLimit}
                                onChange={(e) => setRateLimit(parseInt(e.target.value) || 100)}
                                placeholder="100"
                                className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Recommended: 100 for production, 50 for testing
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end gap-3">
                    <Button
                        onClick={handleSave}
                        disabled={updateSettings.isPending}
                        size="lg"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AdminWhatsAppSettings;
