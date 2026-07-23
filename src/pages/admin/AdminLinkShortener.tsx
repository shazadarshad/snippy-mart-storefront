import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Link2, Plus, Edit, Trash2, Search, Copy, ExternalLink,
  CheckCircle2, XCircle, AlertCircle, MousePointerClick, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type ShortLink = {
  id: string;
  slug: string;
  destination_url: string;
  title: string | null;
  click_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const SITE_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://snippymart.com';

/** Paths that already exist on the storefront — cannot be used as short codes */
const RESERVED_SLUGS = new Set([
  'admin', 'products', 'product', 'checkout', 'order-success', 'about',
  'contact', 'track-order', 'privacy-policy', 'refund-policy', 'download',
  'claude', 'terms-of-service', 'shared', 'api', 'assets', 'favicon.ico',
  'robots.txt', 'sitemap.xml', 'manifest.json', 'admin-manifest.json', 'sw.js', 'affiliate', 'affiliates',
]);

const slugRegex = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;

const normalizeSlug = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const AdminLinkShortener = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ShortLink | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    destination_url: '',
    title: '',
    is_active: true,
  });

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['admin-short-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('short_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ShortLink[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (vars: typeof formData) => {
      const slug = normalizeSlug(vars.slug);
      const destination = vars.destination_url.trim();

      if (!slug || !slugRegex.test(slug)) {
        throw new Error('Slug must start with a letter or number and use only a-z, 0-9, _ or - (max 64 chars).');
      }
      if (RESERVED_SLUGS.has(slug)) {
        throw new Error(`"${slug}" is reserved for the website and cannot be used.`);
      }
      if (!isValidUrl(destination)) {
        throw new Error('Enter a valid destination URL starting with http:// or https://');
      }

      const payload = {
        slug,
        destination_url: destination,
        title: vars.title.trim() || null,
        is_active: vars.is_active,
      };

      if (editingLink) {
        const { error } = await supabase
          .from('short_links')
          .update(payload)
          .eq('id', editingLink.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('short_links')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-short-links'] });
      toast({ title: editingLink ? 'Link updated' : 'Short link created' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      const message = error?.message || 'Something went wrong';
      const friendly = message.includes('duplicate') || message.includes('unique')
        ? 'That short code is already in use. Pick another.'
        : message;
      toast({
        title: 'Error saving link',
        description: friendly,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('short_links').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-short-links'] });
      toast({ title: 'Link deleted' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting link',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      slug: '',
      destination_url: '',
      title: '',
      is_active: true,
    });
    setEditingLink(null);
  };

  const handleEdit = (link: ShortLink) => {
    setEditingLink(link);
    setFormData({
      slug: link.slug,
      destination_url: link.destination_url,
      title: link.title || '',
      is_active: link.is_active,
    });
    setIsDialogOpen(true);
  };

  const shortUrl = (slug: string) => `${SITE_ORIGIN}/${slug}`;

  const copyLink = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(shortUrl(slug));
      toast({ title: 'Copied!', description: shortUrl(slug) });
    } catch {
      toast({ title: 'Could not copy', variant: 'destructive' });
    }
  };

  const filteredLinks = links.filter((l) =>
    l.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.destination_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalClicks = links.reduce((sum, l) => sum + (l.click_count || 0), 0);
  const activeCount = links.filter((l) => l.is_active).length;
  const previewSlug = normalizeSlug(formData.slug) || 'your-code';

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="admin-page-header mb-0">
        <div className="min-w-0">
          <h1 className="admin-page-title">Link Shortener</h1>
          <p className="admin-page-subtitle">
            Short links like <span className="font-mono text-primary">snippymart.com/deal</span>
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="font-bold h-11 rounded-xl touch-manipulation shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              Create Short Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px] glass-premium border-white/10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingLink ? 'Edit Short Link' : 'Create Short Link'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-2">
              <div className="space-y-2">
                <Label htmlFor="slug">Short code</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-mono shrink-0">
                    snippymart.com/
                  </span>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: normalizeSlug(e.target.value) })
                    }
                    placeholder="deal"
                    className="font-mono font-bold"
                    maxLength={64}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Preview: <span className="font-mono text-primary">{SITE_ORIGIN}/{previewSlug}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination_url">Destination URL</Label>
                <Input
                  id="destination_url"
                  value={formData.destination_url}
                  onChange={(e) =>
                    setFormData({ ...formData, destination_url: e.target.value })
                  }
                  placeholder="https://example.com/your-page"
                  type="url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Label (optional)</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Summer sale WhatsApp link"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
                <div className="space-y-0.5">
                  <Label className="text-base">Active</Label>
                  <p className="text-xs text-muted-foreground">
                    Inactive links show a 404 instead of redirecting.
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
              </div>

              <Button
                onClick={() => upsertMutation.mutate(formData)}
                disabled={
                  upsertMutation.isPending ||
                  !formData.slug.trim() ||
                  !formData.destination_url.trim()
                }
                className="w-full h-12 text-lg font-bold"
              >
                {upsertMutation.isPending
                  ? 'Saving...'
                  : editingLink
                    ? 'Update Link'
                    : 'Create Short Link'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search short codes, URLs, labels..."
            className="pl-9 h-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold">{activeCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
              Active Links
            </p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <MousePointerClick className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-bold">{totalClicks}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
              Total Clicks
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-bold">Short Link</TableHead>
              <TableHead className="font-bold">Destination</TableHead>
              <TableHead className="font-bold">Clicks</TableHead>
              <TableHead className="font-bold">Created</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Loading short links...</p>
                </TableCell>
              </TableRow>
            ) : filteredLinks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-4 opacity-20" />
                  <p className="text-lg font-bold text-foreground">No short links yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create your first short link to share snippymart.com/your-code
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredLinks.map((link) => (
                <TableRow key={link.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      {link.title && (
                        <span className="text-xs text-muted-foreground">{link.title}</span>
                      )}
                      <span className="font-mono font-bold text-primary">
                        /{link.slug}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <a
                      href={link.destination_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 max-w-[280px] truncate"
                      title={link.destination_url}
                    >
                      <span className="truncate">{link.destination_url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                    </a>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-bold">{link.click_count ?? 0}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] text-muted-foreground">
                      {format(new Date(link.created_at), 'MMM dd, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    {link.is_active ? (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-widest">
                        <XCircle className="w-3.5 h-3.5" />
                        Inactive
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyLink(link.slug)}
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                        title="Copy short link"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(link)}
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (window.confirm('Delete this short link? This cannot be undone.')) {
                            deleteMutation.mutate(link.id);
                          }
                        }}
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminLinkShortener;
