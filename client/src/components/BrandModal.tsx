import React from 'react';
import { X, Check } from 'lucide-react';
import { DartLogo, LOGO_CONCEPTS, LogoConcept } from './DartLogos.js';

interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeConcept: LogoConcept;
  onSelectConcept: (concept: LogoConcept) => void;
}

export const BrandModal: React.FC<BrandModalProps> = ({
  isOpen,
  onClose,
  activeConcept,
  onSelectConcept,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-100 flex items-center gap-2.5">
              <DartLogo concept={activeConcept} size={22} />
              <span>Dart — Brand Identity &amp; Logo Concepts</span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              5 distinct arrow-driven brand marks. Select any concept to apply it across the app.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 transition-colors p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logo Concepts List */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LOGO_CONCEPTS.map((concept) => {
              const isSelected = activeConcept === concept.id;

              return (
                <div
                  key={concept.id}
                  onClick={() => onSelectConcept(concept.id)}
                  className={`relative p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-950/30'
                      : 'border-stone-800 bg-stone-800/40 hover:border-stone-700 hover:bg-stone-800/70'
                  }`}
                >
                  <div>
                    {/* Visual Icon Display */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center p-3">
                        <DartLogo concept={concept.id} size={36} />
                      </div>

                      {isSelected ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                          <Check className="w-4 h-4" />
                          <span>Active Logo</span>
                        </div>
                      ) : (
                        <span className="text-xs text-stone-500 hover:text-stone-300">
                          Click to select
                        </span>
                      )}
                    </div>

                    {/* Concept details */}
                    <div className="text-sm font-semibold text-stone-100">{concept.name}</div>
                    <div className="text-xs text-emerald-400 font-medium mt-0.5">{concept.tagline}</div>
                    <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                      {concept.description}
                    </p>
                  </div>

                  {/* Micro comparison bar */}
                  <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-500">
                    <div className="flex items-center gap-2">
                      <span className="text-stone-400">Lockup:</span>
                      <div className="flex items-center gap-1 text-stone-200 font-medium">
                        <DartLogo concept={concept.id} size={14} />
                        <span>Dart</span>
                      </div>
                    </div>
                    <span>32x32 Vector</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-800 bg-stone-900/60 flex items-center justify-between text-xs text-stone-400">
          <span>Active selection is saved to your browser session.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
