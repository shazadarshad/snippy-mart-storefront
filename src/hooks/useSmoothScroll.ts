import { useEffect } from 'react';
import Lenis from 'lenis';

export const useSmoothScroll = () => {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        });

        // Expose lenis for specific components if needed
        (window as any).lenis = lenis;

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        // Auto-stop Lenis when body scroll is locked by Radix or other modals
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const isLocked = document.body.style.overflow === 'hidden' ||
                        document.body.hasAttribute('data-scroll-locked');
                    if (isLocked) {
                        lenis.stop();
                    } else {
                        lenis.start();
                    }
                }
            });
        });

        observer.observe(document.body, { attributes: true });

        // Also check initial state
        if (document.body.style.overflow === 'hidden' || document.body.hasAttribute('data-scroll-locked')) {
            lenis.stop();
        }

        return () => {
            lenis.destroy();
            observer.disconnect();
            delete (window as any).lenis;
        };
    }, []);
};
