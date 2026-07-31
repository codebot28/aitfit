import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

function formatTijd(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function VoiceRecorder({ onTranscript, onError }) {
  const [status, setStatus] = useState('idle'); // idle | recording | transcribing
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startOpname = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        setStatus('transcribing');

        try {
          const ext = (mr.mimeType || 'audio/webm').includes('mp4') ? 'm4a' : 'webm';
          const file = new File([blob], `opname.${ext}`, { type: blob.type });
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          const result = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
          const tekst = typeof result === 'string' ? result : (result?.transcript || result?.text || '');
          if (tekst) onTranscript(tekst.trim());
          else onError?.('Geen tekst herkend');
        } catch (err) {
          onError?.(err.message || 'Transcriptie mislukt');
        }
        setStatus('idle');
        setSeconds(0);
      };

      mediaRecorderRef.current = mr;
      mr.start();
      setStatus('recording');
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      onError?.('Geen toegang tot microfoon');
    }
  };

  const stopOpname = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  if (status === 'transcribing') {
    return (
      <button
        disabled
        className="shrink-0 w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center"
      >
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </button>
    );
  }

  if (status === 'recording') {
    return (
      <button
        onClick={stopOpname}
        className="shrink-0 h-12 px-4 rounded-2xl bg-red-500 text-white flex items-center gap-2 hover:bg-red-600 transition"
      >
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span className="text-xs font-medium tabular-nums">{formatTijd(seconds)}</span>
        <Square className="w-3.5 h-3.5 fill-white" strokeWidth={0} />
      </button>
    );
  }

  return (
    <button
      onClick={startOpname}
      className={cn(
        'shrink-0 w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center hover:bg-accent transition'
      )}
      aria-label="Spreek je activiteit in"
    >
      <Mic className="w-4 h-4 text-foreground" strokeWidth={1.75} />
    </button>
  );
}