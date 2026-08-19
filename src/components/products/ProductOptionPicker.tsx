import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { productPriceInLkr } from '@/hooks/useResellerApi';
import type { PricingPlan, PricingPlanVariant } from '@/hooks/usePricingPlans';
import type { Product } from '@/hooks/useProducts';

function packLabel(name: string) {
  return name.replace(/\s*Credits$/i, '').trim();
}

function warrantyLabel(name: string) {
  return name
    .replace(/\s*Warranty$/i, '')
    .replace(/^(\d+)\s*Day$/i, '$1 Days')
    .replace(/^(\d+)\s*Hour$/i, '$1 Hours')
    .trim();
}

interface ProductOptionPickerProps {
  product: Product;
  plans: PricingPlan[];
  activeVariants: PricingPlanVariant[];
  selectedPlan: PricingPlan | null;
  selectedVariant: PricingPlanVariant | null;
  onSelectPlan: (plan: PricingPlan) => void;
  onSelectVariant: (variant: PricingPlanVariant) => void;
  formatPrice: (lkr: number) => string;
}

const ProductOptionPicker = ({
  product,
  plans,
  activeVariants,
  selectedPlan,
  selectedVariant,
  onSelectPlan,
  onSelectVariant,
  formatPrice,
}: ProductOptionPickerProps) => {
  if (!plans.length) return null;

  const credits = plans.some((p) => /credit/i.test(p.name));
  const warranty = activeVariants.some((v) => /warranty|\bday\b|\bhour/i.test(v.name));
  const twoStep = !!product.use_variant_pricing;

  return (
    <div className="space-y-4">
      <section>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              1
            </span>
            <h3 className="text-sm font-semibold text-foreground truncate">
              {credits ? 'Credits' : twoStep ? 'Option' : 'Plan'}
            </h3>
          </div>
          {selectedPlan && (
            <span className="text-[11px] font-medium text-primary truncate max-w-[45%]">
              {packLabel(selectedPlan.name)}
            </span>
          )}
        </div>
        <div
          className={cn(
            'grid gap-1.5 sm:gap-2',
            credits ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3',
          )}
        >
          {plans.map((plan) => {
            const on = selectedPlan?.id === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => onSelectPlan(plan)}
                className={cn(
                  'relative min-h-[44px] rounded-xl border px-1.5 py-2 sm:px-2.5 sm:py-2.5 text-center touch-manipulation transition-colors',
                  on
                    ? 'border-primary bg-primary/10'
                    : 'border-border/80 bg-secondary/40 hover:border-primary/35',
                )}
              >
                <span className="block text-[12px] sm:text-sm font-semibold text-foreground leading-tight">
                  {credits ? packLabel(plan.name) : plan.name}
                </span>
                {plan.duration?.trim() && !credits ? (
                  <span className="block text-[10px] text-muted-foreground mt-0.5 leading-tight">
                    {plan.duration}
                  </span>
                ) : null}
                {!twoStep && (
                  <span className="block mt-0.5 text-[11px] sm:text-xs font-bold tabular-nums text-foreground">
                    {formatPrice(
                      productPriceInLkr({
                        price: plan.price,
                        reseller_product_id: product.reseller_product_id,
                      }),
                    )}
                  </span>
                )}
                {on && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-2 w-2 text-primary-foreground" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {twoStep && (
        <section>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  selectedPlan
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                2
              </span>
              <h3
                className={cn(
                  'text-sm font-semibold truncate',
                  selectedPlan ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {warranty || credits ? 'Warranty' : 'Package'}
              </h3>
            </div>
            {selectedVariant && (
              <span className="text-[11px] font-medium text-primary truncate max-w-[45%]">
                {warrantyLabel(selectedVariant.name)}
              </span>
            )}
          </div>

          {!selectedPlan ? (
            <p className="text-xs text-muted-foreground rounded-xl border border-dashed border-border px-3 py-3">
              {credits ? 'Choose credits first.' : 'Choose an option first.'}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {activeVariants.map((variant) => {
                const on = selectedVariant?.id === variant.id;
                const oos = variant.stock_status === 'out_of_stock';
                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={oos}
                    onClick={() => onSelectVariant(variant)}
                    className={cn(
                      'relative min-h-[52px] rounded-xl border px-2.5 py-2 sm:px-3 sm:py-2.5 text-left touch-manipulation transition-colors',
                      on
                        ? 'border-primary bg-primary/10'
                        : 'border-border/80 bg-secondary/40 hover:border-primary/35',
                      oos && 'opacity-45 pointer-events-none',
                    )}
                  >
                    <span className="block text-[13px] sm:text-sm font-semibold text-foreground leading-tight">
                      {warrantyLabel(variant.name)}
                    </span>
                    <span className="block mt-0.5 text-sm font-bold tabular-nums text-foreground">
                      {formatPrice(
                        productPriceInLkr({
                          price: variant.price,
                          reseller_product_id: product.reseller_product_id,
                        }),
                      )}
                    </span>
                    {on && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-2 w-2 text-primary-foreground" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ProductOptionPicker;
