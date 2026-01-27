import { useState } from 'react';
import { Tag, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCoupons } from '@/hooks/useCoupons';
import { useCartStore } from '@/lib/store';

export const CouponInput = () => {
    const [code, setCode] = useState('');
    const { validateAndApplyCoupon, isValidating } = useCoupons();
    const { appliedCoupon, removeCoupon } = useCartStore();

    const handleApply = async () => {
        const success = await validateAndApplyCoupon(code);
        if (success) {
            setCode('');
        }
    };

    if (appliedCoupon) {
        return (
            <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Tag className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-primary">Coupon Active</p>
                        <p className="text-sm font-bold text-foreground">{appliedCoupon.code}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeCoupon}
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Have a promo code?</p>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="e.g. WELCOME10"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                        className="pl-9 h-11 bg-secondary/30 border-border text-sm font-bold uppercase"
                    />
                </div>
                <Button
                    onClick={handleApply}
                    disabled={isValidating || !code.trim()}
                    className="h-11 px-6 font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                >
                    {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </Button>
            </div>
        </div>
    );
};
