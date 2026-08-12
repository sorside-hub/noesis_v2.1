import React, { useState, useEffect } from 'react';
import {
  Sliders,
  X,
  Sparkles,
  Database,
  Power,
  Check,
  Search,
  Filter,
  Layers,
  Tag,
  Folder,
  Info,
  RotateCcw,
} from 'lucide-react';
import { AISettings, RAGMode, RetrievalMethod } from '../../../shared/types';
import { getNotes } from '../../vault/services/noteService';

interface ChatSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: AISettings;
  onSaveSettings?: (settings: AISettings) => void;
}

const SEARCH_METHODS: {
  id: RetrievalMethod;
  label: string;
  badge: string;
  desc: string;
}[] = [
  {
    id: 'hybrid',
    label: 'Hybrid RRF',
    badge: 'RRF Fusion',
    desc: 'Gabungan Vector + BM25',
  },
  {
    id: 'vector',
    label: 'Vector Only',
    badge: 'Cosine Sim',
    desc: 'Embedding semantik',
  },
  {
    id: 'bm25',
    label: 'BM25 Only',
    badge: 'Keyword',
    desc: 'Pencarian kata kunci',
  },
];

const CATEGORY_LIST = [
  { id: 'world', label: 'World', emoji: '🌍' },
  { id: 'self', label: 'Self', emoji: '🪞' },
  { id: 'ideas', label: 'Ideas', emoji: '💡' },
];

