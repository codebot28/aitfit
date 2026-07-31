import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Trash2, Loader2, Pencil, X } from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import ProfielView from '@/components/kast/ProfielView';
import OpmerkingEditor from '@/components/kast/OpmerkingEditor';
import KleurBolletjes from '@/components/kast/KleurBolletjes';
import GeenFotoPlaceholder from '@/components/kast/GeenFotoPlaceholder';
import DetailBewerken from '@/components/kast/DetailBewerken';
import { leesVarianten } from '@/lib/varianten';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const dikteLabel = {
  dun: 'Dun',
  normaal: 'Normaal',
  dik: 'Dik',
};

export default function KledingstukDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [bewerken, setBewerken] = useState(false);
  const [actief, setActief] = useState(0);

  const { data: item, isLoading } = useQuery({
    queryKey: ['kledingstuk', id],
    queryFn: async () => {
      const all = await base44.entities.Kledingstuk.filter({ id });
      return all[0] || null;
    },
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    await base44.entities.Kledingstuk.delete(id);
    queryClient.invalidateQueries({ queryKey: ['kledingstukken'] });
    navigate('/');
  };

  let profiel = {};
  if (item?.profiel) {
    try {
      profiel = JSON.parse(item.profiel);
    } catch {
      profiel = {};
    }
  }
  // Profiel zonder varianten tonen
  const { varianten: _v, ...profielZonderVarianten } = profiel;

  const varianten = item ? leesVarianten(item) : [];
  const variant = varianten[actief] || varianten[0];

  return (
    <MobileShell>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <Link
          to="/"
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        </Link>
        {item && !bewerken && (
          <button
            onClick={() => setBewerken(true)}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition"
            aria-label="Bewerken"
          >
            <Pencil className="w-4 h-4" strokeWidth={2} />
          </button>
        )}
        {item && bewerken && (
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive transition">
                  <Trash2 className="w-4 h-4" strokeWidth={2} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Kledingstuk verwijderen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Deze actie kan niet ongedaan gemaakt worden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verwijderen'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <button
              onClick={() => setBewerken(false)}
              className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition"
              aria-label="Sluiten"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="px-5 space-y-4">
          <div className="aspect-[4/5] rounded-3xl bg-muted animate-pulse" />
          <div className="h-6 bg-muted rounded animate-pulse w-2/3" />
        </div>
      ) : !item ? (
        <div className="px-5 mt-10 text-center">
          <p className="font-display text-xl text-foreground">Niet gevonden</p>
          <p className="text-sm text-muted-foreground mt-1">Dit kledingstuk bestaat niet meer.</p>
        </div>
      ) : (
        <div className="px-5 space-y-6 pb-6">
          <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-muted">
            {variant?.foto_url ? (
              <img src={variant.foto_url} alt={item.beschrijving} className="w-full h-full object-cover" />
            ) : (
              <GeenFotoPlaceholder />
            )}
          </div>

          {varianten.length > 1 && (
            <div className="flex items-center justify-center">
              <KleurBolletjes
                varianten={varianten}
                actieveIndex={actief}
                onSelect={setActief}
                size="md"
              />
            </div>
          )}

          {bewerken ? (
            <DetailBewerken item={item} onKlaar={() => setBewerken(false)} />
          ) : (
            <>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Beschrijving</p>
                <h1 className="font-display text-2xl text-foreground mt-1.5 leading-snug">
                  {item.beschrijving}
                </h1>
                {variant?.code && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Code: <span className="text-foreground font-medium font-mono">{variant.code}</span>
                  </p>
                )}
                {item.dikte && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Dikte: <span className="text-foreground font-medium">{dikteLabel[item.dikte] || item.dikte}</span>
                  </p>
                )}
              </div>

              <OpmerkingEditor item={item} />

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Profiel</p>
                <ProfielView profiel={profielZonderVarianten} />
              </div>
            </>
          )}
        </div>
      )}
    </MobileShell>
  );
}