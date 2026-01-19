import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Star, User, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useTestimonials } from '@/hooks/useTestimonials';
import { cn } from '@/lib/utils';

export const TestimonialCarousel = () => {
    const { data: testimonials = [], isLoading } = useTestimonials();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0); // -1 for left, 1 for right

    const nextSlide = useCallback(() => {
        if (testimonials.length <= 1) return;
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, [testimonials.length]);

    const prevSlide = useCallback(() => {
        if (testimonials.length <= 1) return;
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    }, [testimonials.length]);

    useEffect(() => {
        if (testimonials.length <= 1) return;
        const interval = setInterval(nextSlide, 6000);
        return () => clearInterval(interval);
    }, [nextSlide, testimonials.length]);

    if (isLoading) {
        return (
            <div className="h-[400px] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    if (testimonials.length === 0) return null;

    const activeTestimonial = testimonials[currentIndex];

    // Helper to beautify text (wrap emojis in a span for styling)
    const beautifyContent = (text: string) => {
        if (!text) return "";

        // Regex to match emojis
        const emojiRegex = /([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])/gu;

        const parts = text.split(emojiRegex);
        return parts.map((part, i) => {
            if (emojiRegex.test(part)) {
                return (
                    <span key={i} className="inline-block scale-110 mx-0.5 filter drop-shadow-[0_0_5px_rgba(var(--primary),0.3)] animate-pulse-soft">
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
        }),
    };

    return (
        <div className="relative w-full max-w-4xl mx-auto px-4 overflow-hidden py-8">
            <div className="relative aspect-[16/10] md:aspect-[21/7] flex items-center justify-center">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.4 },
                        }}
                        className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 md:px-12"
                    >
                        <div className="relative mb-8">
                            <div className="absolute -top-4 -left-6 md:-left-10 opacity-5">
                                <Quote className="w-12 h-12 md:w-20 md:h-20 text-primary rotate-180" />
                            </div>
                            <div className="relative z-10 w-16 h-16 rounded-full border-2 border-primary/20 p-0.5 mb-4 mx-auto group">
                                <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center overflow-hidden ring-2 ring-primary/5">
                                    {activeTestimonial.avatar_url ? (
                                        <img src={activeTestimonial.avatar_url} alt={activeTestimonial.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <img
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeTestimonial.id}`}
                                            alt="Avatar"
                                            className="w-full h-full object-cover bg-primary/10"
                                        />
                                    )}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5 shadow-lg ring-1 ring-primary/20">
                                    <CheckCircle2 className="w-4 h-4 text-primary fill-primary/10" />
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={cn(
                                            "w-4 h-4 transition-all duration-300",
                                            i < activeTestimonial.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/20"
                                        )}
                                    />
                                ))}
                            </div>

                            <blockquote className="text-lg md:text-xl lg:text-2xl font-display font-medium text-foreground leading-relaxed max-w-3xl mb-6 italic">
                                "{beautifyContent(activeTestimonial.content)}"
                            </blockquote>

                            <div className="space-y-1">
                                <cite className="not-italic text-lg md:text-xl font-display font-bold text-foreground">
                                    {activeTestimonial.name || 'Verified Member'}
                                </cite>
                                <div className="text-sm text-primary/80 font-medium tracking-wide uppercase">
                                    {activeTestimonial.role || 'Satisfied customer'}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between pointer-events-none px-2 sm:px-4">
                <button
                    onClick={prevSlide}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/50 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 pointer-events-auto shadow-lg"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={nextSlide}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/50 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 pointer-events-auto shadow-lg"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            {/* Pagination dots */}
            <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            setDirection(i > currentIndex ? 1 : -1);
                            setCurrentIndex(i);
                        }}
                        className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            i === currentIndex ? "w-8 bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                        )}
                    />
                ))}
            </div>
        </div>
    );
};
