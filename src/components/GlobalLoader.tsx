import { LoadingSpinner } from "@/components/ui/loading-spinner";

const GlobalLoader = () => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size={48} className="text-primary" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">
                    Loading Snippy Mart...
                </p>
            </div>
        </div>
    );
};

export default GlobalLoader;
