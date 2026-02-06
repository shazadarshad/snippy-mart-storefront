import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Edit, Save, X, Brain, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIKnowledgeItem {
    id: string;
    category: string;
    question?: string;
    answer?: string;
    key: string;
    value: string;
    is_active: boolean;
    priority: number;
}

export default function AdminAIKnowledge() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        category: 'product_detail',
        question: '',
        answer: '',
        key: '',
        value: '',
        priority: 0,
    });

    // Fetch AI knowledge items
    const { data: knowledgeItems, isLoading } = useQuery({
        queryKey: ['ai-knowledge'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ai_knowledge_items')
                .select('*')
                .order('priority', { ascending: false });

            if (error) throw error;
            return data as AIKnowledgeItem[];
        },
    });

    // Add/Update mutation
    const saveMutation = useMutation({
        mutationFn: async (item: Partial<AIKnowledgeItem>) => {
            if (editingId) {
                const { error } = await supabase
                    .from('ai_knowledge_items')
                    .update(item)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('ai_knowledge_items')
                    .insert([{ ...item, is_active: true }]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-knowledge'] });
            toast({
                title: 'Success',
                description: editingId ? 'Knowledge updated' : 'Knowledge added',
            });
            resetForm();
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('ai_knowledge_items')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-knowledge'] });
            toast({
                title: 'Success',
                description: 'Knowledge deleted',
            });
        },
    });

    // Toggle active mutation
    const toggleActiveMutation = useMutation({
        mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
            const { error } = await supabase
                .from('ai_knowledge_items')
                .update({ is_active })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-knowledge'] });
        },
    });

    const resetForm = () => {
        setFormData({
            category: 'product_detail',
            question: '',
            answer: '',
            key: '',
            value: '',
            priority: 0,
        });
        setEditingId(null);
        setIsAdding(false);
    };

    const handleEdit = (item: AIKnowledgeItem) => {
        setFormData({
            category: item.category,
            question: item.question || '',
            answer: item.answer || '',
            key: item.key,
            value: item.value,
            priority: item.priority,
        });
        setEditingId(item.id);
        setIsAdding(true);
    };

    const handleSave = () => {
        if (!formData.key || !formData.value) {
            toast({
                title: 'Error',
                description: 'Key and Value are required',
                variant: 'destructive',
            });
            return;
        }

        saveMutation.mutate(formData);
    };

    const getCategoryBadge = (category: string) => {
        const badges: Record<string, { color: string; label: string }> = {
            product_detail: { color: 'bg-blue-500', label: 'Product Detail' },
            faq: { color: 'bg-green-500', label: 'FAQ' },
            policy: { color: 'bg-purple-500', label: 'Policy' },
            general: { color: 'bg-gray-500', label: 'General' },
        };
        const badge = badges[category] || badges.general;
        return (
            <span className={`${badge.color} text-white text-xs px-2 py-1 rounded-full`}>
                {badge.label}
            </span>
        );
    };

    if (isLoading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Brain className="w-8 h-8 text-blue-500" />
                        AI Knowledge Base
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Train your AI assistant with custom knowledge
                    </p>
                </div>
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2"
                >
                    {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {isAdding ? 'Cancel' : 'Add Knowledge'}
                </Button>
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
                <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-2 border-blue-200 dark:border-blue-800">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-500" />
                        {editingId ? 'Edit Knowledge' : 'Add New Knowledge'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Category</label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="product_detail">Product Detail</SelectItem>
                                    <SelectItem value="faq">FAQ</SelectItem>
                                    <SelectItem value="policy">Policy</SelectItem>
                                    <SelectItem value="general">General</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Priority (0-100)</label>
                            <Input
                                type="number"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                                placeholder="Higher = shown first"
                            />
                        </div>

                        {formData.category === 'faq' && (
                            <>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-2">Question</label>
                                    <Input
                                        value={formData.question}
                                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                        placeholder="e.g., Does Cursor Pro require email and password?"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-2">Answer</label>
                                    <Textarea
                                        value={formData.answer}
                                        onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                        placeholder="Provide the answer..."
                                        rows={3}
                                    />
                                </div>
                            </>
                        )}

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">
                                Key {formData.category === 'product_detail' && '(e.g., login_method, account_type)'}
                            </label>
                            <Input
                                value={formData.key}
                                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                                placeholder="e.g., cursor_pro_login_method"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">Value / Information</label>
                            <Textarea
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                placeholder="e.g., Cursor Pro accounts require both email and password for login"
                                rows={4}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <Button onClick={handleSave} className="flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            {editingId ? 'Update' : 'Save'}
                        </Button>
                        <Button onClick={resetForm} variant="outline">
                            Cancel
                        </Button>
                    </div>
                </Card>
            )}

            {/* Knowledge Items List */}
            <div className="grid grid-cols-1 gap-4">
                {knowledgeItems?.map((item) => (
                    <Card key={item.id} className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    {getCategoryBadge(item.category)}
                                    <span className="text-xs text-gray-500">
                                        Priority: {item.priority}
                                    </span>
                                    <label className="flex items-center gap-1 text-xs">
                                        <input
                                            type="checkbox"
                                            checked={item.is_active}
                                            onChange={(e) =>
                                                toggleActiveMutation.mutate({
                                                    id: item.id,
                                                    is_active: e.target.checked,
                                                })
                                            }
                                            className="rounded"
                                        />
                                        Active
                                    </label>
                                </div>

                                {item.question && (
                                    <div className="mb-2">
                                        <p className="font-semibold text-sm">Q: {item.question}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            A: {item.answer}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <p className="text-sm">
                                        <span className="font-semibold">Key:</span> {item.key}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        <span className="font-semibold">Value:</span> {item.value}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(item)}
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deleteMutation.mutate(item.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}

                {knowledgeItems?.length === 0 && (
                    <Card className="p-12 text-center">
                        <Brain className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Knowledge Items Yet</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Start training your AI by adding custom knowledge
                        </p>
                        <Button onClick={() => setIsAdding(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Knowledge Item
                        </Button>
                    </Card>
                )}
            </div>

            {/* Examples Section */}
            <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    Example Knowledge Items
                </h3>
                <div className="space-y-2 text-sm">
                    <div>
                        <p className="font-semibold">Product Detail:</p>
                        <p className="text-gray-600 dark:text-gray-400">
                            Key: "cursor_pro_login" → Value: "Cursor Pro requires email and password. Account is on your personal email."
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold">FAQ:</p>
                        <p className="text-gray-600 dark:text-gray-400">
                            Question: "Is ChatGPT Plus on my account?" → Answer: "Yes, ChatGPT Plus is added to your existing account. You just need to provide your email."
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold">General:</p>
                        <p className="text-gray-600 dark:text-gray-400">
                            Key: "delivery_speed" → Value: "Most orders are delivered within 2-6 hours during business hours"
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
