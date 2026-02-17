
import React, { useMemo, useState } from 'react';
import { BilletData } from '../types';
import { FileBarChart, Calendar, ChevronDown, ChevronRight, Truck, Weight, FileText, ArrowDownWideNarrow, ArrowLeft, Printer } from 'lucide-react';

interface Props {
  history: BilletData[];
  onBack: () => void;
}

type PrintSelection = {
  type: 'project' | 'week' | 'day';
  projectName: string;
  weekKey?: string;
  dayKey?: string;
} | null;

const ReportView: React.FC<Props> = ({ history, onBack }) => {
  const [selectedProvenance, setSelectedProvenance] = useState<string>('all');
  const [printSelection, setPrintSelection] = useState<PrintSelection>(null);

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
    const sunDay = sun.getDate();
    const satDay = sat.getDate();
    const sunMonth = sun.toLocaleDateString('fr-FR', { month: 'short' });
    const satMonth = sat.toLocaleDateString('fr-FR', { month: 'short' });
    const year = sat.getFullYear();

    if (sunMonth === satMonth) return `du ${sunDay} au ${satDay} ${sunMonth} ${year}`;
    return `du ${sunDay} ${sunMonth} au ${satDay} ${satMonth} ${year}`;
  };

  const provenancesList = useMemo(() => {
    const set = new Set(history.map(b => b.provenance));
    return Array.from(set).sort();
  }, [history]);

  const reportData = useMemo(() => {
    const data: Record<string, any> = {};

    history.forEach(b => {
      const prov = b.provenance || 'SANS PROVENANCE';
      const weekKey = getSundayKey(b.date);
      const day = b.date;
      const material = b.typeSol === "Autre" ? (b.typeSolOther || "Autre") : (b.typeSol || "Non spécifié");
      const tons = parseFloat(b.quantite === "Autre" ? (b.quantiteOther || "0") : (b.quantite || "0")) || 0;

      if (!data[prov]) data[prov] = { weeks: {}, totalTons: 0, totalTrips: 0 };
      if (!data[prov].weeks[weekKey]) data[prov].weeks[weekKey] = { days: {}, weekTons: 0, weekTrips: 0 };
      if (!data[prov].weeks[weekKey].days[day]) data[prov].weeks[weekKey].days[day] = { materials: {}, dayTons: 0, dayTrips: 0 };
      if (!data[prov].weeks[weekKey].days[day].materials[material]) {
        data[prov].weeks[weekKey].days[day].materials[material] = {
          tons: 0,
          trips: 0,
          trucks: new Set(),
          billets: []
        };
      }

      const m = data[prov].weeks[weekKey].days[day].materials[material];
      m.tons += tons;
      m.trips += 1;
      m.trucks.add(b.plaque === "Autre" ? b.plaqueOther : b.plaque);
      m.billets.push({ id: b.id, date: b.date });

      data[prov].totalTons += tons;
      data[prov].totalTrips += 1;
      data[prov].weeks[weekKey].weekTons += tons;
      data[prov].weeks[weekKey].weekTrips += 1;
      data[prov].weeks[weekKey].days[day].dayTons += tons;
      data[prov].weeks[weekKey].days[day].dayTrips += 1;
    });

    return data;
  }, [history]);

  const filteredProvenances = selectedProvenance === 'all' 
    ? Object.keys(reportData).sort() 
    : [selectedProvenance];

  const handlePrint = (selection: PrintSelection) => {
    setPrintSelection(selection);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-10">
      <div className="print:hidden">
        <div className="bg-black text-white p-6 shadow-md mb-4 border-b-4 border-[#76a73c]">
          <button 
            onClick={onBack} 
            className="flex items-center gap-1 text-[10px] font-black uppercase bg-white/10 px-3 py-1.5 rounded-lg mb-6 active:scale-95 transition-transform w-fit"
          >
            <ArrowLeft className="w-3 h-3" /> Retour Données
          </button>
          <div className="flex items-center gap-3 mb-2">
            <FileBarChart className="w-6 h-6 text-[#76a73c]" />
            <h2 className="text-xl font-black uppercase italic tracking-tighter leading-tight">Suivi Logistique</h2>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accumulation du Tonnage & Matériaux</p>
        </div>

        <div className="px-4 mb-6">
          <label className="text-[10px] font-black text-black uppercase mb-1.5 block px-1">Filtrer par Chantier</label>
          <div className="relative">
            <select 
              className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#76a73c] font-black text-sm uppercase appearance-none text-black"
              value={selectedProvenance}
              onChange={(e) => setSelectedProvenance(e.target.value)}
            >
              <option value="all" className="text-black">Tous les chantiers</option>
              {provenancesList.map(p => <option key={p} value={p} className="text-black">{p}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="px-4 space-y-8">
          {filteredProvenances.map(provName => {
            const prov = reportData[provName];
            return (
              <div key={provName} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center justify-between border-b-2 border-black pb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-black text-black uppercase italic tracking-tighter">{provName}</h3>
                    <button 
                      onClick={() => handlePrint({ type: 'project', projectName: provName })}
                      className="p-1.5 bg-slate-200 hover:bg-black hover:text-white rounded-lg transition-colors active:scale-90"
                      title="Imprimer ce projet"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-right">
                        <div className="text-[8px] font-black text-slate-400 uppercase">Total Tonnage</div>
                        <div className="text-sm font-black text-[#76a73c]">{prov.totalTons.toLocaleString()} T</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[8px] font-black text-slate-400 uppercase">Total Voyages</div>
                        <div className="text-sm font-black text-black">{prov.totalTrips}</div>
                    </div>
                  </div>
                </div>

                {Object.keys(prov.weeks).sort((a, b) => b.localeCompare(a)).map(weekKey => {
                  const week = prov.weeks[weekKey];
                  return (
                    <div key={weekKey} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="bg-slate-100 px-4 py-3 flex justify-between items-center border-b border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#76a73c]" />
                            <span className="text-xs font-black uppercase text-black">Semaine {formatWeekRange(weekKey)}</span>
                          </div>
                          <button 
                            onClick={() => handlePrint({ type: 'week', projectName: provName, weekKey })}
                            className="p-1 bg-white border border-slate-300 hover:bg-black hover:text-white rounded transition-colors active:scale-90"
                            title="Imprimer cette semaine"
                          >
                            <Printer className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex gap-3 text-[10px] font-black uppercase text-slate-500">
                          <span>{week.weekTons.toLocaleString()} T</span>
                          <span>•</span>
                          <span>{week.weekTrips} Voyages</span>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100 text-black">
                        {Object.keys(week.days).sort((a, b) => b.localeCompare(a)).map(dayKey => {
                          const day = week.days[dayKey];
                          const dateObj = new Date(dayKey + 'T12:00:00');
                          const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });

                          return (
                            <div key={dayKey} className="p-4 bg-white">
                              <div className="flex items-center justify-between mb-3">
                                 <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                                    <h4 className="text-[11px] font-black text-black uppercase italic">{dayName}</h4>
                                 </div>
                                 <button 
                                    onClick={() => handlePrint({ type: 'day', projectName: provName, weekKey, dayKey })}
                                    className="p-1 bg-slate-50 hover:bg-black hover:text-white rounded transition-colors active:scale-90 border border-slate-200"
                                    title="Imprimer cette journée"
                                 >
                                    <Printer className="w-2.5 h-2.5" />
                                 </button>
                              </div>

                              <div className="space-y-4">
                                {Object.keys(day.materials).map(matName => {
                                  const m = day.materials[matName];
                                  return (
                                    <div key={matName} className="pl-3 border-l-2 border-slate-100">
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="text-[10px] font-black text-[#76a73c] uppercase leading-none">{matName}</div>
                                        <div className="flex gap-3 items-center">
                                          <div className="flex items-center gap-1 text-[9px] font-black text-black uppercase">
                                            <Weight className="w-3 h-3" /> {m.tons.toLocaleString()} T
                                          </div>
                                          <div className="flex items-center gap-1 text-[9px] font-black text-black uppercase">
                                            <Truck className="w-3 h-3" /> {m.trips} v.
                                          </div>
                                          <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase">
                                            <ArrowDownWideNarrow className="w-3 h-3" /> {m.trucks.size} cam.
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {m.billets.map((b: any) => (
                                          <span key={b.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[8px] font-mono font-bold text-slate-600">
                                            <FileText className="w-2 h-2" /> {b.id.split('-').pop()}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {filteredProvenances.length === 0 && (
             <div className="text-center py-20">
               <FileBarChart className="w-12 h-12 text-slate-200 mx-auto mb-4" />
               <p className="text-slate-400 font-bold uppercase text-sm">Aucune donnée à afficher.</p>
             </div>
          )}
        </div>
      </div>

      {/* VERSION IMPRESSION PDF TRÈS CONDENSÉE */}
      {printSelection && (
        <div className="hidden print:block p-4 bg-white text-black font-sans min-h-screen text-[9px] leading-tight">
          <div className="flex justify-between items-end border-b-4 border-black pb-2 mb-4">
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter leading-none text-black">
                GROUPE <span className="text-[#76a73c]">DDL</span>
              </h1>
              <p className="text-[8px] font-black uppercase tracking-[0.3em] mt-1 text-slate-500">RAPPORT DE SUIVI LOGISTIQUE</p>
            </div>
            <div className="text-right">
              <div className="bg-black text-white px-3 py-1 mb-1 inline-block">
                <h2 className="text-[10px] font-black uppercase italic tracking-widest leading-none">
                  {printSelection.type === 'project' ? 'RAPPORT CHANTIER' : 
                   printSelection.type === 'week' ? 'RAPPORT HEBDOMADAIRE' : 'RAPPORT JOURNALIER'}
                </h2>
              </div>
              <p className="text-[8px] font-black uppercase text-slate-500">Généré le {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-0 border-2 border-black mb-4">
            <div className="p-3 border-r-2 border-black">
               <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest block mb-0.5">Identification du Projet</span>
               <div className="text-xl font-black uppercase italic tracking-tight">{printSelection.projectName}</div>
            </div>
            <div className="bg-slate-50 p-3 flex flex-col justify-center items-end">
               <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest block mb-0.5">Période</span>
               <div className="text-[10px] font-black text-black">
                  {printSelection.type === 'project' ? 'Historique complet' : 
                   printSelection.type === 'week' ? formatWeekRange(printSelection.weekKey!) : 
                   printSelection.dayKey}
               </div>
               <div className="text-[8px] font-black text-[#76a73c] uppercase mt-1">
                  {reportData[printSelection.projectName] && (
                    <>
                      TOTAL : {
                        printSelection.type === 'project' ? reportData[printSelection.projectName].totalTons :
                        printSelection.type === 'week' ? reportData[printSelection.projectName].weeks[printSelection.weekKey!].weekTons :
                        reportData[printSelection.projectName].weeks[printSelection.weekKey!].days[printSelection.dayKey!].dayTons
                      } T
                    </>
                  )}
               </div>
            </div>
          </div>

          <div className="space-y-4">
            {Object.keys(reportData[printSelection.projectName].weeks)
              .filter(wk => printSelection.type !== 'week' || wk === printSelection.weekKey)
              .filter(wk => printSelection.type !== 'day' || wk === printSelection.weekKey)
              .sort((a, b) => b.localeCompare(a))
              .map(wk => (
                <div key={wk} className="space-y-4">
                  {Object.keys(reportData[printSelection.projectName].weeks[wk].days)
                    .filter(dk => printSelection.type !== 'day' || dk === printSelection.dayKey)
                    .sort((a, b) => b.localeCompare(a))
                    .map(dk => {
                      const day = reportData[printSelection.projectName].weeks[wk].days[dk];
                      return (
                        <div key={dk} className="page-break-inside-avoid border-t border-slate-100 pt-2">
                          <div className="bg-slate-50 px-3 py-1 flex items-center justify-between mb-2">
                             <h3 className="text-xs font-black uppercase italic tracking-tight">{dk}</h3>
                             <div className="flex gap-4 text-[8px] font-black uppercase tracking-widest text-[#76a73c]">
                               <span>TOTAL JOUR : {day.dayTons.toLocaleString()} T</span>
                               <span className="bg-black text-white px-1.5 py-0.5 rounded ml-1">VOYAGES : {day.dayTrips}</span>
                             </div>
                          </div>

                          <table className="w-full border-collapse text-[8px]">
                            <thead>
                              <tr className="bg-black text-white">
                                <th className="p-1.5 text-left uppercase border-r border-white/20">Matériau / Type de Sol</th>
                                <th className="p-1.5 text-center uppercase border-r border-white/20">Voyages</th>
                                <th className="p-1.5 text-center uppercase border-r border-white/20">Camions</th>
                                <th className="p-1.5 text-right uppercase">Tonnage Cumulé</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {Object.keys(day.materials).map(matName => {
                                const m = day.materials[matName];
                                return (
                                  <tr key={matName}>
                                    <td className="p-1.5 font-black uppercase text-slate-700">{matName}</td>
                                    <td className="p-1.5 text-center font-mono">{m.trips}</td>
                                    <td className="p-1.5 text-center font-mono">{m.trucks.size}</td>
                                    <td className="p-1.5 text-right font-black font-mono bg-slate-50">{m.tons.toLocaleString()} T</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                </div>
              ))}
          </div>

          <div className="mt-8 pt-4 border-t-2 border-slate-100 flex justify-between items-center opacity-50">
             <p className="text-[6px] font-black text-slate-400 uppercase tracking-[0.3em]">LOGIVRAC • GROUPE DDL EXCAVATION INC.</p>
             <p className="text-[6px] font-black text-slate-300 uppercase">DOCUMENT DE SYNTHÈSE LOGISTIQUE</p>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
          }
          .page-break-inside-avoid {
            break-inside: avoid;
          }
          @page {
            margin: 1cm;
          }
        }
      `}} />
    </div>
  );
};

export default ReportView;
