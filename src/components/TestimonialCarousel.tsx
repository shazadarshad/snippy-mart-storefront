import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Quote, Star, User, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useTestimonials } from '@/hooks/useTestimonials';
import { cn } from '@/lib/utils';

export const TestimonialCarousel = () => {
    const { data: testimonials = [], isLoading } = useTestimonials();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0); // -1 for left, 1 for right
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

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'ArrowRight') nextSlide();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextSlide, prevSlide]);

    // Auto-slide logic
    useEffect(() => {
        if (testimonials.length <= 1 || isHovered) return;
        const interval = setInterval(nextSlide, 6000);
        return () => clearInterval(interval);
    }, [nextSlide, testimonials.length, isHovered]);

    if (isLoading) {
        return (
            <div className="h-[400px] flex items-center justify-center">
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
                    <span key={i} className="inline-block scale-110 mx-0.5 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0,
            scale: 0.95
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0,
            scale: 0.95
        }),
    };

    return (
        <div
            className="relative w-full max-w-4xl mx-auto px-4 py-4 md:py-8"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative h-[450px] md:h-[350px] lg:h-[300px] flex items-center justify-center overflow-hidden touch-pan-y">
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
                            opacity: { duration: 0.3 },
                            scale: { duration: 0.4 }
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.7}
                        onDragEnd={(_, info) => {
                            if (info.offset.x > 100) prevSlide();
                            else if (info.offset.x < -100) nextSlide();
                        }}
                        className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 md:px-12 cursor-grab active:cursor-grabbing"
                    >
                        <div className="relative w-full max-w-2xl mx-auto">
                            {/* Decorative Quote Mark */}
                            <div className="absolute -top-10 -left-6 md:-left-10 opacity-5 select-none pointer-events-none">
                                <Quote className="w-16 h-16 md:w-24 md:h-24 text-primary rotate-180" />
                            </div>

                            {/* Avatar Section */}
                            <div className="relative z-10 w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-primary/20 p-1 mb-6 mx-auto group">
                                <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center overflow-hidden ring-4 ring-primary/5 shadow-inner">
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
                                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-xl ring-2 ring-primary/30">
                                    <CheckCircle2 className="w-5 h-5 text-primary fill-primary/10" />
                                </div>
                            </div>

                            {/* Stars */}
                            <div className="flex items-center justify-center gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={cn(
                                            "w-4 h-4 md:w-5 md:h-5 transition-all duration-300",
                                            i < activeTestimonial.rating ? "fill-amber-500 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" : "text-muted-foreground/20"
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Feedback Content */}
                            <blockquote className="text-lg md:text-2xl lg:text-3xl font-display font-medium text-foreground leading-snug md:leading-tight mb-8 italic select-none">
                                "{beautifyContent(activeTestimonial.content)}"
                            </blockquote>

                            {/* Author Name */}
                            <div className="space-y-1">
                                <cite className="not-italic text-lg md:text-xl font-display font-bold text-foreground block">
                                    {activeTestimonial.name || 'Verified Member'}
                                </cite>
                                <div className="text-sm md:text-base text-primary/80 font-medium tracking-wide uppercase">
                                    {activeTestimonial.role || 'Satisfied customer'}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Buttons - Hidden on small mobile, visible on tablet+ */}
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 hidden md:flex justify-between pointer-events-none z-20">
                <button
                    onClick={prevSlide}
                    aria-label="Previous testimonial"
                    className="w-12 h-12 rounded-full bg-background/80 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:scale-110 transition-all duration-300 pointer-events-auto shadow-xl -ml-6 lg:-ml-12 group"
                >
                    <ChevronLeft className="w-6 h-6 group-active:-translate-x-1 transition-transform" />
                </button>
                <button
                    onClick={nextSlide}
                    aria-label="Next testimonial"
                    className="w-12 h-12 rounded-full bg-background/80 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:scale-110 transition-all duration-300 pointer-events-auto shadow-xl -mr-6 lg:-mr-12 group"
                >
                    <ChevronRight className="w-6 h-6 group-active:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Pagination / Progress */}
            <div className="flex justify-center items-center gap-3 mt-4 md:mt-8">
                {testimonials.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            setDirection(i > currentIndex ? 1 : -1);
                            setCurrentIndex(i);
                        }}
                        className={cn(
                            "h-2 rounded-full transition-all duration-500",
                            i === currentIndex
                                ? "w-10 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                                : "w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                        )}
                        aria-label={`Go to testimonial ${i + 1}`}
                    />
                ))}
            </div>

            {/* Mobile swipe hint */}
            <div className="text-center mt-6 md:hidden">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium opacity-50">
                    Swipe to explore more reviews
                </p>
            </div>
        </div>
    );
};
