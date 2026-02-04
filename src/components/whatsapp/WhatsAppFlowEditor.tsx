// WhatsApp Flow Editor Component
// Modal for configuring product WhatsApp flows

import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUpsertWhatsAppConfig } from '@/hooks/useWhatsAppProducts';
import type { WhatsAppProductWithConfig, WhatsAppFlowStep, WhatsAppProductConfigFormData } from '@/types/whatsapp';
import { formatDelay, normalizeTriggers, validateFlowSteps } from '@/utils/whatsapp';

interface WhatsAppFlowEditorProps {
    product: WhatsAppProductWithConfig;
    isOpen: boolean;
    onClose: () => void;
}

export const WhatsAppFlowEditor = ({ product, isOpen, onClose }: WhatsAppFlowEditorProps) => {
    const config = product.whatsapp_config;

    const [menuTitle, setMenuTitle] = useState(config?.menu_title || product.name);
    const [priority, setPriority] = useState(config?.priority ?? 0);
    const [triggers, setTriggers] = useState<string[]>(config?.triggers || []);
    const [triggerInput, setTriggerInput] = useState('');
    const [flowSteps, setFlowSteps] = useState<WhatsAppFlowStep[]>(
        config?.flow_steps || []
    );
    const [showOrderLink, setShowOrderLink] = useState(config?.show_order_link ?? true);
    const [escalationKeywords, setEscalationKeywords] = useState<string[]>(
        config?.escalation_keywords || ['admin', 'agent', 'human']
    );

    const upsertConfig = useUpsertWhatsAppConfig();

    // Reset form when product changes
    useEffect(() => {
        if (product) {
            setMenuTitle(config?.menu_title || product.name);
            setPriority(config?.priority ?? 0);
            setTriggers(config?.triggers || []);
            setFlowSteps(config?.flow_steps || []);
            setShowOrderLink(config?.show_order_link ?? true);
            setEscalationKeywords(config?.escalation_keywords || ['admin', 'agent', 'human']);
        }
    }, [product, config]);

    const handleAddTrigger = () => {
        if (triggerInput.trim()) {
            setTriggers([...triggers, triggerInput.trim()]);
            setTriggerInput('');
        }
    };

    const handleRemoveTrigger = (index: number) => {
        setTriggers(triggers.filter((_, i) => i !== index));
    };

    const handleAddFlowStep = () => {
        setFlowSteps([
            ...flowSteps,
            {
                title: '',
                message: '',
                delayMs: 1500,
            },
        ]);
    };

    const handleUpdateFlowStep = (index: number, field: keyof WhatsAppFlowStep, value: any) => {
        const updated = [...flowSteps];
        updated[index] = { ...updated[index], [field]: value };
        setFlowSteps(updated);
    };

    const handleRemoveFlowStep = (index: number) => {
        setFlowSteps(flowSteps.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        // Validate
        if (!menuTitle.trim()) {
            alert('Menu title is required');
            return;
        }

        if (flowSteps.length > 0 && !validateFlowSteps(flowSteps)) {
            alert('Invalid flow steps. Each step must have a title, message, and delay.');
            return;
        }

        const formData: WhatsAppProductConfigFormData = {
            product_id: product.id,
            enabled: config?.enabled ?? false,
            priority,
            menu_title: menuTitle,
            triggers: normalizeTriggers(triggers),
            flow_steps: flowSteps,
            show_order_link: showOrderLink,
            escalation_keywords: escalationKeywords,
        };

        await upsertConfig.mutateAsync(formData);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded" />
                        <div>
                            <div>WhatsApp Flow: {product.name}</div>
                            <div className="text-sm font-normal text-muted-foreground">
                                Configure how this product appears in WhatsApp
                            </div>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="basic" className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                        <TabsTrigger value="flow">Flow Steps</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>

                    {/* Basic Settings Tab */}
                    <TabsContent value="basic" className="space-y-4">
                        <div>
                            <Label>Menu Title *</Label>
                            <Input
                                value={menuTitle}
                                onChange={(e) => setMenuTitle(e.target.value)}
                                placeholder="e.g., 🖥️ Cursor Pro"
                                className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                How this product appears in the WhatsApp menu
                            </p>
                        </div>

                        <div>
                            <Label>Priority</Label>
                            <Input
                                type="number"
                                value={priority}
                                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                                placeholder="0"
                                className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Lower numbers appear first (0 = top)
                            </p>
                        </div>

                        <div>
                            <Label>Trigger Keywords</Label>
                            <div className="flex gap-2 mt-1">
                                <Input
                                    value={triggerInput}
                                    onChange={(e) => setTriggerInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTrigger()}
                                    placeholder="e.g., cursor, cursor pro"
                                />
                                <Button type="button" onClick={handleAddTrigger}>
                                    Add
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {triggers.map((trigger, idx) => (
                                    <Badge key={idx} variant="secondary" className="gap-1">
                                        {trigger}
                                        <button
                                            onClick={() => handleRemoveTrigger(idx)}
                                            className="ml-1 hover:text-destructive"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                When users type these words, bot shows this product
                            </p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Show Order Link</Label>
                                <p className="text-xs text-muted-foreground">
                                    Include "Order Now" link at the end
                                </p>
                            </div>
                            <Switch checked={showOrderLink} onCheckedChange={setShowOrderLink} />
                        </div>
                    </TabsContent>

                    {/* Flow Steps Tab */}
                    <TabsContent value="flow" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">Conversation Flow</h3>
                                <p className="text-sm text-muted-foreground">
                                    Define step-by-step messages sent to users
                                </p>
                            </div>
                            <Button onClick={handleAddFlowStep} size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Step
                            </Button>
                        </div>

                        {flowSteps.length === 0 ? (
                            <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No flow steps defined</p>
                                <p className="text-sm">Click "Add Step" to create a conversation flow</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {flowSteps.map((step, idx) => (
                                    <div key={idx} className="border rounded-lg p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <GripVertical className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-medium">Step {idx + 1}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveFlowStep(idx)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <div>
                                            <Label className="text-xs">Title</Label>
                                            <Input
                                                value={step.title}
                                                onChange={(e) => handleUpdateFlowStep(idx, 'title', e.target.value)}
                                                placeholder="e.g., What is Cursor?"
                                                className="mt-1"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs">Message</Label>
                                            <Textarea
                                                value={step.message}
                                                onChange={(e) => handleUpdateFlowStep(idx, 'message', e.target.value)}
                                                placeholder="Message to send..."
                                                className="mt-1 min-h-[80px]"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs">
                                                Delay (ms) - {formatDelay(step.delayMs)}
                                            </Label>
                                            <Input
                                                type="number"
                                                value={step.delayMs}
                                                onChange={(e) =>
                                                    handleUpdateFlowStep(idx, 'delayMs', parseInt(e.target.value) || 0)
                                                }
                                                placeholder="1500"
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Preview Tab */}
                    <TabsContent value="preview" className="space-y-4">
                        <div className="bg-muted/30 rounded-lg p-4">
                            <h3 className="font-medium mb-4">WhatsApp Preview</h3>

                            {flowSteps.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">
                                    Add flow steps to see preview
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {flowSteps.map((step, idx) => (
                                        <div key={idx} className="bg-green-100 dark:bg-green-900/20 rounded-lg p-3 max-w-[80%]">
                                            <div className="font-medium text-sm mb-1">*{step.title}*</div>
                                            <div className="text-sm whitespace-pre-wrap">{step.message}</div>
                                            <div className="text-xs text-muted-foreground mt-2">
                                                ⏱️ Delay: {formatDelay(step.delayMs)}
                                            </div>
                                        </div>
                                    ))}

                                    {showOrderLink && (
                                        <div className="bg-green-100 dark:bg-green-900/20 rounded-lg p-3 max-w-[80%]">
                                            <div className="text-sm">
                                                👉 *Order on website*
                                                <br />
                                                https://snippymart.com/product/{product.slug}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={upsertConfig.isPending}>
                        {upsertConfig.isPending ? 'Saving...' : 'Save Configuration'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
