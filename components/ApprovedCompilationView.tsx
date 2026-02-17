
import React, { useState, useMemo } from 'react';
import { BilletData } from '../types';
import BilletPreview from './BilletPreview';
import { MapPin, Calendar, ChevronRight, ArrowLeft, Printer, FileText, LayoutList, History, Search } from 'lucide-react';

interface Props {
  history: BilletData[];
  onBack: () => void;
}

type ViewLevel = 'provenance' | 'week' | 'day' | 'detail';

const ApprovedCompilationView: React.FC<Props> = ({ history, onBack }) => {
  const [level, setLevel] = useState<ViewLevel>('provenance');
  const [selectedProv, setSelectedProv] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedBillet, setSelectedBillet] = useState<BilletData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const approvedHistory = useMemo(() => history.filter(b => b.status === 'approved'), [history]);

  // Utilitaires de dates
  const getSundayKey = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    const day = d.getDay();
    const diff = d.getDate() - day;
    const sunday = new Date(d.setDate(diff));
    return sunday.toISOString().split('T')[0];
  };

  const formatWeekRange = (sundayKey: string) => {
    const sun = new Date(sundayKey + 'T12:00:00');
    const sat = new Date(new Date(sun).setDate(sun.getDate() + 6));
    return `Du ${sun.getDate()} ${sun.toLocaleDateString('fr-FR', { month: 'short' })} au ${sat.getDate()} ${sat.toLocaleDateString('fr-FR', { month: 'short' })} ${sat.getFullYear()}`;
  };

  // 1. Provenances
  const provenances = useMemo(() => {
    const data: Record<string, BilletData[]> = {};
    approvedHistory.forEach(b => {
      const p = b.provenance || "SANS PROVENANCE";
      if (!data[p]) data[p] = [];
      data[p].push(b);
    });
    return data;
  }, [approvedHistory]);

  // 2. Semaines pour la provenance choisie
  const weeks = useMemo(() => {
    if (!selectedProv) return {};
    const data: Record<string, BilletData[]> = {};
    provenances[selectedProv].forEach(b => {
      const wk = getSundayKey(b.date);
      if (!data[wk]) data[wk] = [];
      data[wk].push(b);
    });
    return data;
  }, [selectedProv, provenances]);

  // 3. Jours pour la semaine choisie
  const days = useMemo(() => {
    if (!selectedWeek) return {};
    const data: Record<string, BilletData[]> = {};
    weeks[selectedWeek].forEach(b => {
      if (!data[b.date]) data[b.date] = [];
      data[b.date].push(b);
    });
    return data;
  }, [selectedWeek, weeks]);

  const handlePrint = () => {
    window.print();
  };

  // Filtrage par recherche
  const filteredProvenances = Object.keys(provenances).filter(p => 
    p.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort();

  // Navigation handlers
  const goBack = () => {
    if (level === 'detail') setLevel('day');
    else if (level === 'day') setLevel('week');
    else if (level === 'week') setLevel('provenance');
    else onBack();
  };

  // Billets à imprimer (pour le template caché)
  const billetsToPrint = useMemo(() => {
    if (level === 'detail' && selectedBillet) return [selectedBillet];
    if (level === 'day' && selectedDay) return days[selectedDay] || [];
    if (level === 'week' && selectedWeek) return weeks[selectedWeek] || [];
    if (level === 'provenance' && selectedProv) return provenances[selectedProv] || [];
    return [];
  }, [level, selectedBillet, selectedDay, selectedWeek, selectedProv, days, weeks, provenances]);

  return (
    <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in duration-300">
      <div className="print:hidden">
        {/* HEADER */}
        <div className="bg-black text-white p-6 shadow-md mb-6 border-b-4 border-[#76a73c]">
          <button onClick={goBack} className="flex items-center gap-1 text-[10px] font-black uppercase bg-white/10 px-3 py-1.5 rounded-lg mb-6 active:scale-95 transition-transform">
            <ArrowLeft className="w-3 h-3" /> Retour
          </button>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <LayoutList className="w-8 h-8 text-[#76a73c]" />
              <div>
                <h2 className="text-xl font-black uppercase italic tracking-tighter leading-none">Répertoire Approuvé</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {level === 'provenance' ? 'Choisir un chantier' : 
                   level === 'week' ? selectedProv : 
                   level === 'day' ? formatWeekRange(selectedWeek!) : 
                   `Billet ${selectedBillet?.id}`}
                </p>
              </div>
            </div>
            {level !== 'provenance' && (
              <button 
                onClick={handlePrint}
                className="bg-[#76a73c] text-black p-3 rounded-2xl shadow-lg active:scale-95 hover:bg-[#8bc546] transition-all"
              >
                <Printer className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* NIVEAU 1 : PROVENANCES */}
        {level === 'provenance' && (
          <div className="px-5 space-y-4">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Rechercher un chantier..."
                className="w-full bg-white border-2 border-slate-200 rounded-2xl pl-10 pr-4 py-3 outline-none focus:border-black font-black text-sm uppercase"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {filteredProvenances.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <History className="w-10 h-10 text-slate-200 mx-auto mb-3 opacity-20" />
                <p className="text-[10px] font-black text-slate-400 uppercase">Aucun billet approuvé.</p>
              </div>
            ) : (
              filteredProvenances.map(p => (
                <button 
                  key={p} 
                  onClick={() => { setSelectedProv(p); setLevel('week'); }}
                  className="w-full bg-white p-6 rounded-[2.5rem] border-2 border-slate-200 hover:border-black shadow-sm flex items-center justify-between transition-all active:scale-95 group"
                >
                  <div className="flex items-center gap-5">
                    <div className="bg-slate-50 p-4 rounded-2xl text-black group-hover:bg-black group-hover:text-white transition-colors">
                      <MapPin className="w-7 h-7" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-black text-black uppercase italic leading-none">{p}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{provenances[p].length} billets approuvés</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-black" />
                </button>
              ))
            )}
          </div>
        )}

        {/* NIVEAU 2 : SEMAINES */}
        {level === 'week' && selectedProv && (
          <div className="px-5 space-y-3">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">Périodes enregistrées</div>
            {Object.keys(weeks).sort((a, b) => b.localeCompare(a)).map(wk => (
              <button 
                key={wk} 
                onClick={() => { setSelectedWeek(wk); setLevel('day'); }}
                className="w-full bg-white p-5 rounded-3xl border-2 border-slate-200 hover:border-[#76a73c] flex items-center justify-between shadow-sm active:scale-95 group transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-[#76a73c]/10 text-black">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-black uppercase italic">{formatWeekRange(wk)}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{weeks[wk].length} billets</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-black mt-1" />
              </button>
            ))}
          </div>
        )}

        {/* NIVEAU 3 : JOURS */}
        {level === 'day' && selectedWeek && (
          <div className="px-5 space-y-6">
            {Object.keys(days).sort((a, b) => b.localeCompare(a)).map(dayKey => (
              <div key={dayKey} className="space-y-3">
                <div className="flex items-center gap-2 border-b-2 border-slate-100 pb-1 px-1">
                  <div className="w-2 h-2 rounded-full bg-[#76a73c]"></div>
                  <h4 className="text-[11px] font-black text-black uppercase italic">{dayKey}</h4>
                  <span className="ml-auto text-[9px] font-black text-slate-300">{days[dayKey].length} BILLETS</span>
                </div>
                <div className="grid gap-2">
                  {days[dayKey].map(b => (
                    <button 
                      key={b.id} 
                      onClick={() => { setSelectedBillet(b); setLevel('detail'); }}
                      className="w-full bg-white p-3 rounded-2xl border border-slate-200 hover:border-black flex items-center justify-between active:scale-95 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-slate-300" />
                        <div className="text-left">
                          <div className="text-[9px] font-black text-[#76a73c]">{b.id}</div>
                          <div className="text-xs font-black text-black uppercase">{b.clientName}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-black" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* NIVEAU 4 : DÉTAIL BILLET */}
        {level === 'detail' && selectedBillet && (
          <div className="px-5 animate-in zoom-in-95 duration-300">
             <BilletPreview data={selectedBillet} />
          </div>
        )}
      </div>

      {/* TEMPLATE D'IMPRESSION (Invisible à l'écran, visible au PDF) */}
      <div className="hidden print:block p-0 bg-white">
        {billetsToPrint.map((b, idx) => (
          <div key={b.id} className={`${idx > 0 ? 'page-break-before-always' : ''} p-0`}>
             <BilletPreview data={b} />
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .page-break-before-always {
            page-break-before: always;
            break-before: page;
          }
          body {
            background: white !important;
          }
        }
      `}} />
    </div>
  );
};

export default ApprovedCompilationView;
