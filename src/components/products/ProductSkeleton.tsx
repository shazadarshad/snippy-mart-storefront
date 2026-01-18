import { Skeleton } from "@/components/ui/skeleton";

export const ProductSkeleton = () => {
    return (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
            {/* Image Skeleton */}
            <Skeleton className="aspect-square w-full" />

            {/* Content Skeleton */}
            <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                </div>

                <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-4 w-12" />
                </div>

                <Skeleton className="h-10 w-full rounded-xl" />
            </div>
        </div>
    );
};

export const ProductsGridSkeleton = ({ count = 4 }: { count?: number }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <ProductSkeleton key={i} />
            ))}
        </div>
    );
};
