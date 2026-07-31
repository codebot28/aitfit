import React, { useRef } from 'react';
import { Camera, ImagePlus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FotoUploader({ fotoUrl, onSelectFile, isUploading }) {
  const inputRef = useRef(null);
  const cameraRef = useRef(null);

  if (fotoUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden bg-muted">
        
        <img src={fotoUrl} alt="Kledingstuk" className="w-full h-full object-cover" />
        <button
          onClick={() => inputRef.current?.click()}
          className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-md text-foreground text-xs font-medium px-4 py-2 rounded-full shadow-lg hover:bg-card transition">
          
          Vervangen
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onSelectFile(e.target.files[0])} />
        
      </motion.div>);

  }

  return (
    <div className="space-y-3">
      <div className="aspect-[4/5] w-full rounded-3xl border-2 border-dashed border-border bg-card/50 flex flex-col items-center justify-center gap-4 p-8">
        {isUploading ?
        <>
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">Foto wordt geüpload…</p>
          </> :

        <>
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
              <ImagePlus className="w-7 h-7 text-accent-foreground" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="font-display text-xl text-foreground">Voeg een foto toe</p>
              <p className="text-sm text-muted-foreground mt-1">Maak of upload een foto van je kledingstuk</p>
            </div>
          </>
        }
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => cameraRef.current?.click()}
          disabled={isUploading}
          className="flex items-center justify-center gap-2 bg-primary rounded-2xl py-4 font-medium hover:opacity-90 transition disabled:opacity-50">
          
          <Camera className="w-4 h-4" strokeWidth={2} />
          Camera
        </button>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center justify-center gap-2 bg-card border border-border text-foreground rounded-2xl py-4 font-medium hover:bg-accent transition disabled:opacity-50">
          
          <ImagePlus className="w-4 h-4" strokeWidth={2} />
          Galerij
        </button>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onSelectFile(e.target.files[0])} />
      
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onSelectFile(e.target.files[0])} />
      
    </div>);

}