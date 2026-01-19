import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Star, User, Quote, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
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
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { useTestimonials, useAddTestimonial, useUpdateTestimonial, useDeleteTestimonial, type Testimonial, type TestimonialFormData } from '@/hooks/useTestimonials';
import { cn } from '@/lib/utils';

const AdminTestimonials = () => {
    const { data: testimonials = [], isLoading } = useTestimonials(true);
    const addTestimonial = useAddTestimonial();
    const updateTestimonial = useUpdateTestimonial();
    const deleteTestimonial = useDeleteTestimonial();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
    const [formData, setFormData] = useState<TestimonialFormData>({
        name: '',
        role: '',
        avatar_url: '',
        content: '',
        rating: 5,
        is_active: true,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'rating' ? parseInt(value) || 5 : value,
        }));
    };

    const handleOpenDialog = (testimonial?: Testimonial) => {
        if (testimonial) {
            setEditingTestimonial(testimonial);
            setFormData({
                name: testimonial.name,
                role: testimonial.role,
                avatar_url: testimonial.avatar_url,
                content: testimonial.content,
                rating: testimonial.rating,
                is_active: testimonial.is_active,
            });
        } else {
            setEditingTestimonial(null);
            setFormData({
                name: '',
                role: '',
                avatar_url: '',
                content: '',
                rating: 5,
                is_active: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTestimonial) {
            await updateTestimonial.mutateAsync({ id: editingTestimonial.id, ...formData });
        } else {
            await addTestimonial.mutateAsync(formData);
        }
        setIsDialogOpen(false);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this testimonial?')) {
            await deleteTestimonial.mutateAsync(id);
        }
    };

    const handleToggleActive = async (testimonial: Testimonial) => {
        await updateTestimonial.mutateAsync({
            id: testimonial.id,
            ...testimonial,
            is_active: !testimonial.is_active,
        });
    };

    const beautifyPreview = (text: string) => {
        if (!text) return "";
        const emojiRegex = /([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])/gu;
        const parts = text.split(emojiRegex);
        return parts.map((part, i) => {
            if (emojiRegex.test(part)) {
                return (
                    <span key={i} className="inline-block scale-110 mx-0.5 filter drop-shadow-[0_0_5px_rgba(var(--primary),0.3)] font-normal not-italic">
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Testimonials</h1>
                    <p className="text-muted-foreground">Manage customer reviews and feedback</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="hero" onClick={() => handleOpenDialog()}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Testimonial
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md bg-card border-border">
                        <DialogHeader>
                            <DialogTitle className="text-foreground">
                                {editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Customer Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. John Doe (Optional)"
                                    className="bg-secondary/50 border-border"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role / Location</Label>
                                <Input
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Software Engineer or Colombo, SL"
                                    className="bg-secondary/50 border-border"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rating">Rating (1-5)</Label>
                                <Input
                                    id="rating"
                                    name="rating"
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={formData.rating}
                                    onChange={handleInputChange}
                                    className="bg-secondary/50 border-border"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content">Review Content</Label>
                                <Tabs defaultValue="write" className="w-full">
                                    <TabsList className="bg-secondary/50 border border-border h-8 mb-2">
                                        <TabsTrigger value="write" className="text-xs">Write</TabsTrigger>
                                        <TabsTrigger value="preview" className="text-xs">Live Preview</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="write">
                                        <Textarea
                                            id="content"
                                            name="content"
                                            value={formData.content}
                                            onChange={handleInputChange}
                                            placeholder="What did they say about Snippy Mart?"
                                            className="bg-secondary/50 border-border min-h-[100px]"
                                            required
                                        />
                                    </TabsContent>
                                    <TabsContent value="preview" className="bg-secondary/30 border border-border rounded-lg p-4 min-h-[100px]">
                                        <div className="flex flex-col items-center text-center space-y-4">
                                            <div className="relative w-16 h-16 rounded-full border-2 border-primary/20 p-1">
                                                <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center">
                                                    <User className="w-8 h-8 text-muted-foreground" />
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-lg ring-1 ring-primary/20">
                                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                                </div>
                                            </div>
                                            <blockquote className="text-lg font-medium text-foreground italic">
                                                "{beautifyPreview(formData.content) || "Your testimonial content will appear here..."}"
                                            </blockquote>
                                            <div>
                                                <p className="font-bold gradient-text">{formData.name || "Verified Member"}</p>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider">{formData.role || "Satisfied customer"}</p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                            <div className="flex items-center gap-2 py-2">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                                />
                                <Label htmlFor="is_active">Show on website</Label>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="hero" className="flex-1" disabled={addTestimonial.isPending || updateTestimonial.isPending}>
                                    {(addTestimonial.isPending || updateTestimonial.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {editingTestimonial ? 'Update' : 'Add'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : testimonials.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No testimonials found. Add your first customer review!
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-secondary/50 border-b border-border">
                                    <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Customer</th>
                                    <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Review</th>
                                    <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Rating</th>
                                    <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                                    <th className="px-6 py-4 text-sm font-medium text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {testimonials.map((t) => (
                                    <tr key={t.id} className={cn("hover:bg-secondary/20 transition-colors", !t.is_active && "opacity-60")}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                                                    <User className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{t.name}</p>
                                                    <p className="text-xs text-muted-foreground">{t.role || 'Verified Customer'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <div className="flex gap-2">
                                                <Quote className="w-4 h-4 text-primary shrink-0 opacity-50" />
                                                <p className="text-sm text-muted-foreground line-clamp-2 italic">{t.content}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={cn("w-3.5 h-3.5", i < t.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30")} />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                t.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                            )}>
                                                {t.is_active ? 'Active' : 'Hidden'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleToggleActive(t)} title={t.is_active ? "Hide" : "Show"}>
                                                {t.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(t)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(t.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminTestimonials;
