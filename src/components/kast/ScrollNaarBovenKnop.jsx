import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function ScrollNaarBovenKnop() {
  const [zichtbaar, setZichtbaar] = useState(false);

  useEffect(() => {
    const onScroll = () => setZichtbaar(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const naarBoven = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md px-5 pointer-events-none z-40">
      <div className="flex justify-end">
        <AnimatePresence>
          {zichtbaar && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ duration: 0.18 }}
              onClick={naarBoven}
              aria-label="Naar boven"
              className="pointer-events-auto w-10 h-10 rounded-full bg-white text-black border border-border shadow-[0_8px_24px_rgb(0,0,0,0.18)] flex items-center justify-center hover:bg-white/90 transition"
            >
              <ArrowUp className="w-4 h-4" strokeWidth={2} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}