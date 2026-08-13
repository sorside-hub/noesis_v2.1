import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Key,
  Globe,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  Lock
} from 'lucide-react';
import { syncEngine } from '../../../core/sync/syncEngine';

interface SupabaseConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigDrawer: React.FC<SupabaseConfigDrawerProps> = ({ isOpen, onClose }) => {
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>('');
  const [showAnonKey, setShowAnonKey] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // Load saved config on mount or open
  useEffect(() => {
    if (isOpen) {
      try {
        const savedUrl = localStorage.getItem('noesis_supabase_url') || '';
        const savedKey = localStorage.getItem('noesis_supabase_anon_key') || '';
        setSupabaseUrl(savedUrl);
        setSupabaseAnonKey(savedKey);
        setIsConnected(Boolean(savedUrl.trim() && savedKey.trim()));
      } catch (e) {
        console.error('Error reading Supabase keys:', e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      const url = supabaseUrl.trim();
      const key = supabaseAnonKey.trim();
      localStorage.setItem('noesis_supabase_url', url);
      localStorage.setItem('noesis_supabase_anon_key', key);
      setIsConnected(Boolean(url && key));

      if (url && key) {
        // Trigger initial sync in the background
        setTimeout(() => {
          syncEngine.triggerSync({ forceFullSync: true }).then((res) => {
            console.log('[SupabaseConfigDrawer] Background sync triggered successfully:', res);
          }).catch((err) => {
            console.error('[SupabaseConfigDrawer] Background sync failed:', err);
          });
        }, 300);
      }

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onClose();
      }, 1200);
    } catch (e) {
      console.error('Failed to save Supabase config:', e);
    }
  };

  const handleReset = () => {
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    try {
      localStorage.removeItem('noesis_supabase_url');
      localStorage.removeItem('noesis_supabase_anon_key');
      setIsConnected(false);
    } catch (e) {
      console.error('Failed to reset Supabase config:', e);
    }
  };

  const hasAnyInput = supabaseUrl.trim() !== '' || supabaseAnonKey.trim() !== '';

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md h-full bg-[#131313] border-l border-[#2A2A2A] flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-250 text-[#E5E5E5]">
        
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#2A2A2A] bg-[#1C1C1C] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#242424] border border-[#333333] flex items-center justify-center text-[#E5E5E5]">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#E5E5E5] tracking-tight">
                Konfigurasi Supabase
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#242424] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Input Fields */}
          <div className="space-y-4 p-3.5 rounded-xl bg-[#181818] border border-[#262626]">
            
            {/* Supabase URL */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#A3A3A3] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#A3A3A3]" />
                Supabase Project URL
              </label>
              <input
                type="url"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full bg-[#131313] border border-[#2D2D2D] focus:border-[#444444] rounded-lg px-3 py-2 text-xs text-[#E5E5E5] placeholder-[#555555] outline-hidden transition-colors font-mono"
              />
            </div>

            {/* Supabase Anon Key */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#A3A3A3] flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#A3A3A3]" />
                Supabase Anon / Public Key
              </label>
              <div className="relative flex items-center">
                <input
                  type={showAnonKey ? 'text' : 'password'}
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  className="w-full bg-[#131313] border border-[#2D2D2D] focus:border-[#444444] rounded-lg px-3 py-2 pr-9 text-xs text-[#E5E5E5] placeholder-[#555555] outline-hidden transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowAnonKey(!showAnonKey)}
                  className="absolute right-2.5 text-[#8E8E93] hover:text-[#E5E5E5] transition-colors cursor-pointer"
                >
                  {showAnonKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] text-[11px] text-[#A3A3A3]">
            <Lock className="w-3.5 h-3.5 text-[#A3A3A3] shrink-0 mt-0.5" />
            <span>
              Data konfigurasi ini disimpan secara aman di penyimpanan lokal peramban Anda (localStorage) untuk menghubungkan Noesis ke database Supabase.
            </span>
          </div>

        </div>

        {/* Success Toast Banner */}
        {showToast && (
          <div className="px-4 py-2 bg-[#10B981]/20 border-t border-[#10B981]/30 text-[#34D399] text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Konfigurasi Supabase Berhasil Disimpan!</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#2A2A2A] bg-[#1C1C1C] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasAnyInput}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#242424] hover:bg-[#2C2C2C] border border-[#303030] text-xs text-[#A3A3A3] hover:text-[#E5E5E5] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            title="Reset konfigurasi Supabase lokal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-[#242424] hover:bg-[#2C2C2C] border border-[#303030] text-xs font-semibold text-[#E5E5E5] transition-all cursor-pointer active:scale-95"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-[#E5E5E5] hover:bg-white text-[#111111] text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Konfigurasi</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

