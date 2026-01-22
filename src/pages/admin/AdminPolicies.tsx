import { useState, useEffect } from 'react';
import { FileText, Save, Eye, Edit3, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePolicies, useUpdatePolicy, type Policy } from '@/hooks/usePolicies';

const AdminPolicies = () => {
    const { data: policies, isLoading } = usePolicies();
    const updatePolicy = useUpdatePolicy();
    const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
    const [editedContent, setEditedContent] = useState('');
    const [editedTitle, setEditedTitle] = useState('');
    const [editedHighlightedWord, setEditedHighlightedWord] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [activeTab, setActiveTab] = useState('edit');

    useEffect(() => {
        if (policies && policies.length > 0 && !selectedPolicy) {
            selectPolicy(policies[0]);
        }
    }, [policies]);

    const selectPolicy = (policy: Policy) => {
        setSelectedPolicy(policy);
        setEditedContent(policy.content);
        setEditedTitle(policy.title);
        setEditedHighlightedWord(policy.highlighted_word);
        setEditedDescription(policy.description);
    };

    const handleSave = () => {
        if (!selectedPolicy) return;

        updatePolicy.mutate({
            id: selectedPolicy.id,
            updates: {
                title: editedTitle,
                highlighted_word: editedHighlightedWord,
                description: editedDescription,
                content: editedContent,
            }
        });
    };

    const getPolicyLabel = (key: string) => {
        switch (key) {
            case 'privacy_policy': return 'Privacy Policy';
            case 'terms_of_service': return 'Terms of Service';
            case 'refund_policy': return 'Refund Policy';
            default: return key;
        }
    };

    const getPolicyIcon = (key: string) => {
        switch (key) {
            case 'privacy_policy': return '🔒';
            case 'terms_of_service': return '📜';
            case 'refund_policy': return '💰';
            default: return '📄';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
                        <FileText className="w-7 h-7 text-primary" />
                        Policy Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Edit your website's legal policies
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={updatePolicy.isPending || !selectedPolicy}
                    className="gap-2"
                >
                    {updatePolicy.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Save Changes
                </Button>
            </div>

            {/* Policy Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {policies?.map((policy) => (
                    <button
                        key={policy.id}
                        onClick={() => selectPolicy(policy)}
                        className={`p-4 rounded-xl border text-left transition-all ${selectedPolicy?.id === policy.id
                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                                : 'border-border bg-card hover:border-primary/50'
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{getPolicyIcon(policy.policy_key)}</span>
                            <span className="font-semibold text-foreground">
                                {getPolicyLabel(policy.policy_key)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            Updated: {new Date(policy.last_updated).toLocaleDateString()}
                        </div>
                        {selectedPolicy?.id === policy.id && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium">
                                <CheckCircle className="w-3 h-3" />
                                Currently Editing
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {selectedPolicy && (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    {/* Policy Details */}
                    <div className="p-6 border-b border-border bg-secondary/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    placeholder="Policy title"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Highlighted Word</Label>
                                <Input
                                    value={editedHighlightedWord}
                                    onChange={(e) => setEditedHighlightedWord(e.target.value)}
                                    placeholder="Highlighted word"
                                />
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <Label>SEO Description</Label>
                            <Input
                                value={editedDescription}
                                onChange={(e) => setEditedDescription(e.target.value)}
                                placeholder="Brief description for search engines"
                            />
                        </div>
                    </div>

                    {/* Content Editor */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="px-6 py-3 border-b border-border bg-secondary/20">
                            <TabsList className="bg-secondary/50">
                                <TabsTrigger value="edit" className="gap-2">
                                    <Edit3 className="w-4 h-4" />
                                    Edit HTML
                                </TabsTrigger>
                                <TabsTrigger value="preview" className="gap-2">
                                    <Eye className="w-4 h-4" />
                                    Preview
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="edit" className="p-6 mt-0">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Content (HTML)</Label>
                                    <span className="text-xs text-muted-foreground">
                                        Use &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt; tags
                                    </span>
                                </div>
                                <Textarea
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    placeholder="Enter policy content in HTML..."
                                    className="min-h-[500px] font-mono text-sm"
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="preview" className="p-6 mt-0">
                            <div className="rounded-xl border border-border bg-background p-6 md:p-8">
                                <div className="text-center mb-8">
                                    <h1 className="text-3xl font-bold">
                                        {editedTitle} <span className="gradient-text">{editedHighlightedWord}</span>
                                    </h1>
                                    <p className="text-muted-foreground mt-2">{editedDescription}</p>
                                </div>
                                <div
                                    className="policy-preview"
                                    dangerouslySetInnerHTML={{ __html: editedContent }}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}

            {/* Preview Styles */}
            <style>{`
                .policy-preview h2 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: hsl(var(--foreground));
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid hsl(var(--border));
                }
                
                .policy-preview h2:first-child {
                    margin-top: 0;
                }
                
                .policy-preview p {
                    color: hsl(var(--muted-foreground));
                    line-height: 1.8;
                    margin-bottom: 1rem;
                }
                
                .policy-preview ul {
                    margin: 1rem 0;
                    padding-left: 0;
                    list-style: none;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                
                .policy-preview li {
                    color: hsl(var(--muted-foreground));
                    line-height: 1.7;
                    padding: 0.75rem 1rem 0.75rem 2.5rem;
                    background: hsl(var(--secondary) / 0.3);
                    border-radius: 0.5rem;
                    position: relative;
                }
                
                .policy-preview li::before {
                    content: '';
                    position: absolute;
                    left: 0.75rem;
                    top: 1rem;
                    width: 8px;
                    height: 8px;
                    background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
                    border-radius: 50%;
                }
                
                .policy-preview strong {
                    color: hsl(var(--foreground));
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
};

export default AdminPolicies;
