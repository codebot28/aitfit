import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, MessageSquare, RefreshCw, Check } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import MobileShell from '@/components/layout/MobileShell';
import OutfitResultaat from '@/components/outfit/OutfitResultaat';
import FeedbackForm from '@/components/outfit/FeedbackForm';
import WeerKaart from '@/components/outfit/WeerKaart';
import AgendaKaart from '@/components/outfit/AgendaKaart';
import RoosterKaart from '@/components/outfit/RoosterKaart';
import HamburgerMenu from '@/components/layout/HamburgerMenu';
import { useToast } from '@/components/ui/use-toast';
import { autoHoofdletter } from '@/lib/tekst-formatter';
import useBrowserLocatie from '@/hooks/useBrowserLocatie';

export default function OutfitVanDeDagPage() {
  const { toast } = useToast();
  const vandaag = new Date();
  const datumIso = format(vandaag, 'yyyy-MM-dd');
  const datumLabel = format(vandaag, 'EEEE d MMMM yyyy', { locale: nl });

  const [activiteit, setActiviteit] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [outfit, setOutfit] = useState(null);
  const [gekozenItems, setGekozenItems] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [feedbackOpgeslagen, setFeedbackOpgeslagen] = useState(false);
  const [isLoadingBestaand, setIsLoadingBestaand] = useState(true);

  // Laad bestaande outfit van vandaag bij eerste render
  useEffect(() => {
    (async () => {
      const bestaande = await base44.entities.Outfit.filter(
        { datum: datumIso },
        '-aangemaakt_op',
        1
      );
      const ofit = bestaande[0];
      if (ofit) {
        setOutfit(ofit);
        setActiviteit(ofit.activiteit_beschrijving || '');
        setResult({
          items: [],
          redenering: ofit.ai_redenering || ''
        });
        if (ofit.feedback_tekst || ofit.rating) setFeedbackOpgeslagen(true);

        const ids = (ofit.kledingstuk_ids || '').split(',').filter(Boolean);
        if (ids.length) {
          const items = await Promise.all(
            ids.map(async (id) => {
              const arr = await base44.entities.Kledingstuk.filter({ id });
              return arr[0];
            })
          );
          setGekozenItems(items.filter(Boolean));
        }
      }
      setIsLoadingBestaand(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { coords: browserCoords, status: locatieStatus } = useBrowserLocatie();
  const { data: weerData, isLoading: isWeerLoading } = useQuery({
    queryKey: ['weer', datumIso, browserCoords?.lat ?? null, browserCoords?.lon ?? null],
    enabled: locatieStatus !== 'pending',
    queryFn: async () => {
      const payload = browserCoords ? { lat: browserCoords.lat, lon: browserCoords.lon } : {};
      const res = await base44.functions.invoke('haalWeer', payload);
      if (res.data?.weer) return { weer: res.data.weer, error: null };
      return { weer: null, error: res.data?.error || 'Onbekende fout' };
    },
    staleTime: Infinity,
    gcTime: Infinity
  });
  const weer = weerData?.weer || null;
  const weerError = weerData?.error || null;

  const { data: agendaData, isLoading: isAgendaLoading } = useQuery({
    queryKey: ['agenda', datumIso],
    queryFn: async () => {
      const res = await base44.functions.invoke('haalAgendaVandaag', {});
      if (res.data?.afspraken) return { afspraken: res.data.afspraken, error: null };
      return { afspraken: [], error: res.data?.error || 'Agenda niet beschikbaar' };
    },
    staleTime: Infinity,
    gcTime: Infinity
  });
  const afspraken = agendaData?.afspraken || [];
  const agendaError = agendaData?.error || null;

  const { data: roosterData, isLoading: isRoosterLoading } = useQuery({
    queryKey: ['rooster', datumIso],
    queryFn: async () => {
      const res = await base44.functions.invoke('haalRoosterVandaag', {});
      if (res.data?.lessen) return { lessen: res.data.lessen, error: null };
      return { lessen: [], error: res.data?.error || 'Rooster niet beschikbaar' };
    },
    staleTime: Infinity,
    gcTime: Infinity
  });
  const lessen = roosterData?.lessen || [];
  const roosterError = roosterData?.error || null;

  const reset = () => {
    setResult(null);
    setOutfit(null);
    setGekozenItems([]);
    setShowFeedback(false);
    setFeedbackOpgeslagen(false);
  };

  const handleGenereer = async () => {
    setIsGenerating(true);
    reset();

    const res = await base44.functions.invoke('genereerOutfit', {
      datum: datumIso,
      activiteit: activiteit.trim(),
      weer,
      afspraken,
      lessen
    });

    if (res.data?.error) {
      toast({ title: 'Oeps', description: res.data.error });
      setIsGenerating(false);
      return;
    }

    setResult(res.data.result);
    setOutfit(res.data.outfit);

    const ids = res.data.gekozenIds || [];
    if (ids.length) {
      const items = await Promise.all(
        ids.map(async (id) => {
          const arr = await base44.entities.Kledingstuk.filter({ id });
          return arr[0];
        })
      );
      setGekozenItems(items.filter(Boolean));
    }
    setIsGenerating(false);
  };

  const handleSaveFeedback = async ({ feedback_tekst, rating }) => {
    if (!outfit) return;
    setIsSavingFeedback(true);
    const nu = new Date().toISOString();

    await base44.entities.Outfit.update(outfit.id, { feedback_tekst, rating });
    await base44.entities.Feedback.create({
      outfit_id: outfit.id,
      feedback_tekst,
      rating,
      aangemaakt_op: nu
    });

    // Genereer leermoment + eventueel nieuwe samenvatting (op achtergrond — niet blokkerend)
    base44.functions.invoke('verwerkFeedback', {
      outfit_id: outfit.id,
      feedback_tekst,
      rating
    }).catch(() => {});

    setIsSavingFeedback(false);
    setShowFeedback(false);
    setFeedbackOpgeslagen(true);
    toast({ title: 'Bedankt!', description: 'Je feedback is opgeslagen.' });
  };

  return (
    <MobileShell>
      <div className="px-5 pt-10 pb-6 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Vandaag</p>
          <h1 className="font-display text-3xl text-foreground mt-1.5 leading-tight">
            Outfit van de dag
          </h1>
        </div>
        <HamburgerMenu />
      </div>

      <div className="px-5 space-y-5">
        <div className="bg-card border border-border rounded-2xl px-4 py-3.5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Datum</p>
          <p className="text-sm font-medium text-foreground mt-0.5 capitalize">{datumLabel}</p>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">
            Wat ga je vandaag doen?
          </label>
          <textarea
            value={activiteit}
            onChange={(e) => setActiviteit(autoHoofdletter(e.target.value))}
            placeholder="Bijvoorbeeld: kantoordag met een lunchafspraak"
            rows={3}
            className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition resize-none" />
        </div>

        <AgendaKaart
          afspraken={afspraken}
          isLoading={isAgendaLoading}
          error={agendaError} />

        <RoosterKaart
          lessen={lessen}
          isLoading={isRoosterLoading}
          error={roosterError} />

        <WeerKaart weer={weer} isLoading={isWeerLoading} error={weerError} />

        {!result && !isLoadingBestaand &&
        <button
          onClick={handleGenereer}
          disabled={isGenerating}
          className="w-full bg-primary rounded-2xl py-4 font-medium flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 shadow-lg">
          
            {isGenerating ?
          <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Stylist denkt na…
              </> :

          <>
                <Sparkles className="w-4 h-4" strokeWidth={2} />
                Genereer outfit
              </>
          }
          </button>
        }

        {result &&
        <>
            <OutfitResultaat result={result} gekozenItems={gekozenItems} />

            {!showFeedback && !feedbackOpgeslagen &&
          <div className="grid grid-cols-2 gap-2">
                <button
              onClick={() => setShowFeedback(true)}
              className="bg-card border border-border text-foreground rounded-2xl py-3.5 text-sm font-medium flex items-center justify-center gap-2 hover:bg-accent transition">
              
                  <MessageSquare className="w-4 h-4" strokeWidth={1.75} />
                  Feedback geven
                </button>
                <button
              onClick={handleGenereer}
              disabled={isGenerating}
              className="bg-primary rounded-2xl py-3.5 text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50">
              
                  {isGenerating ?
              <Loader2 className="w-4 h-4 animate-spin" /> :

              <>
                      <RefreshCw className="w-4 h-4" strokeWidth={1.75} />
                      Nieuwe outfit
                    </>
              }
                </button>
              </div>
          }

            {showFeedback &&
          <FeedbackForm
            onSubmit={handleSaveFeedback}
            onCancel={() => setShowFeedback(false)}
            isSaving={isSavingFeedback}
            initialTekst={outfit?.feedback_tekst || ''}
            initialRating={outfit?.rating || 0} />

          }

            {feedbackOpgeslagen && !showFeedback &&
          <>
                <div className="bg-accent/50 border border-border rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Check className="w-4 h-4 text-foreground" strokeWidth={2} />
                  <p className="text-sm text-foreground">Feedback opgeslagen — bedankt!</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                onClick={() => setShowFeedback(true)}
                className="bg-primary rounded-2xl py-3.5 text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition">
                
                    <MessageSquare className="w-4 h-4" strokeWidth={1.75} />
                    Feedback aanpassen
                  </button>
                  <button
                onClick={handleGenereer}
                disabled={isGenerating}
                className="bg-card border border-border text-foreground rounded-2xl py-3.5 text-sm font-medium flex items-center justify-center gap-2 hover:bg-accent transition disabled:opacity-50">
                
                    {isGenerating ?
                <Loader2 className="w-4 h-4 animate-spin" /> :

                <>
                        <RefreshCw className="w-4 h-4" strokeWidth={1.75} />
                        Nieuwe outfit
                      </>
                }
                  </button>
                </div>
              </>
          }
          </>
        }
      </div>
    </MobileShell>);

}