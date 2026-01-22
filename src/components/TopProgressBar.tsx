import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const TopProgressBar = () => {
    const location = useLocation();
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        setIsAnimating(true);
        const timer = setTimeout(() => {
            setIsAnimating(false);
        }, 400); // Super fast feel

        return () => clearTimeout(timer);
    }, [location.pathname]);

    return (
        <AnimatePresence>
            {isAnimating && (
                <motion.div
                    initial={{ scaleX: 0, opacity: 1, originX: 0 }}
                    animate={{
                        scaleX: 1,
                        opacity: 1,
                        transition: { duration: 0.4, ease: "easeOut" }
                    }}
                    exit={{
                        opacity: 0,
                        transition: { duration: 0.2 }
                    }}
                    className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-accent to-primary z-[10000] shadow-[0_0_10px_rgba(0,184,212,0.5)]"
                />
            )}
        </AnimatePresence>
    );
};

export default TopProgressBar;
