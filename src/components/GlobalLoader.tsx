import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const GlobalLoader = () => {
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        const hasLoaded = sessionStorage.getItem('app_loaded');
        if (hasLoaded) {
            setIsInitialLoad(false);
        } else {
            sessionStorage.setItem('app_loaded', 'true');
        }
    }, []);

    // Minimal loader for sub-page/chunk fetching
    if (!isInitialLoad) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/30 backdrop-blur-md">
                <div className="relative">
                    <motion.div
                        className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                        className="absolute inset-0 w-12 h-12 border-2 border-accent/20 border-b-accent rounded-full"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                </div>
            </div>
        );
    }

    // Premium Splash Screen for First Load
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0f]">
            {/* Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />

            <div className="relative flex flex-col items-center">
                {/* Logo Animation */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="relative mb-8"
                >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent p-0.5 shadow-2xl shadow-primary/20">
                        <div className="w-full h-full rounded-[14px] bg-[#0a0a0f] flex items-center justify-center">
                            <motion.img
                                src="/android-chrome-192x192.png"
                                alt="Logo"
                                className="w-12 h-12"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Text */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-center"
                >
                    <h2 className="text-xl font-display font-bold text-white tracking-tight mb-4">
                        Snippy<span className="gradient-text">Mart</span>
                    </h2>

                    <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-primary via-accent to-primary"
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            style={{ width: '100%' }}
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default GlobalLoader;
