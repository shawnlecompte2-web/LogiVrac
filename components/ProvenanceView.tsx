
import React, { useState, useMemo } from 'react';
import { BilletData } from '../types';
import { Calendar, ChevronRight, FileText, List, Layers, ArrowLeft, MapPin, HardHat } from 'lucide-react';

interface Props {
  history: BilletData[];
  onSelectBillet: (billet: BilletData) => void;
}

type SubView = 'list' | 'by_type';

const ProvenanceView: React.FC<Props> = ({ history, onSelectBillet }) => {
  const [selectedProvenance, setSelectedProvenance] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [mode, setMode] = useState<SubView>('list');

  // Utilitaire pour obtenir le dimanche de la semaine (clé technique YYYY-MM-DD)
  const getSundayKey = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00'); // Midi pour éviter les bugs de fuseau horaire
    const day = d.getDay(); 
    const diff = d.getDate() - day;
    const sunday = new Date(d.setDate(diff));
    return sunday.toISOString().split('T')[0];
  };

  // Formatteur pour l'affichage visuel (ex: du 1 au 7 février 2026)
  const formatWeekRange = (sundayKey: string) => {
    const sun = new Date(sundayKey + 'T12:00:00');
    const sat = new Date(new Date(sun).setDate(sun.getDate() + 6));

    const sunDay = sun.getDate();
    const satDay = sat.getDate();
    const sunMonth = sun.toLocaleDateString('fr-FR', { month: 'long' });
    const satMonth = sat.toLocaleDateString('fr-FR', { month: 'long' });
    const year = sat.getFullYear();

    if (sunMonth === satMonth) {
      return `du ${sunDay} au ${satDay} ${sunMonth} ${year}`;
    }
    return `du ${sunDay} ${sunMonth} au ${satDay} ${satMonth} ${year}`;
  };

  // 1. Groupement par PROVENANCE (Niveau 1)
  const byProvenance = useMemo(() => {
    return history.reduce((acc, current) => {
      const prov = current.provenance || "SANS PROVENANCE";
      if (!acc[prov]) acc[prov] = [];
      acc[prov].push(current);
      return acc;
    }, {} as Record<string, BilletData[]>);
  }, [history]);

  // 2. Groupement par SEMAINE pour la provenance sélectionnée (Niveau 2)
  const weeksForProvenance = useMemo(() => {
    if (!selectedProvenance) return {};
    return byProvenance[selectedProvenance].reduce((acc, current) => {
      const weekKey = getSundayKey(current.date);
      if (!acc[weekKey]) acc[weekKey] = [];
      acc[weekKey].push(current);
      return acc;
    }, {} as Record<string, BilletData[]>);
  }, [selectedProvenance, byProvenance]);

  // 3. Préparation des billets pour la vue finale (Niveau 3)
  const finalBillets = useMemo(() => {
    if (!selectedProvenance || !selectedWeek) return [];
    return weeksForProvenance[selectedWeek];
  }, [selectedProvenance, selectedWeek, weeksForProvenance]);

  const groupedByType = useMemo(() => {
    return finalBillets.reduce((acc, b) => {
      const type = b.typeSol === "Autre" ? (b.typeSolOther || "Autre") : (b.typeSol || "Non spécifié");
      if (!acc[type]) acc[type] = [];
      acc[type].push(b);
      return acc;
    }, {} as Record<string, BilletData[]>);
  }, [finalBillets]);

  if (history.length === 0) {
    return (
      <div className="text-center py-20">
        <MapPin className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <p className="text-slate-400 font-bold uppercase text-sm">Aucun historique disponible.</p>
      </div>
    );
  }

  // --- NIVEAU 3 : DÉTAILS DE LA SEMAINE ---
  if (selectedProvenance && selectedWeek) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setSelectedWeek(null)}
            className="w-fit flex items-center gap-1 text-black font-black uppercase text-[10px] bg-slate-200 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-3 h-3" /> Retour aux semaines
          </button>
          <div className="bg-black text-white p-4 rounded-2xl shadow-lg border-l-4 border-[#76a73c]">
             <div className="text-[10px] font-black text-[#76a73c] uppercase leading-none mb-1">{selectedProvenance}</div>
             <div className="text-sm font-black uppercase tracking-tight">Semaine {formatWeekRange(selectedWeek)}</div>
          </div>
        </div>

        <div className="flex bg-slate-200 p-1 rounded-xl">
          <button 
            onClick={() => setMode('list')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${mode === 'list' ? 'bg-black text-white shadow-md' : 'text-slate-500'}`}
          >
            <List className="w-4 h-4" /> Tous
          </button>
          <button 
            onClick={() => setMode('by_type')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${mode === 'by_type' ? 'bg-[#76a73c] text-white shadow-md' : 'text-slate-500'}`}
          >
            <Layers className="w-4 h-4" /> Par Matériau
          </button>
        </div>

        <div className="space-y-6">
          {mode === 'list' ? (
            <div className="grid gap-2">
              {finalBillets.sort((a, b) => b.id.localeCompare(a.id)).map(h => (
                <BilletItem key={h.id} billet={h} onClick={() => onSelectBillet(h)} />
              ))}
            </div>
          ) : (
            Object.keys(groupedByType).sort().map(type => (
              <div key={type} className="space-y-2">
                <div className="flex items-center gap-2 border-b-2 border-black/5 pb-1">
                   <div className="w-2 h-2 rounded-full bg-[#76a73c]"></div>
                   <h4 className="font-black text-black uppercase text-[11px] italic">{type}</h4>
                   <span className="ml-auto text-[9px] font-black text-slate-400">{groupedByType[type].length} BON(S)</span>
                </div>
                <div className="grid gap-2">
                   {groupedByType[type].map(h => (
                     <BilletItem key={h.id} billet={h} onClick={() => onSelectBillet(h)} />
                   ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // --- NIVEAU 2 : SÉLECTION DE LA SEMAINE ---
  if (selectedProvenance) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedProvenance(null)}
            className="flex items-center gap-1 text-black font-black uppercase text-[10px] bg-slate-200 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-3 h-3" /> Retour aux provenances
          </button>
        </div>

        <div className="bg-[#76a73c] p-5 rounded-2xl shadow-lg border-b-4 border-black/20">
           <div className="text-[10px] font-black text-black/60 uppercase leading-none mb-1">Provenance sélectionnée</div>
           <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-tight">{selectedProvenance}</h3>
        </div>

        <div className="grid gap-3">
          {Object.keys(weeksForProvenance).sort((a, b) => b.localeCompare(a)).map(weekKey => (
            <button
              key={weekKey}
              onClick={() => setSelectedWeek(weekKey)}
              className="w-full bg-white p-4 rounded-2xl border-2 border-slate-200 hover:border-black flex items-center justify-between shadow-sm active:scale-[0.98] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-[#76a73c]/10 transition-colors">
                  <Calendar className="w-5 h-5 text-black group-hover:text-[#76a73c]" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Semaine</div>
                  <div className="text-sm font-black text-black uppercase">{formatWeekRange(weekKey)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-black text-white px-2 py-1 rounded-md">{weeksForProvenance[weekKey].length}</span>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-black" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- NIVEAU 1 : SÉLECTION DE LA PROVENANCE ---
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-2">
         <HardHat className="w-5 h-5 text-[#76a73c]" />
         <h2 className="text-xl font-black uppercase text-black italic tracking-tighter">Liste des Provenances</h2>
      </div>

      <div className="grid gap-3">
        {Object.keys(byProvenance).sort().map((prov) => (
          <button
            key={prov}
            onClick={() => setSelectedProvenance(prov)}
            className="w-full bg-white p-5 rounded-3xl border-2 border-slate-200 hover:border-[#76a73c] text-left flex items-center justify-between shadow-sm active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-slate-100 p-3 rounded-2xl group-hover:bg-[#76a73c]/10 transition-colors">
                <MapPin className="w-6 h-6 text-black group-hover:text-[#76a73c]" />
              </div>
              <div>
                <h3 className="text-base font-black text-black uppercase tracking-tight">{prov}</h3>
                <div className="text-[10px] font-bold text-[#76a73c] mt-0.5 uppercase">
                  {byProvenance[prov].length} BILLET(S) AU TOTAL
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-black" />
          </button>
        ))}
      </div>
    </div>
  );
};

// Sous-composant pour la ligne d'un billet
// Using React.FC to correctly handle intrinsic props like 'key' and provide standard component typing.
const BilletItem: React.FC<{ billet: BilletData; onClick: () => void }> = ({ billet, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between hover:border-[#76a73c] active:bg-slate-50 transition-all cursor-pointer shadow-sm group"
  >
    <div className="flex items-center gap-3">
      <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-[#76a73c]/10">
        <FileText className="w-4 h-4 text-black group-hover:text-[#76a73c]" />
      </div>
      <div>
        <div className="text-[9px] font-black text-[#76a73c] tracking-tighter">{billet.id}</div>
        <div className="text-xs font-black text-black uppercase leading-tight">{billet.clientName || 'SANS NOM'}</div>
        <div className="text-[8px] font-bold text-slate-400 uppercase">
          {billet.date} — {billet.typeSol}
        </div>
      </div>
    </div>
    <ChevronRight className="w-4 h-4 text-slate-300" />
  </div>
);

export default ProvenanceView;
