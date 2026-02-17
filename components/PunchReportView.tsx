
import React, { useMemo, useState } from 'react';
import { PunchLog, UserAccount, BilletData, ApprovalRecord } from '../types';
import { Clock, Calendar, User, ChevronRight, Timer, History, LogIn, LogOut, ShieldCheck, ArrowLeft, ArrowRight, Truck, Layers, CalendarRange, Users, Briefcase, Printer, FileText, MapPin, HardHat, Construction } from 'lucide-react';

interface Props {
  logs: PunchLog[];
  users: UserAccount[];
  history: BilletData[];
  approvals: ApprovalRecord[];
  onBack: () => void;
}

type NavStep = 'groups' | 'weeks' | 'employees' | 'employee_history';

const PunchReportView: React.FC<Props> = ({ logs, users, history, approvals, onBack }) => {
  const [step, setStep] = useState<NavStep>('groups');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  const parseTimestamp = (ts: string) => {
    if (!ts) return 0;
    const cleanTs = ts.replace(',', '').trim();
    const parts = cleanTs.split(/\s+/);
    if (parts.length < 2) return 0;
    
    const [datePart, timePart] = parts;
    const dateComponents = datePart.split('/');
    if (dateComponents.length < 3) return 0;
    
    const [day, month, year] = dateComponents.map(Number);
    const timeParts = timePart.split(':').map(Number);
    const hour = timeParts[0] || 0;
    const min = timeParts[1] || 0;
    const sec = timeParts[2] || 0;
    
    return new Date(year, month - 1, day, hour, min, sec).getTime();
  };

  const getSundayKey = (timestamp: string) => {
    const cleanTs = timestamp.replace(',', '').trim();
    const [datePart] = cleanTs.split(/\s+/);
    const [day, month, year] = datePart.split('/').map(Number);
    const d = new Date(year, month - 1, day, 12, 0, 0);
    const dayOfWeek = d.getDay();
    const diff = d.getDate() - dayOfWeek;
    const sunday = new Date(d.setDate(diff));
    return sunday.toISOString().split('T')[0];
  };

  const formatWeekRange = (sundayKey: string) => {
    const sun = new Date(sundayKey + 'T12:00:00');
    const sat = new Date(new Date(sun).setDate(sun.getDate() + 6));
    const sunMonth = sun.toLocaleDateString('fr-FR', { month: 'short' });
    const satMonth = sat.toLocaleDateString('fr-FR', { month: 'short' });
    return `DU ${sun.getDate()} ${sunMonth.toUpperCase()} AU ${sat.getDate()} ${satMonth.toUpperCase()} ${sat.getFullYear()}`;
  };

  const formatMs = (ms: number) => {
    if (isNaN(ms) || ms < 0) return "0h 00m";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  };

  const processedData = useMemo(() => {
    const sortedLogs = [...logs].sort((a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp));
    const weeklyMap: Record<string, any> = {};
    const openPunches: Record<string, number> = {};

    sortedLogs.forEach(log => {
      const employee = log.employeeName;
      const user = users.find(u => u.name === employee);
      const group = user?.group || 'Non classé';
      const role = user?.role || 'user';
      const timestamp = log.timestamp;
      
      const dateParts = timestamp.split(/[ ,]+/)[0].split('/');
      const dateKey = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
      
      const isApproved = role === 'chauffeur' || approvals.some(a => a.employeeName === employee && a.date === dateKey && a.status === 'approved');

      if (!isApproved) return;

      const ms = parseTimestamp(timestamp);
      if (isNaN(ms) || ms === 0) return;

      const weekKey = getSundayKey(timestamp);
      const dateMapKey = timestamp.split(/[ ,]+/)[0];
      const timeStr = timestamp.split(/[ ,]+/)[1]?.slice(0, 5) || "--:--";

      if (!weeklyMap[weekKey]) weeklyMap[weekKey] = { totalMs: 0, groups: {} };
      if (!weeklyMap[weekKey].groups[group]) weeklyMap[weekKey].groups[group] = { totalMs: 0, employees: {} };
      
      if (!weeklyMap[weekKey].groups[group].employees[employee]) {
        weeklyMap[weekKey].groups[group].employees[employee] = { totalMs: 0, days: {}, role };
      }

      const empData = weeklyMap[weekKey].groups[group].employees[employee];
      if (!empData.days[dateMapKey]) {
        empData.days[dateMapKey] = { total: 0, sessions: [], lunchMins: 0 };
      }

      if (log.type === 'in') {
        openPunches[employee] = ms;
        empData.days[dateMapKey].sessions.push({ in: timeStr, out: null, project: log.plaque, inMs: ms });
      } else if (log.type === 'out') {
        if (openPunches[employee]) {
          const duration = ms - openPunches[employee];
          empData.totalMs += duration;
          empData.days[dateMapKey].total += duration;
          weeklyMap[weekKey].totalMs += duration;
          weeklyMap[weekKey].groups[group].totalMs += duration;
          
          if (log.lunchMinutes) {
            empData.days[dateMapKey].lunchMins = log.lunchMinutes;
          }

          const currentSession = empData.days[dateMapKey].sessions.find((s: any) => s.out === null);
          if (currentSession) {
            currentSession.out = timeStr;
            currentSession.duration = duration;
          }
          
          delete openPunches[employee];
        }
      }
    });

    // Ajuster le total avec le temps de dîner réel des enregistrements d'approbation
    Object.keys(weeklyMap).forEach(wk => {
      Object.keys(weeklyMap[wk].groups).forEach(grp => {
        Object.keys(weeklyMap[wk].groups[grp].employees).forEach(emp => {
          const e = weeklyMap[wk].groups[grp].employees[emp];
          let adjustedTotalWeek = 0;
          Object.keys(e.days).forEach(dKey => {
            const parts = dKey.split('/');
            const isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            const approval = approvals.find(a => a.employeeName === emp && a.date === isoDate);
            if (approval) {
              e.days[dKey].lunchMins = (approval.lunchMs || 0) / 60000;
              adjustedTotalWeek += approval.totalMs;
            } else {
              adjustedTotalWeek += (e.days[dKey].total - (e.days[dKey].lunchMins * 60000));
            }
          });
          e.totalMs = adjustedTotalWeek;
        });
      });
    });

    return weeklyMap;
  }, [logs, users, approvals]);

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (step === 'groups') {
    return (
      <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in duration-500">
        <div className="bg-black text-white p-6 shadow-md mb-8 border-b-4 border-[#76a73c] flex flex-col items-center text-center">
          <div className="w-full flex justify-start mb-6">
            <button onClick={onBack} className="flex items-center gap-1 text-[10px] font-black uppercase bg-white/10 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"><ArrowLeft className="w-3 h-3" /> Retour Consultation</button>
          </div>
          <Briefcase className="w-10 h-10 text-[#76a73c] mb-3" />
          <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none mb-2">Pointage Heures</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Choisir une Division</p>
        </div>

        <div className="px-5 space-y-4">
          <button 
            onClick={() => { setSelectedGroup('DDL Excavation'); setStep('weeks'); }}
            className="w-full group bg-white p-8 rounded-[3rem] border-2 border-slate-200 hover:border-black shadow-sm flex items-center justify-between transition-all active:scale-95"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                <HardHat className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-black text-black uppercase italic leading-none tracking-tight">DDL Excavation</h3>
                <p className="text-[10px] font-bold text-[#76a73c] uppercase mt-2">Division Chantier</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-black" />
          </button>

          <button 
            onClick={() => { setSelectedGroup('DDL Logistiques'); setStep('weeks'); }}
            className="w-full group bg-white p-8 rounded-[3rem] border-2 border-slate-200 hover:border-[#76a73c] shadow-sm flex items-center justify-between transition-all active:scale-95"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center justify-center group-hover:bg-[#76a73c] group-hover:text-white transition-all">
                <Truck className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-black text-black uppercase italic leading-none tracking-tight">DDL Logistiques</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Division Transport</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-black" />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'weeks' && selectedGroup) {
    const weeksWithData = Object.keys(processedData).filter(w => processedData[w].groups[selectedGroup]).sort((a, b) => b.localeCompare(a));

    return (
      <div className="bg-slate-50 min-h-screen pb-20 animate-in slide-in-from-right duration-300">
        <div className="bg-black text-white p-6 shadow-md mb-6 border-b-4 border-[#76a73c]">
          <button onClick={() => setStep('groups')} className="flex items-center gap-1 text-[10px] font-black uppercase bg-white/10 px-3 py-1.5 rounded-lg mb-6 active:scale-95 transition-transform"><ArrowLeft className="w-3 h-3" /> Retour Divisions</button>
          <div className="flex items-center gap-3 mb-2">
            <CalendarRange className="w-6 h-6 text-[#76a73c]" />
            <h2 className="text-xl font-black uppercase italic tracking-tighter leading-none">{selectedGroup}</h2>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Choisir une période</p>
        </div>
        <div className="px-4 space-y-3">
          {weeksWithData.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <History className="w-10 h-10 text-slate-200 mx-auto mb-3 opacity-20" />
              <p className="text-[10px] font-black text-slate-400 uppercase">Aucun pointage disponible pour ce groupe.</p>
            </div>
          ) : (
            weeksWithData.map(weekKey => (
              <button key={weekKey} onClick={() => { setSelectedWeek(weekKey); setStep('employees'); }} className="w-full bg-white p-6 rounded-3xl border-2 border-slate-200 hover:border-[#76a73c] flex items-center justify-between shadow-sm active:scale-95 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-[#76a73c]/10 transition-colors"><Calendar className="w-5 h-5 text-black" /></div>
                  <div className="text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1 block">Semaine</span>
                    <h3 className="text-sm font-black text-black uppercase italic">{formatWeekRange(weekKey)}</h3>
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

  if (step === 'employees' && selectedWeek && selectedGroup) {
    const groupData = processedData[selectedWeek]?.groups[selectedGroup];
    const employees = groupData ? Object.keys(groupData.employees).sort() : [];

    return (
      <div className="bg-slate-50 min-h-screen pb-20 animate-in slide-in-from-right duration-300">
        <div className="bg-black text-white p-6 shadow-md mb-6 border-b-4 border-[#76a73c]">
          <button onClick={() => setStep('weeks')} className="flex items-center gap-1 text-[10px] font-black uppercase bg-white/10 px-3 py-1.5 rounded-lg mb-6 active:scale-95 transition-transform"><ArrowLeft className="w-3 h-3" /> Retour périodes</button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#76a73c] p-3 rounded-2xl text-black">
                {selectedGroup === 'DDL Logistiques' ? <Truck className="w-6 h-6" /> : <HardHat className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-xl font-black uppercase italic tracking-tighter">{selectedGroup}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatWeekRange(selectedWeek)}</p>
              </div>
            </div>
            {groupData && (
              <div className="text-right">
                <div className="text-[8px] font-black text-[#76a73c] uppercase leading-none mb-1">Total Division</div>
                <div className="text-base font-black text-white font-mono">{formatMs(groupData.totalMs)}</div>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 space-y-3">
          {employees.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
               <User className="w-10 h-10 text-slate-100 mx-auto mb-3" />
               <p className="text-[10px] font-black text-slate-400 uppercase italic">Aucun pointage trouvé pour cette sélection.</p>
            </div>
          ) : (
            employees.map(emp => {
              const empData = groupData.employees[emp];
              return (
                <button 
                  key={emp} 
                  onClick={() => { setSelectedEmployee(emp); setStep('employee_history'); }} 
                  className="w-full bg-white p-5 rounded-3xl border-2 border-slate-200 hover:border-[#76a73c] flex items-center justify-between shadow-sm active:scale-95 group transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-[#76a73c]/10 text-black">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-black text-black uppercase italic">{emp}</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{empData.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-black text-[#76a73c] uppercase leading-none mb-1">Approuvé</div>
                    <div className="text-sm font-black text-black font-mono">{formatMs(empData.totalMs)}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  if (step === 'employee_history' && selectedWeek && selectedGroup && selectedEmployee) {
    const groupData = processedData[selectedWeek].groups[selectedGroup];
    const empData = groupData.employees[selectedEmployee];
    const daysKeys = Object.keys(empData.days).sort((a, b) => {
      const dateA = a.split(/[ /]+/).map(Number);
      const dateB = b.split(/[ /]+/).map(Number);
      return new Date(dateA[2], dateA[1] - 1, dateA[0]).getTime() - new Date(dateB[2], dateB[1] - 1, dateB[0]).getTime();
    });

    return (
      <div className="bg-slate-50 min-h-screen pb-20 animate-in slide-in-from-right duration-300">
        <div className="print:hidden">
          <div className="bg-black text-white p-6 shadow-md mb-6 border-b-4 border-[#76a73c]">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => setStep('employees')} className="flex items-center gap-1 text-[10px] font-black uppercase bg-white/10 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"><ArrowLeft className="w-3 h-3" /> Retour employés</button>
              <button 
                onClick={handlePrint} 
                className="flex items-center gap-2 text-[10px] font-black uppercase bg-[#76a73c] text-black px-4 py-2 rounded-xl shadow-lg active:scale-95 hover:bg-[#8bc546] transition-all"
              >
                <Printer className="w-4 h-4" /> Export Paie PDF
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-[#76a73c] p-3 rounded-2xl text-black"><User className="w-6 h-6" /></div>
                <div><h2 className="text-xl font-black uppercase italic tracking-tighter">{selectedEmployee}</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatWeekRange(selectedWeek)}</p></div>
              </div>
              <div className="text-right">
                <div className="text-[8px] font-black text-[#76a73c] uppercase mb-1">Total Semaine</div>
                <div className="text-lg font-black text-white font-mono leading-none">{formatMs(empData.totalMs)}</div>
              </div>
            </div>
          </div>

          <div className="px-4 space-y-6">
            {daysKeys.map(dateStr => {
              const day = empData.days[dateStr];
              return (
                <div key={dateStr} className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                     <h4 className="text-[11px] font-black text-black uppercase italic">{dateStr}</h4>
                     <div className="flex items-center gap-3">
                        {day.lunchMins > 0 && <span className="text-[9px] font-bold text-orange-500 uppercase">Dîner: {day.lunchMins}m</span>}
                        <span className="text-[10px] font-black text-[#76a73c]">{formatMs(day.total - (day.lunchMins * 60000))}</span>
                     </div>
                  </div>
                  <div className="p-5 space-y-4">
                    {day.sessions.map((session: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between">
                         <div className="flex items-center gap-6">
                           <div className="flex items-center gap-2">
                              <LogIn className="w-3.5 h-3.5 text-[#76a73c]" />
                              <span className="text-[11px] font-black text-black">{session.in}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <LogOut className="w-3.5 h-3.5 text-red-400" />
                              <span className="text-[11px] font-black text-black">{session.out || '--:--'}</span>
                           </div>
                         </div>
                         {session.project && (
                           <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                             <MapPin className="w-3 h-3 text-blue-600" />
                             <span className="text-[9px] font-black text-blue-700 uppercase">{session.project}</span>
                           </div>
                         )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* VERSION IMPRESSION PDF TRÈS CONDENSÉE */}
        <div className="hidden print:block p-4 bg-white text-black font-sans min-h-screen text-[9px] leading-tight">
          <div className="flex justify-between items-end border-b-4 border-black pb-2 mb-4">
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter leading-none text-black">
                GROUPE <span className="text-[#76a73c]">DDL</span>
              </h1>
              <p className="text-[8px] font-black uppercase tracking-[0.3em] mt-1 text-slate-400">FEUILLE DE TEMPS • LOGISTIQUE</p>
            </div>
            <div className="text-right">
              <div className="bg-black text-white px-3 py-1 mb-1 inline-block">
                <h2 className="text-[10px] font-black uppercase italic tracking-widest leading-none">RAPPORT DE PAIE</h2>
              </div>
              <p className="text-[8px] font-black uppercase text-slate-500">Document généré électroniquement</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-0 border-2 border-black mb-4">
            <div className="p-3 border-r-2 border-black">
               <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest block mb-0.5">Identification de l'employé</span>
               <div className="text-xl font-black uppercase italic tracking-tight">{selectedEmployee}</div>
               <div className="text-[8px] font-bold text-[#76a73c] uppercase mt-0.5">{selectedGroup} • {empData.role}</div>
            </div>
            <div className="bg-slate-50 p-3 flex flex-col justify-center items-end">
               <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest block mb-0.5">Total Semaine</span>
               <div className="flex items-baseline gap-2">
                  <div className="text-xl font-black text-black font-mono leading-none tracking-tighter">{formatMs(empData.totalMs)}</div>
                  <div className="text-[9px] font-black text-slate-300 uppercase">NET</div>
               </div>
               <div className="text-[8px] font-black text-slate-400 uppercase mt-1">
                  Période : {formatWeekRange(selectedWeek)}
               </div>
            </div>
          </div>

          <table className="w-full border-collapse text-[8px]">
            <thead>
              <tr className="bg-black text-white">
                <th className="p-1.5 text-left uppercase border-r border-white/20">Date / Journée</th>
                <th className="p-1.5 text-center uppercase border-r border-white/20">In</th>
                <th className="p-1.5 text-center uppercase border-r border-white/20">Out</th>
                <th className="p-1.5 text-center uppercase border-r border-white/20">Dîner</th>
                <th className="p-1.5 text-left uppercase border-r border-white/20">Projet</th>
                <th className="p-1.5 text-right uppercase">Total Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {daysKeys.map((dateStr, dIdx) => {
                const day = empData.days[dateStr];
                return day.sessions.map((session: any, sIdx: number) => (
                  <tr key={`${dateStr}-${sIdx}`} className={sIdx === 0 && dIdx > 0 ? 'border-t-2 border-black/5' : ''}>
                    <td className="p-1.5 font-black uppercase">{sIdx === 0 ? dateStr : ''}</td>
                    <td className="p-1.5 text-center font-mono">{session.in}</td>
                    <td className="p-1.5 text-center font-mono">{session.out || '--:--'}</td>
                    <td className="p-1.5 text-center text-orange-600">
                       {sIdx === 0 ? (day.lunchMins > 0 ? `${day.lunchMins}m` : '0m') : ''}
                    </td>
                    <td className="p-1.5 uppercase text-slate-500 text-[7px] truncate max-w-[100px]">
                      {session.project || 'GÉNÉRAL'}
                    </td>
                    <td className="p-1.5 text-right font-black font-mono bg-slate-50">
                       {sIdx === 0 ? formatMs(day.total - (day.lunchMins * 60000)) : (session.duration ? formatMs(session.duration) : '--:--')}
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>

          {/* RÉCAPITULATIF BAS DE PAGE CONDENSÉ */}
          <div className="mt-4 p-4 bg-slate-900 text-white flex justify-between items-center rounded-sm">
             <div className="text-[7px] font-black uppercase tracking-[0.2em] text-[#76a73c]">RÉSUMÉ HEBDOMADAIRE</div>
             <div className="flex gap-8">
                <div className="text-right">
                   <div className="text-[7px] font-black uppercase text-slate-500">Total Brut</div>
                   <div className="text-xs font-black font-mono">{formatMs(empData.totalMs + (Object.values(empData.days).reduce((acc: number, d: any) => acc + (d.lunchMins * 60000), 0) as number))}</div>
                </div>
                <div className="text-right">
                   <div className="text-[7px] font-black uppercase text-slate-500">Total Dîner</div>
                   <div className="text-xs font-black font-mono text-orange-400">-{formatMs(Object.values(empData.days).reduce((acc: number, d: any) => acc + (d.lunchMins * 60000), 0) as number)}</div>
                </div>
                <div className="text-right border-l border-white/10 pl-8">
                   <div className="text-[8px] font-black uppercase text-[#76a73c]">Net à Payer</div>
                   <div className="text-lg font-black font-mono">{formatMs(empData.totalMs)}</div>
                </div>
             </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-16">
             <div className="flex flex-col">
               <div className="h-8 border-b border-black"></div>
               <div className="mt-1 text-[7px] font-black uppercase text-slate-400 tracking-widest">Signature Employé</div>
             </div>
             <div className="flex flex-col text-right">
               <div className="h-8 border-b border-black"></div>
               <div className="mt-1 text-[7px] font-black uppercase text-slate-400 tracking-widest">Validation Direction</div>
             </div>
          </div>

          <div className="mt-4 text-center">
             <p className="text-[6px] font-black text-slate-300 uppercase tracking-[0.3em]">LOGIVRAC • GROUPE DDL EXCAVATION INC.</p>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              background: white !important;
            }
            @page {
              margin: 1cm;
            }
          }
        `}} />
      </div>
    );
  }

  return null;
};

export default PunchReportView;