export const ChatSettingsDrawer: React.FC<ChatSettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState<string>('');
  const [showModeInfo, setShowModeInfo] = useState<boolean>(false);
  const [activeSearchMethodInfo, setActiveSearchMethodInfo] = useState<RetrievalMethod | null>(null);

  // Local draft state initialized with current settings
  const [draftSettings, setDraftSettings] = useState<AISettings>(() => ({
    model: 'gemini-3.6-flash',
    memoryEnabled: true,
    ragEnabled: true,
    ragMode: 'on',
    useAutoConfig: true,
    searchMethod: 'hybrid',
    topKChunks: 5,
    similarityThreshold: 0,
    categoryFilter: 'all',
    typeFilter: 'all',
    tagFilter: 'all',
    contextSources: ['vault', 'workspace'],
    customInstructions: 'Jawab dengan bahasa Indonesia yang jelas, ringkas, dan terstruktur dengan rapi.',
    ...settings,
  }));

  // Sync draft whenever drawer opens or settings prop changes
  useEffect(() => {
    if (isOpen && settings) {
      setDraftSettings({ ...settings });
    }
  }, [isOpen, settings]);

  useEffect(() => {
    if (isOpen) {
      getNotes().then((notes) => {
        const tagSet = new Set<string>();
        notes.forEach((note) => {
          note.tags?.forEach((t) => {
            if (t && t.trim()) {
              tagSet.add(t.trim().replace(/^#/, '').toLowerCase());
            }
          });
          const contentTags = note.content ? note.content.match(/#[\w\-]+/g) || [] : [];
          contentTags.forEach((t) => {
            const clean = t.replace(/^#/, '').trim().toLowerCase();
            if (clean) tagSet.add(clean);
          });
        });
        setAvailableTags(Array.from(tagSet));
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSearchMethod: RetrievalMethod = draftSettings.searchMethod || 'hybrid';
  const currentTopK: number = draftSettings.topKChunks || 5;
  const currentThreshold: number = draftSettings.similarityThreshold ?? 0;

  const getSelectedCategories = (filter?: string | string[]): string[] => {
    if (!filter) return [];
    if (Array.isArray(filter)) {
      return filter.filter((c) => c && c !== 'all');
    }
    if (filter === 'all') return [];
    return filter.split(',').map((s) => s.trim()).filter((s) => s && s !== 'all');
  };

  const getSelectedTags = (filter?: string | string[]): string[] => {
    if (!filter) return [];
    if (Array.isArray(filter)) {
      return filter
        .map((t) => t.replace(/^#/, '').trim().toLowerCase())
        .filter((t) => t && t !== 'all');
    }
    if (filter === 'all') return [];
    return filter
      .split(',')
      .map((t) => t.replace(/^#/, '').trim().toLowerCase())
      .filter((t) => t && t !== 'all');
  };

  const selectedCategories = getSelectedCategories(draftSettings.categoryFilter);
  const selectedTags = getSelectedTags(draftSettings.tagFilter);

  const updateDraft = (partial: Partial<AISettings>) => {
    const updated = { ...draftSettings, ...partial };
    setDraftSettings(updated);
    if (onSaveSettings) {
      setTimeout(() => {
        onSaveSettings(updated);
      }, 0);
    }
  };

  const handleSelectMode = (mode: RAGMode) => {
    updateDraft({ ragMode: mode });
  };

  const toggleCategory = (catId: string) => {
    if (catId === 'all') {
      updateDraft({ categoryFilter: 'all' });
      return;
    }
    let updated: string[];
    if (selectedCategories.includes(catId)) {
      updated = selectedCategories.filter((c) => c !== catId);
    } else {
      updated = [...selectedCategories, catId];
    }
    if (updated.length === 0) {
      updateDraft({ categoryFilter: 'all' });
    } else {
      updateDraft({ categoryFilter: updated });
    }
  };

  const toggleTag = (tagStr: string) => {
    const clean = tagStr.replace(/^#/, '').trim().toLowerCase();
    if (clean === 'all') {
      updateDraft({ tagFilter: 'all' });
      return;
    }
    let updated: string[];
    if (selectedTags.includes(clean)) {
      updated = selectedTags.filter((t) => t !== clean);
    } else {
      updated = [...selectedTags, clean];
    }
    if (updated.length === 0) {
      updateDraft({ tagFilter: 'all' });
    } else {
      updateDraft({ tagFilter: updated });
    }
  };

  const handleApplySettings = () => {
    if (onSaveSettings) {
      onSaveSettings(draftSettings);
    }
    onClose();
  };

  const filteredTags = availableTags.filter((t) =>
    t.toLowerCase().includes(tagSearchQuery.toLowerCase().trim())
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Panel (Slide from Right) */}
      <div className="relative w-5/6 max-w-sm h-full bg-[#131313] border-l border-[#303030] flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#303030] bg-[#1C1C1C]/50 shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-neutral-400" />
            <span className="font-semibold text-sm text-[#E5E5E5]">
              Chat Settings
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#1C1C1C] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Section: RAG Mode */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#E5E5E5] uppercase tracking-wider">
                RAG Engine (Vault Access)
              </h3>
              <button
                type="button"
                onClick={() => updateDraft({ ragMode: draftSettings.ragMode === 'on' ? 'off' : 'on' })}
                className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                  draftSettings.ragMode === 'on' ? 'bg-neutral-500' : 'bg-neutral-800'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  draftSettings.ragMode === 'on' ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {draftSettings.ragMode === 'on' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3 bg-[#181818] border border-[#2A2A2A] rounded-xl text-xs text-[#A3A3A3] leading-relaxed">
                  ⚡ <strong className="text-[#E5E5E5]">Smart Intent Detection:</strong> AI akan otomatis mendeteksi apakah pertanyaan membutuhkan Vault. Jika membutuhkan Vault, pencarian akan menggunakan konfigurasi di bawah ini.
                </div>

                <div className="pt-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-neutral-400" />
                      <h3 className="text-xs font-bold text-[#E5E5E5] uppercase tracking-wider">
                        Konfigurasi RAG
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateDraft({
                          searchMethod: 'hybrid',
                          topKChunks: 5,
                          similarityThreshold: 0,
                          categoryFilter: 'all',
                          typeFilter: 'all',
                          tagFilter: 'all',
                        });
                      }}
                      className="px-2.5 py-1 bg-[#222222] hover:bg-[#2A2A2A] text-[#A3A3A3] hover:text-[#E5E5E5] border border-[#333333] text-[10px] font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Reset konfigurasi ke default"
                    >
                      <RotateCcw className="w-3 h-3 text-[#8E8E93]" />
                      <span>Reset</span>
                    </button>
                  </div>

              {/* 1. Search Method */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#D4D4D4] flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-neutral-400" />
                    Search Method
                  </label>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {SEARCH_METHODS.map((method) => {
                    const isSelected = currentSearchMethod === method.id;
                    return (
                      <div
                        key={method.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => updateDraft({ searchMethod: method.id })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            updateDraft({ searchMethod: method.id });
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-neutral-500 bg-neutral-800 text-[#E5E5E5]'
                            : 'border-[#2A2A2A] bg-[#181818] text-[#A3A3A3] hover:border-[#3A3A3A]'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold">{method.label}</div>
                          <div className="text-[10px] text-[#8E8E93]">{method.desc}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-medium px-2 py-0.5 rounded border border-[#333] bg-[#222] text-[#A3A3A3]">
                            {method.badge}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSearchMethodInfo(activeSearchMethodInfo === method.id ? null : method.id);
                            }}
                            className={`p-1 rounded-md transition-colors cursor-pointer ${
                              activeSearchMethodInfo === method.id
                                ? 'text-neutral-300 bg-neutral-800'
                                : 'text-neutral-300/70 hover:text-neutral-300 hover:bg-neutral-700'
                            }`}
                            title={`Info ${method.label}`}
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Search Method Info Popup Card */}
                {activeSearchMethodInfo && (
                  <div className="p-3 bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl space-y-2 text-xs animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[#E5E5E5] font-semibold text-[11px] border-b border-[#2A2A2A] pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-neutral-300" />
                        Detail: {SEARCH_METHODS.find(m => m.id === activeSearchMethodInfo)?.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveSearchMethodInfo(null)}
                        className="text-[#8E8E93] hover:text-white p-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[11px] text-[#A3A3A3] leading-relaxed">
                      {activeSearchMethodInfo === 'hybrid' && (
                        "Metode pencarian tercanggih yang menggabungkan kekuatan pencarian semantik (Vector) dan kecocokan kata kunci (BM25) menggunakan algoritma RRF (Reciprocal Rank Fusion). Sangat efektif menemukan catatan yang relevan secara konseptual sekaligus presisi secara istilah khusus."
                      )}
                      {activeSearchMethodInfo === 'vector' && (
                        "Menggunakan representasi matematika (embeddings) dari teks catatan Anda untuk mencari kecocokan konsep dan makna kognitif. Sangat baik untuk menemukan catatan yang relevan secara makna meskipun menggunakan kata-kata yang berbeda."
                      )}
                      {activeSearchMethodInfo === 'bm25' && (
                        "Metode pencarian berbasis kata kunci tradisional yang menghitung statistik frekuensi istilah. Sangat cepat dan akurat untuk mencari kode khusus, nama orang, tanggal, atau istilah teknis spesifik yang Anda ingat."
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* 2. Top K Chunks */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#D4D4D4] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-neutral-400" />
                    Top K Chunks
                  </label>
                  <span className="text-[10px] font-normal text-[#8E8E93]">
                    {currentTopK} Contexts
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={15}
                  step={1}
                  value={currentTopK}
                  onChange={(e) => updateDraft({ topKChunks: parseInt(e.target.value, 10) })}
                  className="w-full accent-neutral-400 cursor-pointer bg-[#262626] h-1.5 rounded-lg"
                />
                <p className="text-[10px] text-[#8E8E93]">
                  jumlah context yang diambil retrieval
                </p>
              </div>

              {/* 3. Similarity Threshold */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#D4D4D4] flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-neutral-400" />
                    Similarity Threshold
                  </label>
                  <span className="text-[10px] font-normal text-[#8E8E93]">
                    {currentThreshold === 0
                      ? '0.0 (Tanpa Batas)'
                      : currentThreshold.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.8}
                  step={0.05}
                  value={currentThreshold}
                  onChange={(e) => updateDraft({ similarityThreshold: parseFloat(e.target.value) })}
                  className="w-full accent-neutral-400 cursor-pointer bg-[#262626] h-1.5 rounded-lg"
                />
                <p className="text-[10px] text-[#8E8E93]">
                  batas minimal hasil retrieval
                </p>
              </div>

              {/* 4. Category Filter (Multi-Select) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#D4D4D4] flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-neutral-400" />
                    Category Filter
                  </label>
                  <span className="text-[10px] text-[#8E8E93]">
                    {selectedCategories.length === 0
                      ? 'Semua Kategori'
                      : `${selectedCategories.length} Kategori`}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {/* Option: All Categories */}
                  <button
                    type="button"
                    onClick={() => toggleCategory('all')}
                    className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between border transition-all cursor-pointer ${
                      selectedCategories.length === 0
                        ? 'bg-neutral-800 border-neutral-500 text-neutral-300 font-semibold'
                        : 'bg-[#181818] border-[#2A2A2A] text-[#A3A3A3] hover:border-[#3A3A3A] hover:text-[#E5E5E5]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">📁</span>
                      <span>All</span>
                    </span>
                    {selectedCategories.length === 0 && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {/* Individual Categories */}
                  <div className="grid grid-cols-1 gap-1.5">
                    {CATEGORY_LIST.map((cat) => {
                      const isSelected = selectedCategories.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-neutral-800 border-neutral-500 text-neutral-300 font-semibold'
                              : 'bg-[#181818] border-[#2A2A2A] text-[#D4D4D4] hover:border-[#3A3A3A] hover:bg-[#1E1E1E]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-sm">{cat.emoji}</span>
                            <span>{cat.label}</span>
                          </span>
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-neutral-600 border-neutral-500 text-white'
                                : 'border-[#444] bg-[#222]'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p className="text-[10px] text-[#8E8E93]">
                  pilih satu atau beberapa kategori note
                </p>
              </div>

              {/* 5. Tag Filter (Multi-Select with Search) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#D4D4D4] flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-neutral-400" />
                    Tag Filter
                  </label>
                  <span className="text-[10px] text-[#8E8E93]">
                    {selectedTags.length === 0 ? 'Semua Tag' : `${selectedTags.length} Tag`}
                  </span>
                </div>

                {/* Selected Tag Chips */}
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#181818] border border-neutral-700 rounded-xl">
                    <span className="text-[10px] font-medium text-[#A3A3A3] mr-1">
                      Terpilih:
                    </span>
                    {selectedTags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-300 bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded-lg"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => toggleTag(t)}
                          className="hover:text-white cursor-pointer ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => updateDraft({ tagFilter: 'all' })}
                      className="text-[10px] text-[#A3A3A3] hover:text-[#E5E5E5] underline ml-auto self-center cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                )}

                {/* Tag Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={tagSearchQuery}
                    onChange={(e) => setTagSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    placeholder="Cari tag..."
                    className="w-full bg-[#181818] border border-[#2A2A2A] focus:border-neutral-500 text-xs text-[#E5E5E5] rounded-xl pl-8 pr-8 py-2 focus:outline-none transition-colors placeholder-[#666]"
                  />
                  {tagSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setTagSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#E5E5E5] p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Tag Selection List */}
                <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                  {/* All Tags Option */}
                  <button
                    type="button"
                    onClick={() => toggleTag('all')}
                    className={`w-full px-3 py-1.5 rounded-xl text-xs flex items-center justify-between border transition-all cursor-pointer ${
                      selectedTags.length === 0
                        ? 'bg-neutral-800 border-neutral-500 text-neutral-300 font-semibold'
                        : 'bg-[#181818] border-[#2A2A2A] text-[#A3A3A3] hover:border-[#3A3A3A] hover:text-[#E5E5E5]'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      Semua Tag (All)
                    </span>
                    {selectedTags.length === 0 && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {/* Filtered Tags */}
                  {filteredTags.length === 0 ? (
                    <p className="text-[11px] text-[#666] text-center py-3 italic">
                      {availableTags.length === 0
                        ? 'Belum ada tag di Vault'
                        : `Tidak ada tag cocok "${tagSearchQuery}"`}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {filteredTags.slice(0, 12).map((t) => {
                        const isSelected = selectedTags.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTag(t)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-neutral-800 border-neutral-500 text-neutral-300 font-semibold'
                                : 'bg-[#181818] border-[#2A2A2A] text-[#D4D4D4] hover:border-[#3A3A3A] hover:text-white'
                            }`}
                          >
                            <span>#{t}</span>
                            <div
                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'bg-neutral-600 border-neutral-500 text-white'
                                  : 'border-[#444] bg-[#222]'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                      {filteredTags.length > 12 && (
                        <p className="w-full text-[9px] text-[#737373] mt-1 italic">
                          *Menampilkan 12 tag teratas. Gunakan pencarian untuk tag lainnya.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-[#8E8E93]">
                  pilih satu atau beberapa tag
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Bottom Action Footer with Auto-Save Indicator and Close Button */}
    <div className="p-4 border-t border-[#303030] bg-[#1C1C1C] shrink-0 flex items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
        <Check className="w-3.5 h-3.5" />
        <span>Tersimpan otomatis</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="py-2 px-4 rounded-xl bg-[#2A2A2A] hover:bg-[#333333] text-white font-medium text-xs border border-[#3A3A3A] transition-colors cursor-pointer"
      >
        Tutup
      </button>
    </div>
  </div>
</div>
);
};
