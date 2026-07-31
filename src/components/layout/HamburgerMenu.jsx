import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, History, User, Cloud, Settings } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  const items = [
    { to: '/historie', label: 'Geschiedenis', icon: History },
    { to: '/weer', label: 'Weer', icon: Cloud },
    { to: '/profiel', label: 'Mijn Profiel', icon: User },
    { to: '/instellingen', label: 'Instellingen', icon: Settings },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition"
        aria-label="Menu"
      >
        <Menu className="w-4 h-4" strokeWidth={2} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-background border-l border-border z-[70] flex flex-col"
            >
              <div className="flex justify-end p-5">
                <button
                  onClick={() => setOpen(false)}
                  className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition"
                  aria-label="Sluiten"
                >
                  <X className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
              <nav className="px-5 space-y-2">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card border border-border hover:bg-accent transition"
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.75} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}