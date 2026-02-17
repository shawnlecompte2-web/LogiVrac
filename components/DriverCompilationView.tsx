
import React, { useMemo, useState } from 'react';
import { PunchLog, UserAccount, BilletData, ApprovalRecord } from '../types';
import { ArrowLeft, UserCircle, ChevronRight, Calendar, Truck, Layers, Weight, Clock, MapPin, Printer, FileText, Timer, LogIn, LogOut, Coffee } from 'lucide-react';

interface Props {
  logs: PunchLog[];
  users: UserAccount[];
  history: BilletData[];
  approvals: ApprovalRecord[];
  onBack: () => void;
}

type NavStep = 'drivers' | 'weeks' | 'details';

const DriverCompilationView: React.FC<Props> = ({ logs, users, history, approvals, onBack }) => {
  const [step, setStep] = useState<NavStep>('drivers');
  const [selectedDriver, setSelectedDriver] = useState<UserAccount | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [dayToPrint, setDayToPrint] = useState<string | null>(null);

  const chauffeurs = useMemo(() => users.filter(u => u.role === 'chauffeur' || u.role === 'gestionnaire_chauffeur').sort((a, b) => a.name.localeCompare(b.name)), [users]);

  // Transforme une date ISO (YYYY-MM-DD) ou FR (DD/MM/YYYY) en objet Date à midi
  const toDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    // Nettoyage si c'est un timestamp complet
    const cleanDate = dateStr.split(/[ ,]+/)[0];
    if (cleanDate.includes('-')) {
      const [y, m, d] = cleanDate.split('-').map(Number);
      return new Date(y, m - 1, d, 12, 0, 0);
    } else if (cleanDate.includes('/')) {
      const [d, m, y] = cleanDate.split('/').map(Number);
      return new Date(y, m - 1, d, 12, 0, 0);
    }
    return new Date();
  };

  const getSundayKey = (dateStr: string) => {
    const d = toDate(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const sunday = new Date(d.setDate(diff));
    return sunday.toISOString().split('T')[0];
  };

  const formatWeekRange = (sundayKey: string) => {
    const sun = new Date(sundayKey + 'T12:00:00');
    const sat = new Date(new Date(sun).setDate(sun.getDate() + 6));
    return `Du ${sun.getDate()} au ${sat.getDate()} ${sat.toLocaleDateString('fr-FR', { month: 'short' })} ${sat.getFullYear()}`;
  };

  const formatMs = (ms: number) => {
    if (ms < 0) ms = 0;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  };

  const parseTimestamp = (ts: string) => {
    if (!ts) return 0;
    const cleanTs = ts.replace(',', '').trim();
    const [datePart, timePart] = cleanTs.split(/\s+/);
    if (!datePart || !timePart) return 0;
    const [day, month, year] = datePart.split('/').map(Number);
    const [hh, mm] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hh, mm).getTime();
  };

  // Traitement robuste des données
  const driverData = useMemo(() => {
    if (!selectedDriver) return {};
    
    const weeks: Record<string, any> = {};
    const driverName = selectedDriver.name.trim();

    // On prépare les sources de données pour ce chauffeur
    const driverPunches = logs.filter(l => (l.employeeName || "").trim() === driverName);
    const driverApprovals = approvals.filter(a => (a.employeeName || "").trim() === driverName);

    const initDay = (wk: string, dayIso: string) => {
      if (!weeks[wk]) weeks[wk] = { days: {} };
      if (!weeks[wk].days[dayIso]) {
        weeks[wk].days[dayIso] = { tickets: [], prod: {}, hours: null };
      }
      return weeks[wk].days[dayIso];
    };

    // 1. D'abord, on traite les pointages pour créer les journées et identifier les camions utilisés
    const plaquesByDay: Record<string, Set<string>> = {};
    driverPunches.forEach(p => {
      const datePart = p.timestamp.split(/[ ,]+/)[0];
      const d = toDate(datePart);
      const iso = d.toISOString().split('T')[0];
      const wk = getSundayKey(iso);
      initDay(wk, iso);
      
      if (p.type === 'in' && p.plaque) {
        if (!plaquesByDay[iso]) plaquesByDay[iso] = new Set();
        plaquesByDay[iso].add(p.plaque.trim().toUpperCase());
      }
    });

    // 2. Ensuite, on traite TOUS les billets de l'historique pour trouver ceux qui appartiennent au chauffeur
    // Un billet appartient au chauffeur s'il en est l'émetteur OU si la plaque correspond au camion qu'il utilisait ce jour-là
    history.forEach(b => {
      const isIssuer = (b.issuerName || "").trim() === driverName;
      const bPlaqueNormalized = (b.plaque === 'Autre' ? b.plaqueOther : b.plaque)?.trim().toUpperCase();
      const isHisTruckOnThatDay = bPlaqueNormalized && plaquesByDay[b.date]?.has(bPlaqueNormalized);

      if (isIssuer || isHisTruckOnThatDay) {
        const wk = getSundayKey(b.date);
        const day = initDay(wk, b.date);
        
        // Eviter d'ajouter deux fois le même billet (si issuer et truck matchent par ex)
        if (!day.tickets.find((t: any) => t.id === b.id)) {
          day.tickets.push(b);
          const mat = b.typeSol === 'Autre' ? (b.typeSolOther || 'Autre') : (b.typeSol || 'Inconnu');
          const tons = parseFloat(b.quantite === 'Autre' ? (b.quantiteOther || '0') : (b.quantite || '0')) || 0;
          
          if (!day.prod[mat]) day.prod[mat] = { trips: 0, tons: 0 };
          day.prod[mat].trips += 1;
          day.prod[mat].tons += tons;
        }
      }
    });

    // 3. Enfin, on ajoute les informations d'heures approuvées
    driverApprovals.forEach(app => {
      const wk = getSundayKey(app.date);
      const day = initDay(wk, app.date);
      
      // Récupérer Arrivée/Départ pour ce jour
      const dateParts = app.date.split('-');
      const dateStrSlash = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
      const dayLogs = driverPunches
        .filter(l => l.timestamp.startsWith(dateStrSlash))
        .sort((a,b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp));
      
      day.hours = {
        arrival: dayLogs.find(l => l.type === 'in')?.timestamp.split(/[ ,]+/)[1]?.slice(0, 5) || '--:--',
        departure: [...dayLogs].reverse().find(l => l.type === 'out')?.timestamp.split(/[ ,]+/)[1]?.slice(0, 5) || '--:--',
        lunch: (app.lunchMs || 0) / 60000,
        totalNet: app.totalMs
      };
    });

    return weeks;
  }, [selectedDriver, history, logs, approvals]);

  const handlePrintWeek = () => {
    setDayToPrint(null);
    setTimeout(() => window.print(), 50);
  };

  const handlePrintDay = (date: string) => {
    setDayToPrint(date);
    setTimeout(() => window.print(), 50);
  };

  if (step === 'drivers') {
    return (
      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        <button onClick={onBack} className="flex items-center gap-1 text-black font-black uppercase text-[10px] bg-slate-200 px-3 py-1.5 rounded-lg active:scale-95"><ArrowLeft className="w-3 h-3" /> Retour Consultation</button>
        <div className="text-center mb-8">
           <UserCircle className="w-12 h-12 text-black mx-auto mb-2" />
           <h2 className="text-2xl font-black uppercase italic tracking-tighter">Liste des Chauffeurs</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sélectionnez un chauffeur pour sa compilation</p>
        </div>
        <div className="grid gap-3">
           {chauffeurs.map(u => (
             <button key={u.id} onClick={() => { setSelectedDriver(u); setStep('weeks'); }} className="w-full bg-white p-5 rounded-3xl border-2 border-slate-200 hover:border-black flex items-center justify-between shadow-sm active:scale-95 group transition-all">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-3 rounded-2xl group-hover:bg-black group-hover:text-white transition-colors">
                    <UserCircle className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                     <h3 className="text-sm font-black text-black uppercase italic leading-none">{u.name}</h3>
                     <p className="text-[8px] font-black text-[#76a73c] uppercase mt-1 tracking-widest">{u.group || 'DIVISION TRANSPORT'}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-black" />
             </button>
           ))}
        </div>
      </div>
    );
  }

  if (step === 'weeks' && selectedDriver) {
    const weeksKeys = Object.keys(driverData).sort((a,b) => b.localeCompare(a));
    return (
      <div className="p-6 space-y-6 animate-in slide-in-from-right duration-300">
        <button onClick={() => setStep('drivers')} className="flex items-center gap-1 text-black font-black uppercase text-[10px] bg-slate-200 px-3 py-1.5 rounded-lg active:scale-95"><ArrowLeft className="w-3 h-3" /> Retour Chauffeurs</button>
        <div className="bg-black text-white p-6 rounded-3xl shadow-xl border-b-4 border-[#76a73c]">
           <span className="text-[10px] font-black text-[#76a73c] uppercase tracking-[0.2em] mb-1 block">Fiche Individuelle</span>
           <h2 className="text-xl font-black uppercase italic leading-none">{selectedDriver.name}</h2>
           <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">{selectedDriver.group}</p>
        </div>
        <div className="space-y-3">
          {weeksKeys.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <Calendar className="w-10 h-10 text-slate-100 mx-auto mb-3" />
              <p className="text-[10px] font-black text-slate-400 uppercase">Aucune activité enregistrée pour ce chauffeur.</p>
            </div>
          ) : (
            weeksKeys.map(wk => (
              <button key={wk} onClick={() => { setSelectedWeek(wk); setStep('details'); }} className="w-full bg-white p-5 rounded-3xl border-2 border-slate-200 hover:border-black flex items-center justify-between shadow-sm active:scale-95 group transition-all">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-[#76a73c]/10 text-black"><Calendar className="w-5 h-5" /></div>
                  <div className="text-left">
                    <span className="text-[8px] font-black text-slate-300 uppercase block mb-0.5">Semaine</span>
                    <h3 className="text-sm font-black text-black uppercase italic">{formatWeekRange(wk)}</h3>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-black mt-1" />
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  if (step === 'details' && selectedDriver && selectedWeek) {
    const days = driverData[selectedWeek]?.days || {};
    const sortedDays = Object.keys(days).sort((a,b) => b.localeCompare(a));

    return (
      <div className="p-4 space-y-6 animate-in slide-in-from-right duration-300">
        <div className="print:hidden space-y-4">
          <div className="flex justify-between items-center">
            <button onClick={() => setStep('weeks')} className="flex items-center gap-1 text-black font-black uppercase text-[10px] bg-slate-200 px-3 py-1.5 rounded-lg active:scale-95"><ArrowLeft className="w-3 h-3" /> Retour Semaines</button>
            <button onClick={handlePrintWeek} className="bg-[#76a73c] text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg active:scale-95">
               <Printer className="w-4 h-4" /> PDF Semaine
            </button>
          </div>

          <div className="bg-black text-white p-6 rounded-3xl border-l-4 border-[#76a73c] shadow-xl">
             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{selectedDriver.name}</div>
             <h2 className="text-lg font-black uppercase italic">{formatWeekRange(selectedWeek)}</h2>
          </div>

          <div className="space-y-8">
             {sortedDays.map(date => {
                const day = days[date];
                return (
                  <div key={date} className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-b border-slate-100">
                       <div className="flex items-center gap-3">
                         <h3 className="text-sm font-black text-black uppercase italic">{date}</h3>
                         <button 
                           onClick={() => handlePrintDay(date)}
                           className="p-1.5 bg-slate-200 hover:bg-black hover:text-white rounded-lg transition-colors active:scale-90"
                           title="Imprimer cette journée"
                         >
                           <Printer className="w-3.5 h-3.5" />
                         </button>
                       </div>
                       {day.hours && (
                          <div className="bg-black text-[#76a73c] px-3 py-1.5 rounded-xl text-[11px] font-black font-mono">
                             {formatMs(day.hours.totalNet)}
                          </div>
                       )}
                    </div>
                    
                    <div className="p-6 space-y-6">
                       {/* Section Heures */}
                       {day.hours ? (
                          <div className="grid grid-cols-3 gap-3">
                             <div className="bg-slate-100 p-3 rounded-2xl text-center">
                                <span className="text-[7px] font-black text-slate-400 uppercase block mb-1">Arrivée</span>
                                <div className="text-xs font-black text-black">{day.hours.arrival}</div>
                             </div>
                             <div className="bg-slate-100 p-3 rounded-2xl text-center">
                                <span className="text-[7px] font-black text-slate-400 uppercase block mb-1">Dîner</span>
                                <div className="text-xs font-black text-orange-600">{day.hours.lunch}m</div>
                             </div>
                             <div className="bg-slate-100 p-3 rounded-2xl text-center">
                                <span className="text-[7px] font-black text-slate-400 uppercase block mb-1">Départ</span>
                                <div className="text-xs font-black text-black">{day.hours.departure}</div>
                             </div>
                          </div>
                       ) : (
                         <div className="bg-slate-50 p-3 rounded-xl text-center text-[10px] font-black text-slate-400 uppercase italic">
                           Aucune heure approuvée pour ce jour.
                         </div>
                       )}

                       {/* Résumé Production */}
                       <div className="space-y-4">
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                             <Layers className="w-4 h-4 text-[#76a73c]" />
                             <span className="text-[10px] font-black text-slate-400 uppercase italic">Résumé des Voyages</span>
                          </div>
                          <div className="space-y-2">
                             {Object.entries(day.prod).length === 0 ? (
                               <p className="text-[10px] text-slate-300 font-bold uppercase italic text-center py-4">Aucun voyage enregistré</p>
                             ) : (
                               Object.entries(day.prod).map(([mat, data]: [string, any]) => (
                                 <div key={mat} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                                    <div className="text-xs font-black text-black uppercase">{mat}</div>
                                    <div className="flex gap-4">
                                       <div className="text-right">
                                          <div className="text-[7px] font-black text-slate-300 uppercase leading-none mb-0.5">Voyages</div>
                                          <div className="text-xs font-black text-black">{data.trips} v.</div>
                                       </div>
                                       <div className="text-right min-w-[60px]">
                                          <div className="text-[7px] font-black text-slate-300 uppercase leading-none mb-0.5">Tonnage</div>
                                          <div className="text-xs font-black text-[#76a73c]">{data.tons.toLocaleString()} T</div>
                                       </div>
                                    </div>
                                 </div>
                               ))
                             )}
                          </div>
                       </div>

                       {/* Liste des Billets */}
                       <div className="space-y-3">
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                             <FileText className="w-4 h-4 text-blue-500" />
                             <span className="text-[10px] font-black text-slate-400 uppercase italic">Détail des Billets</span>
                          </div>
                          <div className="space-y-2">
                             {day.tickets.length === 0 ? (
                               <p className="text-[10px] text-slate-300 font-bold uppercase italic text-center">Aucun billet pour ce jour.</p>
                             ) : (
                               day.tickets.map((t: BilletData) => (
                                 <div key={t.id} className="flex justify-between items-center text-[10px] font-bold border-b border-slate-50 pb-2 last:border-0">
                                    <div className="flex items-center gap-2">
                                       <span className="text-[#76a73c] font-black font-mono">{t.id.split('-').pop()}</span>
                                       <span className="text-slate-400">|</span>
                                       <span className="text-black uppercase truncate max-w-[100px]">{t.provenance}</span>
                                    </div>
                                    <div className="flex gap-3">
                                       <span className="text-slate-400">{t.time}</span>
                                       <span className="text-black font-black">{t.quantite === 'Autre' ? t.quantiteOther : t.quantite} T</span>
                                    </div>
                                 </div>
                               ))
                             )}
                          </div>
                       </div>
                    </div>
                  </div>
                );
             })}
          </div>
        </div>

        {/* VERSION IMPRESSION PDF RÉÉCRITE POUR ÊTRE TRÈS CONDENSÉE */}
        <div className="hidden print:block p-4 bg-white text-black font-sans min-h-screen text-[9px] leading-tight">
          {/* HEADER CONDENSÉ */}
          <div className="flex justify-between items-end border-b-4 border-black pb-2 mb-4">
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter leading-none text-black">
                GROUPE <span className="text-[#76a73c]">DDL</span>
              </h1>
              <p className="text-[8px] font-black uppercase tracking-[0.3em] mt-1 text-slate-500">
                COMPILATION LOGISTIQUE CHAUFFEUR
              </p>
            </div>
            <div className="text-right">
              <div className="bg-black text-white px-3 py-1 inline-block mb-1">
                <h2 className="text-xs font-black uppercase italic tracking-widest leading-none">
                  {dayToPrint ? "RAPPORT JOURNALIER" : "RAPPORT HEBDOMADAIRE"}
                </h2>
              </div>
              <p className="text-[9px] font-black uppercase text-slate-400">
                {dayToPrint ? dayToPrint : formatWeekRange(selectedWeek)}
              </p>
            </div>
          </div>

          {/* FICHE IDENTITÉ & RÉSUMÉ CONDENSÉS */}
          <div className="grid grid-cols-2 gap-0 border-2 border-black mb-4">
            <div className="p-3 border-r-2 border-black">
               <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest block mb-0.5">Identification</span>
               <div className="text-lg font-black uppercase italic tracking-tight">{selectedDriver.name}</div>
               <div className="text-[8px] font-bold text-[#76a73c] uppercase mt-0.5">
                 {selectedDriver.group} • CODE: {selectedDriver.code}
               </div>
            </div>
            <div className="bg-slate-50 p-3 flex flex-col justify-center items-end">
               <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest block mb-0.5">Productivité Période</span>
               <div className="flex items-baseline gap-2">
                  <div className="text-xl font-black text-black font-mono leading-none tracking-tighter">
                     {formatMs(Object.values(days)
                        .filter((_, i) => !dayToPrint || Object.keys(days)[i] === dayToPrint)
                        .reduce((acc: number, d: any) => acc + (Number(d.hours?.totalNet) || 0), 0) as number)}
                  </div>
                  <div className="text-[9px] font-black text-slate-300 uppercase">HEURES NET</div>
               </div>
               <div className="text-[8px] font-black text-[#76a73c] uppercase mt-1">
                  TONNAGE : {(Object.values(days)
                    .filter((_, i) => !dayToPrint || Object.keys(days)[i] === dayToPrint)
                    .reduce((acc: number, d: any) => acc + (Object.values(d.prod || {}).reduce((ta: number, cur: any) => ta + (Number(cur.tons) || 0), 0) as number), 0) as number).toLocaleString()} T
               </div>
            </div>
          </div>

          {/* DÉTAIL DES JOURNÉES CONDENSÉ */}
          <div className="space-y-4">
            {sortedDays
              .filter(date => !dayToPrint || date === dayToPrint)
              .map(date => {
                const day = days[date];
                return (
                  <div key={date} className="page-break-inside-avoid border-t border-slate-100 pt-2">
                     <div className="bg-slate-50 px-3 py-1 flex items-center justify-between mb-2">
                        <h3 className="text-xs font-black uppercase italic tracking-tight">{date}</h3>
                        {day.hours && (
                          <div className="flex gap-4 text-[8px] font-black uppercase tracking-widest text-[#76a73c]">
                            <span>IN: {day.hours.arrival}</span>
                            <span>OUT: {day.hours.departure}</span>
                            <span className="bg-black text-white px-1.5 py-0.5 rounded ml-1">TOTAL: {formatMs(day.hours.totalNet)}</span>
                          </div>
                        )}
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div>
                          <table className="w-full text-[8px]">
                            <thead>
                              <tr className="border-b-2 border-black">
                                <th className="text-left py-1 uppercase font-black text-[7px]">Matériau</th>
                                <th className="text-center py-1 uppercase font-black text-[7px]">Voyages</th>
                                <th className="text-right py-1 uppercase font-black text-[7px]">Tonnage</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {Object.entries(day.prod).length > 0 ? (
                                Object.entries(day.prod).map(([mat, d]: [string, any]) => (
                                  <tr key={mat}>
                                    <td className="py-1 uppercase font-bold text-[8px] truncate max-w-[120px]">{mat}</td>
                                    <td className="py-1 text-center font-black">{d.trips}</td>
                                    <td className="py-1 text-right font-black text-[#76a73c]">{d.tons.toLocaleString()} T</td>
                                  </tr>
                                ))
                              ) : (
                                <tr><td colSpan={3} className="text-center py-2 text-slate-300 italic">Aucune activité</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        <div>
                          <table className="w-full text-[7px]">
                             <thead>
                               <tr className="border-b-2 border-black">
                                 <th className="text-left py-1 uppercase font-black">Billet #</th>
                                 <th className="text-left py-1 uppercase font-black">H.</th>
                                 <th className="text-left py-1 uppercase font-black">Provenance</th>
                                 <th className="text-right py-1 uppercase font-black">Tons</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100">
                               {day.tickets.length > 0 ? (
                                 day.tickets.map((t: BilletData) => (
                                   <tr key={t.id}>
                                     <td className="py-1 font-mono text-[#76a73c] font-black">{t.id.split('-').pop()}</td>
                                     <td className="py-1 text-slate-400">{t.time}</td>
                                     <td className="py-1 uppercase font-bold truncate max-w-[80px]">{t.provenance}</td>
                                     <td className="py-1 text-right font-black">{t.quantite === 'Autre' ? t.quantiteOther : t.quantite} T</td>
                                   </tr>
                                 ))
                               ) : (
                                 <tr><td colSpan={4} className="text-center py-2 text-slate-300 italic">Aucun billet</td></tr>
                               )}
                             </tbody>
                          </table>
                        </div>
                     </div>
                  </div>
                );
            })}
          </div>

          {/* SIGNATURES TRÈS COMPACTES */}
          <div className="mt-8 pt-4 border-t-2 border-slate-100 flex justify-between gap-16">
             <div className="flex-1">
               <div className="h-10 border-b border-black"></div>
               <div className="mt-1 text-[7px] font-black uppercase text-slate-400 tracking-widest">Signature Chauffeur</div>
             </div>
             <div className="flex-1 text-right">
               <div className="h-10 border-b border-black"></div>
               <div className="mt-1 text-[7px] font-black uppercase text-slate-400 tracking-widest">Validation Direction</div>
             </div>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
           @media print {
              .page-break-inside-avoid {
                break-inside: avoid;
              }
              body {
                background: white !important;
              }
              @page {
                margin: 0.8cm;
              }
           }
        `}} />
      </div>
    );
  }

  return null;
};

export default DriverCompilationView;
