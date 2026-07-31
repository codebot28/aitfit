import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shirt, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileShell({ children }) {
  const location = useLocation();

  const navItems = [
    { to: '/', icon: Shirt, label: 'Kast' },
    { to: '/outfit-van-de-dag', icon: Sparkles, label: 'Outfit van de dag' },
  ];

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-background relative pb-28">
        <main className="pt-2">{children}</main>

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-5 pb-5 pt-2 z-50">
          <div className="bg-card/95 backdrop-blur-xl border border-border rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center justify-around px-2 py-2">
            {navItems.map((item) => {
              const active =
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300',
                    active
                      ? 'bg-primary text-[#000000]'
                      : 'text-[#5a5049] hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                  <span className="text-xs font-medium tracking-wide">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}