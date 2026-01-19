import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Star, User, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useTestimonials } from '@/hooks/useTestimonials';
import { cn } from '@/lib/utils';

export const TestimonialCarousel = () => {
    const { data: testimonials = [], isLoading } = useTestimonials();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

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
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'ArrowRight') nextSlide();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextSlide, prevSlide]);

    useEffect(() => {
        if (testimonials.length <= 1 || isHovered) return;
        const interval = setInterval(nextSlide, 6000);
        return () => clearInterval(interval);
    }, [nextSlide, testimonials.length, isHovered]);

    if (isLoading) {
        return (
            <div className="h-[300px] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    if (testimonials.length === 0) return null;

    const activeTestimonial = testimonials[currentIndex];

    const beautifyContent = (text: string) => {
        if (!text) return "";
        const emojiRegex = /([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])/gu;
        const parts = text.split(emojiRegex);
        return parts.map((part, i) => {
            if (emojiRegex.test(part)) {
                return (
                    <span key={i} className="inline-block animate-pulse-soft scale-110 mx-0.5 filter drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
            scale: 0.9
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 300 : -300,
            opacity: 0,
            scale: 0.9
        }),
    };

    return (
        <div
            className="relative w-full max-w-4xl mx-auto px-4 py-4"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative min-h-[420px] sm:min-h-[350px] flex items-center justify-center overflow-hidden touch-pan-y">
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
                            opacity: { duration: 0.3 }
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={(_, info) => {
                            if (info.offset.x > 50) prevSlide();
                            else if (info.offset.x < -50) nextSlide();
                        }}
                        className="w-full flex flex-col items-center justify-center text-center px-2 sm:px-12 cursor-grab active:cursor-grabbing"
                    >
                        <div className="relative w-full max-w-2xl bg-card/30 backdrop-blur-sm border border-white/5 p-6 sm:p-8 rounded-3xl shadow-2xl">
                            {/* Decorative Quote Mark */}
                            <div className="absolute -top-4 -left-2 opacity-10 select-none pointer-events-none">
                                <Quote className="w-10 h-10 text-primary rotate-180" />
                            </div>

                            {/* Avatar Section */}
                            <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-primary/30 p-1 mb-4 mx-auto">
                                <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center overflow-hidden ring-2 ring-primary/10 shadow-lg">
                                    {activeTestimonial.avatar_url ? (
                                        <img src={activeTestimonial.avatar_url} alt={activeTestimonial.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <img
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeTestimonial.id}`}
                                            alt="Avatar"
                                            className="w-full h-full object-cover bg-primary/5"
                                        />
                                    )}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5 shadow-lg ring-1 ring-primary/40">
                                    <CheckCircle2 className="w-4 h-4 text-primary fill-primary/10" />
                                </div>
                            </div>

                            {/* Stars */}
                            <div className="flex items-center justify-center gap-0.5 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={cn(
                                            "w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300",
                                            i < activeTestimonial.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/20"
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Feedback Content */}
                            <blockquote className="text-base sm:text-xl md:text-2xl font-display font-medium text-foreground leading-relaxed sm:leading-tight mb-6 italic select-none">
                                "{beautifyContent(activeTestimonial.content)}"
                            </blockquote>

                            {/* Author Name */}
                            <div className="space-y-0.5">
                                <cite className="not-italic text-base sm:text-lg font-display font-bold text-foreground block">
                                    {activeTestimonial.name || 'Verified Member'}
                                </cite>
                                <div className="text-[10px] sm:text-xs text-primary/70 font-bold tracking-widest uppercase">
                                    {activeTestimonial.role || 'Satisfied customer'}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Buttons - Visible on all but smallest mobile */}
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between pointer-events-none z-20 px-1 sm:px-0">
                <button
                    onClick={prevSlide}
                    aria-label="Previous"
                    className="w-10 h-10 rounded-full bg-background/60 backdrop-blur-lg border border-white/10 flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 pointer-events-auto shadow-xl sm:-ml-10"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                    onClick={nextSlide}
                    aria-label="Next"
                    className="w-10 h-10 rounded-full bg-background/60 backdrop-blur-lg border border-white/10 flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 pointer-events-auto shadow-xl sm:-mr-10"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Pagination / Progress */}
            <div className="flex justify-center items-center gap-2.5 mt-6">
                {testimonials.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            setDirection(i > currentIndex ? 1 : -1);
                            setCurrentIndex(i);
                        }}
                        className={cn(
                            "h-1.5 rounded-full transition-all duration-500",
                            i === currentIndex
                                ? "w-8 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]"
                                : "w-1.5 bg-muted-foreground/20"
                        )}
                        aria-label={`Testimonial ${i + 1}`}
                    />
                ))}
            </div>

            {/* Mobile swipe hint */}
            <div className="text-center mt-4 sm:hidden">
                <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-bold opacity-40">
                    Swipe for more reviews
                </p>
            </div>
        </div>
    );
};
