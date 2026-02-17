
import React, { useMemo, useState, useEffect } from 'react';
import { PunchLog, UserAccount, ApprovalRecord, UserRole } from '../types';
import { ArrowLeft, Clock, User, CheckCircle2, LogIn, LogOut, Timer, Coffee, MapPin, ChevronDown, ChevronRight, Edit3 } from 'lucide-react';

interface Props {
  logs: PunchLog[];
  users: UserAccount[];
  approvals: ApprovalRecord[];
  onApprove: (employeeName: string, date: string, totalMs: number, lunchMs?: number) => void;
  onBack: () => void;
  currentUser: UserAccount | null;
}

const ApprovalPendingView: React.FC<Props> = ({ logs, users, approvals, onApprove, onBack, currentUser }) => {
  const [lunchTimes, setLunchTimes] = useState<Record<string, number>>({});
  const [collapsedProvenances, setCollapsedProvenances] = useState<Record<string, boolean>>({});
  // État pour les modifications manuelles des heures
  const [timeOverrides, setTimeOverrides] = useState<Record<string, { in: string, out: string }>>({});

  const parseTimestamp = (ts: string) => {
    if (!ts) return 0;
    const [datePart, timePart] = ts.replace(',', '').trim().split(/\s+/);
    const [d, m, y] = datePart.split('/').map(Number);
    const [hh, mm] = timePart.split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm).getTime();
  };

  const timeToMs = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 3600 + m * 60) * 1000;
  };

  const formatMs = (ms: number) => {
    const totalMs = Math.max(0, ms);
    const h = Math.floor(totalMs / 3600000);
    const m = Math.floor((totalMs % 3600000) / 60000);
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  };

  const groupedPendingData = useMemo(() => {
    const sortedLogs = [...logs].sort((a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp));
    const dayGroups: Record<string, any> = {};
    const openPunches: Record<string, number> = {};

    const getAllowedRoles = (role: UserRole | undefined): UserRole[] => {
      const all: UserRole[] = ['chauffeur', 'mécano', 'manoeuvre', 'operateur', 'opérateur_cour', 'contremaitre', 'gestionnaire_cour', 'gestionnaire_mécano', 'gestionnaire_chauffeur', 'surintendant', 'chargée_de_projet', 'user', 'admin'];
      if (['admin', 'surintendant', 'chargée_de_projet'].includes(role || '')) return all;
      if (role === 'gestionnaire_cour') return ['opérateur_cour'];
      if (role === 'contremaitre') return ['operateur', 'manoeuvre'];
      if (role === 'gestionnaire_mécano') return ['mécano'];
      if (role === 'gestionnaire_chauffeur') return ['chauffeur'];
      return [];
    };

    const allowed = getAllowedRoles(currentUser?.role);

    sortedLogs.forEach(log => {
      const ms = parseTimestamp(log.timestamp);
      const parts = log.timestamp.split(/[ ,]+/)[0].split('/');
      const dateKey = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      const employee = log.employeeName;
      const user = users.find(u => u.name === employee);
      if (!user || !allowed.includes(user.role)) return;

      if (!dayGroups[dateKey]) dayGroups[dateKey] = {};
      if (!dayGroups[dateKey][employee]) dayGroups[dateKey][employee] = { total: 0, logs: [], declaredLunch: 0 };
      dayGroups[dateKey][employee].logs.push(log);

      if (log.type === 'in') openPunches[employee] = ms;
      else if (log.type === 'out' && openPunches[employee]) {
        dayGroups[dateKey][employee].total += (ms - openPunches[employee]);
        if (log.lunchMinutes !== undefined) dayGroups[dateKey][employee].declaredLunch = log.lunchMinutes * 60000;
        delete openPunches[employee];
      }
    });

    const groups: Record<string, any[]> = {};
    Object.keys(dayGroups).sort().reverse().forEach(date => {
      Object.keys(dayGroups[date]).forEach(emp => {
        if (approvals.some(a => a.employeeName === emp && a.date === date)) return;
        if (dayGroups[date][emp].total === 0) return;
        
        const firstInLog = dayGroups[date][emp].logs.find((l: any) => l.type === 'in');
        const lastOutLog = [...dayGroups[date][emp].logs].reverse().find((l: any) => l.type === 'out');
        const prov = firstInLog?.plaque || "NON SPÉCIFIÉ";
        
        if (!groups[prov]) groups[prov] = [];
        groups[prov].push({ 
          date, 
          employeeName: emp, 
          totalMs: dayGroups[date][emp].total, 
          declaredLunch: dayGroups[date][emp].declaredLunch, 
          role: users.find(u => u.name === emp)?.role,
          origIn: firstInLog?.timestamp.split(/[ ,]+/)[1]?.slice(0, 5) || '08:00',
          origOut: lastOutLog?.timestamp.split(/[ ,]+/)[1]?.slice(0, 5) || '17:00'
        });
      });
    });
    return groups;
  }, [logs, users, approvals, currentUser]);

  useEffect(() => {
    const initialL: Record<string, number> = {};
    const initialT: Record<string, { in: string, out: string }> = {};
    Object.values(groupedPendingData).flat().forEach((item: any) => {
      const key = `${item.employeeName}-${item.date}`;
      if (item.declaredLunch !== undefined && lunchTimes[key] === undefined) initialL[key] = item.declaredLunch;
      if (timeOverrides[key] === undefined) initialT[key] = { in: item.origIn, out: item.origOut };
    });
    if (Object.keys(initialL).length > 0) setLunchTimes(prev => ({ ...prev, ...initialL }));
    if (Object.keys(initialT).length > 0) setTimeOverrides(prev => ({ ...prev, ...initialT }));
  }, [groupedPendingData]);

  const handleTimeChange = (key: string, field: 'in' | 'out', val: string) => {
    setTimeOverrides(prev => ({
        ...prev,
        [key]: { ...prev[key], [field]: val }
    }));
  };

  const sortedProvenances = Object.keys(groupedPendingData).sort();

  return (
    <div className="p-4 space-y-6 animate-in slide-in-from-right duration-300">
      <button onClick={onBack} className="flex items-center gap-1 text-[10px] font-black uppercase bg-slate-200 px-3 py-1.5 rounded-lg mb-4 active:scale-95 transition-transform">
        <ArrowLeft className="w-3 h-3" /> Retour Menu
      </button>

      <div className="bg-orange-500 p-6 rounded-3xl shadow-xl text-white border-b-4 border-black/20">
        <Clock className="w-8 h-8 mb-2" />
        <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">En attente d'approbation</h2>
        <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mt-1">Validez ou corrigez les sessions</p>
      </div>

      <div className="space-y-6">
        {sortedProvenances.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-[10px] font-black text-slate-400 uppercase">Rien à approuver pour le moment.</p>
          </div>
        ) : sortedProvenances.map(prov => (
          <div key={prov} className="space-y-3">
            <button onClick={() => setCollapsedProvenances(prev => ({ ...prev, [prov]: !prev[prov] }))} className="w-full flex items-center justify-between bg-black text-white px-5 py-4 rounded-2xl shadow-md border-l-4 border-[#76a73c]">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#76a73c]" />
                <h3 className="text-sm font-black uppercase italic tracking-tight">{prov}</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-[#76a73c] text-black text-[10px] font-black px-2 py-0.5 rounded-lg">{groupedPendingData[prov].length}</span>
                {collapsedProvenances[prov] ? <ChevronRight /> : <ChevronDown />}
              </div>
            </button>

            {!collapsedProvenances[prov] && groupedPendingData[prov].map((item, idx) => {
              const key = `${item.employeeName}-${item.date}`;
              const currentLunch = lunchTimes[key] !== undefined ? lunchTimes[key] : item.declaredLunch;
              const overrides = timeOverrides[key] || { in: item.origIn, out: item.origOut };
              
              // Recalcul de la durée basée sur l'overide s'il existe
              const totalMs = timeToMs(overrides.out) - timeToMs(overrides.in);
              const netTotal = totalMs - currentLunch;

              return (
                <div key={idx} className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm space-y-5 hover:border-orange-500 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-100 p-3 rounded-2xl text-black">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-black uppercase italic text-black leading-none">{item.employeeName}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{item.date} — {item.role}</p>
                        
                        <div className="flex gap-4 mt-3">
                            <div className="flex flex-col">
                                <label className="text-[8px] font-black text-slate-400 uppercase">In</label>
                                <input 
                                    type="time" 
                                    value={overrides.in} 
                                    onChange={(e) => handleTimeChange(key, 'in', e.target.value)}
                                    className="text-[11px] font-black bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-black"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[8px] font-black text-slate-400 uppercase">Out</label>
                                <input 
                                    type="time" 
                                    value={overrides.out} 
                                    onChange={(e) => handleTimeChange(key, 'out', e.target.value)}
                                    className="text-[11px] font-black bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-black"
                                />
                            </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-black text-orange-500 uppercase leading-none">Total Net</div>
                      <div className="text-lg font-black font-mono text-black leading-none mt-1">{formatMs(netTotal)}</div>
                      {currentLunch > 0 && (
                          <div className="text-[8px] font-bold text-slate-300 uppercase mt-1">Dîner: -{currentLunch/60000}m</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Coffee className="w-3 h-3 text-orange-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase">Ajuster Dîner (Déclaré: {item.declaredLunch / 60000}m) :</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 30, 45, 60].map(m => (
                        <button key={m} onClick={() => setLunchTimes(prev => ({ ...prev, [key]: m * 60000 }))} className={`py-2 rounded-xl text-[10px] font-black transition-all border-2 ${currentLunch === m * 60000 ? 'bg-black text-orange-500 border-black shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}>
                          {m} min
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => onApprove(item.employeeName, item.date, netTotal, currentLunch)} 
                    className="w-full py-4 bg-orange-500 text-white font-black uppercase italic rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform hover:bg-orange-600"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Approuver cette journée
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApprovalPendingView;
