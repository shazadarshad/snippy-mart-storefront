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
        <div className="relative w-full max-w-5xl mx-auto px-4 overflow-hidden py-12">
            <div className="relative aspect-[16/9] md:aspect-[21/9] flex items-center justify-center">
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
                            <div className="absolute -top-6 -left-8 md:-left-12 opacity-10">
                                <Quote className="w-16 h-16 md:w-24 md:h-24 text-primary rotate-180" />
                            </div>
                            <div className="relative z-10 w-24 h-24 rounded-full border-4 border-primary/20 p-1 mb-6 mx-auto group">
                                <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center overflow-hidden ring-4 ring-primary/5">
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
                                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-lg ring-2 ring-primary/20">
                                    <CheckCircle2 className="w-5 h-5 text-primary fill-primary/10" />
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-1.5 mb-8">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={cn(
                                            "w-5 h-5 transition-all duration-300",
                                            i < activeTestimonial.rating ? "fill-amber-500 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" : "text-muted-foreground/20"
                                        )}
                                    />
                                ))}
                            </div>

                            <blockquote className="text-2xl md:text-3xl lg:text-4xl font-display font-medium text-foreground leading-tight md:leading-tight max-w-4xl mb-10 italic">
                                "{activeTestimonial.content}"
                            </blockquote>

                            <div className="space-y-2">
                                <cite className="not-italic text-xl md:text-2xl font-display font-bold text-foreground inline-flex items-center gap-2">
                                    {activeTestimonial.name || 'Verified Member'}
                                </cite>
                                <div className="text-base text-primary/80 font-medium tracking-wide uppercase">
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
