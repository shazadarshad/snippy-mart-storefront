import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps extends React.HTMLAttributes<SVGElement> {
    size?: number;
}

export const LoadingSpinner = ({ size = 24, className, ...props }: LoadingSpinnerProps) => {
    return (
        <Loader2
            size={size}
            className={cn("animate-spin", className)}
            {...props}
        />
    );
};
