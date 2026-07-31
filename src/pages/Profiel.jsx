import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import ProfielTab from '@/components/kast/ProfielTab';

export default function ProfielPage() {
  return (
    <MobileShell>
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <Link
          to="/"
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        </Link>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Stijl</p>
          <h1 className="font-display text-2xl text-foreground leading-tight">Mijn Profiel</h1>
        </div>
      </div>

      <div className="px-5">
        <ProfielTab />
      </div>
    </MobileShell>
  );
}