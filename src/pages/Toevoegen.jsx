import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MobileShell from '@/components/layout/MobileShell';
import FotoUploader from '@/components/toevoegen/FotoUploader';
import DikteSelector from '@/components/toevoegen/DikteSelector';
import ExtraKleurenEditor from '@/components/kast/ExtraKleurenEditor';
import { useToast } from '@/components/ui/use-toast';
import { autoHoofdletter } from '@/lib/tekst-formatter';

export default function ToevoegenPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fotoUrl, setFotoUrl] = useState('');
  const [beschrijving, setBeschrijving] = useState('');
  const [dikte, setDikte] = useState('normaal');
  const [aiMeta, setAiMeta] = useState({ type: '', hoofdkleur: '', lengte: null });
  const [extraVarianten, setExtraVarianten] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDescribing, setIsDescribing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectFile = async (file) => {
    setIsUploading(true);
    setBeschrijving('');
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFotoUrl(file_url);
    setIsUploading(false);

    setIsDescribing(true);
    const res = await base44.functions.invoke('beschrijfKledingstuk', { foto_url: file_url });
    setBeschrijving(res.data?.beschrijving || '');
    setAiMeta({
      type: res.data?.type || '',
      hoofdkleur: res.data?.hoofdkleur || '',
      lengte: res.data?.lengte || null,
    });
    setIsDescribing(false);
  };

  const handleSave = async () => {
    if (!fotoUrl || !beschrijving || !dikte) {
      toast({ title: 'Vul alles in', description: 'Foto, beschrijving en dikte zijn verplicht.' });
      return;
    }
    setIsSaving(true);
    const res = await base44.functions.invoke('genereerProfiel', { beschrijving, dikte });
    const profiel = res.data?.profiel;

    const codeRes = await base44.functions.invoke('genereerCode', {
      beschrijving,
      type: aiMeta.type,
      hoofdkleur: aiMeta.hoofdkleur,
      lengte: aiMeta.lengte,
    });
    const code = codeRes.data?.code || '';

    // Bouw varianten: hoofdvariant + extras (elk een eigen code)
    const varianten = [{ kleur: aiMeta.hoofdkleur || null, code, foto_url: fotoUrl }];
    for (const ev of extraVarianten) {
      const evCodeRes = await base44.functions.invoke('genereerCode', {
        type: aiMeta.type,
        hoofdkleur: ev.kleur,
        lengte: aiMeta.lengte,
      });
      varianten.push({
        kleur: ev.kleur,
        code: evCodeRes.data?.code || '',
        foto_url: ev.foto_url || '',
      });
    }

    const profielMetVarianten = { ...(profiel || {}), varianten };

    await base44.entities.Kledingstuk.create({
      foto_url: fotoUrl,
      beschrijving,
      dikte,
      code,
      profiel: JSON.stringify(profielMetVarianten),
      aangemaakt_op: new Date().toISOString(),
    });
    setIsSaving(false);
    toast({ title: 'Opgeslagen', description: 'Je kledingstuk is toegevoegd.' });
    navigate('/');
  };

  const canSave = fotoUrl && beschrijving && dikte && !isDescribing && !isUploading;

  return (
    <MobileShell>
      <div className="px-5 pt-8 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Nieuw item</p>
        <h1 className="font-display text-3xl text-foreground mt-1.5 leading-tight">
          Voeg een kledingstuk toe
        </h1>
      </div>

      <div className="px-5 space-y-6">
        <FotoUploader fotoUrl={fotoUrl} onSelectFile={handleSelectFile} isUploading={isUploading} />

        <AnimatePresence>
          {(fotoUrl || isDescribing) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Beschrijving
                </label>
                {isDescribing && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    AI denkt na…
                  </span>
                )}
              </div>
              <textarea
                value={beschrijving}
                onChange={(e) => setBeschrijving(autoHoofdletter(e.target.value))}
                disabled={isDescribing}
                placeholder={isDescribing ? 'AI beschrijft je kledingstuk…' : 'Beschrijving van het kledingstuk'}
                rows={2}
                className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition resize-none font-display text-lg leading-snug"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {fotoUrl && <DikteSelector value={dikte} onChange={setDikte} />}

        {fotoUrl && !isDescribing && aiMeta.hoofdkleur && (
          <ExtraKleurenEditor
            extraVarianten={extraVarianten}
            onChange={setExtraVarianten}
            gebruikteKleuren={[aiMeta.hoofdkleur, ...extraVarianten.map((v) => v.kleur)]}
          />
        )}
      </div>

      <AnimatePresence>
        {fotoUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-5 mt-8"
          >
            <button
              onClick={handleSave}
              disabled={!canSave || isSaving}
              className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-medium flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Profiel genereren…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" strokeWidth={2} />
                  Profiel genereren & opslaan
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-muted-foreground mt-3">
              Claude AI analyseert je kledingstuk en bouwt een slim profiel
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileShell>
  );
}