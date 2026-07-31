import React from 'react';

const labels = {
  kleur: 'Kleur',
  type: 'Type',
  mouwen: 'Mouwen',
  dikte: 'Dikte',
  seizoen: 'Seizoen',
  formeel_niveau: 'Stijl',
  categorie: 'Categorie',
};

function formatValue(value) {
  if (Array.isArray(value)) return value.join(', ');
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

export default function ProfielView({ profiel }) {
  if (!profiel || Object.keys(profiel).length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">Geen profiel beschikbaar.</p>
    );
  }

  const entries = Object.entries(labels)
    .map(([key, label]) => [label, profiel[key]])
    .filter(([, value]) => value !== undefined);

  return (
    <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
      {entries.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-sm font-medium text-foreground capitalize text-right">
            {formatValue(value)}
          </span>
        </div>
      ))}
    </div>
  );
}