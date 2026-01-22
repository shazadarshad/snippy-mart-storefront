import { useState } from 'react';
import { Mail, Edit, Eye, Save, X, Loader2, Code, FileText, Variable, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    useEmailTemplates,
    useUpdateEmailTemplate,
    useSendPreviewEmail,
    type EmailTemplate,
} from '@/hooks/useEmailTemplates';

const AdminEmailTemplates = () => {
    const { data: templates = [], isLoading } = useEmailTemplates();
    const updateTemplate = useUpdateEmailTemplate();
    const sendPreview = useSendPreviewEmail();

    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [previewHtml, setPreviewHtml] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [previewEmail, setPreviewEmail] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        html_content: '',
        is_active: true,
    });

    const handleEdit = (template: EmailTemplate) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            subject: template.subject,
            html_content: template.html_content,
            is_active: template.is_active,
        });
    };

    const handleSave = () => {
        if (!editingTemplate) return;
        updateTemplate.mutate({
            id: editingTemplate.id,
            ...formData,
        });
        setEditingTemplate(null);
    };

    const handlePreview = (template: EmailTemplate) => {
        // Replace variables with sample data for preview
        let html = template.html_content;
        html = html.replace(/\{\{customer_name\}\}/g, 'John Doe');
        html = html.replace(/\{\{order_id\}\}/g, 'ORD-12345678');
        html = html.replace(/\{\{total\}\}/g, '$29.99');
        html = html.replace(/\{\{product_name\}\}/g, 'Netflix Premium');
        html = html.replace(/\{\{items\}\}/g, '<div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 8px;"><span style="color: #ffffff;">Netflix Premium (1 Month)</span> - <span style="color: #00b8d4;">$14.99</span></div>');
        html = html.replace(/\{\{credentials\}\}/g, '<p style="color: #ffffff; margin: 0;"><strong>Email:</strong> user@example.com</p><p style="color: #ffffff; margin: 8px 0 0;"><strong>Password:</strong> SecurePass123</p>');
        html = html.replace(/\{\{expiry_date\}\}/g, 'February 22, 2026');
        html = html.replace(/\{\{status\}\}/g, 'Processing');
        html = html.replace(/\{\{message\}\}/g, 'Your order is being processed and will be delivered shortly.');

        setPreviewHtml(html);
        setShowPreview(true);
    };

    const handleSendPreview = () => {
        if (editingTemplate && previewEmail) {
            sendPreview.mutate({
                templateId: editingTemplate.id,
                toEmail: previewEmail,
            });
        }
    };

    const insertVariable = (variable: string) => {
        setFormData(prev => ({
            ...prev,
            html_content: prev.html_content + `{{${variable}}}`,
        }));
    };

    const getTemplateIcon = (key: string) => {
        switch (key) {
            case 'order_confirmation':
                return '📦';
            case 'product_delivery':
                return '🚀';
            case 'order_status_update':
                return '📊';
            default:
                return '📧';
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
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Email Templates</h1>
                <p className="text-muted-foreground">Customize automated email designs</p>
            </div>

            {/* Templates Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                    <Card key={template.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{getTemplateIcon(template.template_key)}</span>
                                    <div>
                                        <CardTitle className="text-lg">{template.name}</CardTitle>
                                        <CardDescription className="text-xs">{template.template_key}</CardDescription>
                                    </div>
                                </div>
                                <Badge variant={template.is_active ? 'default' : 'secondary'}>
                                    {template.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Subject:</p>
                                <p className="text-sm font-medium truncate">{template.subject}</p>
                            </div>

                            {template.description && (
                                <p className="text-xs text-muted-foreground">{template.description}</p>
                            )}

                            {template.variables && template.variables.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {(template.variables as string[]).map((v) => (
                                        <Badge key={v} variant="outline" className="text-xs">
                                            {`{{${v}}}`}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handlePreview(template)}
                                >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Preview
                                </Button>
                                <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleEdit(template)}
                                >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5" />
                            Edit Template: {editingTemplate?.name}
                        </DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="edit" className="mt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="edit" className="flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                Edit HTML
                            </TabsTrigger>
                            <TabsTrigger value="preview" className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Preview
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="edit" className="space-y-4 mt-4">
                            {/* Template Name */}
                            <div className="space-y-2">
                                <Label>Template Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>

                            {/* Subject */}
                            <div className="space-y-2">
                                <Label>Email Subject</Label>
                                <Input
                                    value={formData.subject}
                                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                    placeholder="Your order #{{order_id}} is confirmed!"
                                />
                            </div>

                            {/* Variables */}
                            {editingTemplate?.variables && (editingTemplate.variables as string[]).length > 0 && (
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Variable className="w-4 h-4" />
                                        Available Variables (click to insert)
                                    </Label>
                                    <div className="flex flex-wrap gap-2">
                                        {(editingTemplate.variables as string[]).map((v) => (
                                            <Button
                                                key={v}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => insertVariable(v)}
                                            >
                                                {`{{${v}}}`}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* HTML Content */}
                            <div className="space-y-2">
                                <Label>HTML Content</Label>
                                <Textarea
                                    value={formData.html_content}
                                    onChange={(e) => setFormData(prev => ({ ...prev, html_content: e.target.value }))}
                                    className="font-mono text-sm min-h-[400px]"
                                />
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                                <div>
                                    <p className="font-medium">Template Active</p>
                                    <p className="text-sm text-muted-foreground">Enable to use this template</p>
                                </div>
                                <Switch
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="preview" className="mt-4">
                            <div className="border border-border rounded-xl overflow-hidden">
                                <div className="bg-secondary/50 p-3 border-b border-border flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    <span className="text-sm font-medium">Email Preview</span>
                                </div>
                                <iframe
                                    srcDoc={formData.html_content
                                        .replace(/\{\{customer_name\}\}/g, 'John Doe')
                                        .replace(/\{\{order_id\}\}/g, 'ORD-12345678')
                                        .replace(/\{\{total\}\}/g, '$29.99')
                                        .replace(/\{\{product_name\}\}/g, 'Netflix Premium')
                                        .replace(/\{\{items\}\}/g, '<div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;"><span style="color: #ffffff;">Netflix Premium</span> - <span style="color: #00b8d4;">$14.99</span></div>')
                                        .replace(/\{\{credentials\}\}/g, '<p style="color: #fff; margin: 0;"><strong>Email:</strong> user@example.com</p><p style="color: #fff; margin: 8px 0 0;"><strong>Password:</strong> SecurePass123</p>')
                                        .replace(/\{\{expiry_date\}\}/g, 'February 22, 2026')
                                        .replace(/\{\{status\}\}/g, 'Processing')
                                        .replace(/\{\{message\}\}/g, 'Your order is being processed.')
                                    }
                                    className="w-full h-[500px] bg-white"
                                    title="Email Preview"
                                />
                            </div>

                            {/* Send Preview Email */}
                            <div className="mt-4 p-4 rounded-xl bg-secondary/50">
                                <Label className="mb-2 block">Send Preview to Email</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={previewEmail}
                                        onChange={(e) => setPreviewEmail(e.target.value)}
                                    />
                                    <Button onClick={handleSendPreview} disabled={!previewEmail || sendPreview.isPending}>
                                        {sendPreview.isPending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" />
                                                Send
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                        <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={updateTemplate.isPending}>
                            {updateTemplate.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Preview Modal */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Email Preview</DialogTitle>
                    </DialogHeader>
                    <div className="border border-border rounded-xl overflow-hidden mt-4">
                        <iframe
                            srcDoc={previewHtml}
                            className="w-full h-[600px] bg-white"
                            title="Email Preview"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminEmailTemplates;
