
import React, { useState, useEffect, useMemo } from 'react';
import { AppSettings, PunchLog, UserAccount, BilletData } from '../types';
import { Clock, ArrowLeft, CheckCircle2, LogIn, LogOut, Search, Truck, Timer, Layers, User as UserIcon, ClipboardList, ChevronDown, MapPin, Coffee, Activity, Weight, Users } from 'lucide-react';

interface Props {
  settings: AppSettings;
  logs: PunchLog[];
  history: BilletData[];
  onPunch: (log: PunchLog) => void;
  onBack: () => void;
  currentUser: UserAccount | null;
}

const PunchView: React.FC<Props> = ({ settings, logs, history, onPunch, onBack, currentUser }) => {
  const canSelectOthers = currentUser?.name === 'Shawn Lecompte' || 
    ['admin', 'surintendant', 'chargée_de_projet'].includes(currentUser?.role || '');
  
  const [selectedEmployee, setSelectedEmployee] = useState(currentUser?.name || '');
  const [search, setSearch] = useState('');
  const [plaque, setPlaque] = useState('');
  const [lunchMinutes, setLunchMinutes] = useState(30);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const parseDate = (str: string) => {
    const parts = str.replace(',', '').trim().split(/\s+/);
    if (parts.length < 2) return 0;
    const [d, m, y] = parts[0].split('/').map(Number);
    const [h, min, s] = parts[1].split(':').map(Number);
    return new Date(y, m - 1, d, h || 0, min || 0, s || 0).getTime();
  };

  const isPunchOnly = currentUser?.permissions.length === 1 && currentUser.permissions[0] === 'punch';
  const punchableUsers = settings.users.filter(u => u.permissions.includes('punch'));
  
  const filteredEmployees = useMemo(() => {
    if (!search) return [];
    return punchableUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));
  }, [search, punchableUsers]);

  const punchingUser = useMemo(() => settings.users.find(u => u.name === selectedEmployee), [settings.users, selectedEmployee]);
  const role = punchingUser?.role;
  const isPlaqueRole = role === 'chauffeur' || role === 'gestionnaire_chauffeur';
  const isNoInputRole = role === 'mécano' || role === 'gestionnaire_mécano';
  const showProductionStats = role === 'chauffeur' || role === 'gestionnaire_chauffeur';

  // Liste des employés actuellement pointés "IN" aujourd'hui
  const activeUsers = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('fr-FR');
    const statusMap: Record<string, { type: 'in' | 'out', time: string, plaque?: string }> = {};
    
    [...logs].sort((a, b) => parseDate(a.timestamp) - parseDate(b.timestamp)).forEach(log => {
      if (log.timestamp.includes(todayStr)) {
        statusMap[log.employeeName] = { 
          type: log.type, 
          time: log.timestamp.split(/[ ,]+/)[1]?.slice(0, 5),
          plaque: log.plaque
        };
      }
    });

    return Object.entries(statusMap)
      .filter(([_, data]) => data.type === 'in')
      .map(([name, data]) => {
        const u = settings.users.find(user => user.name === name);
        return { name, ...data, role: u?.role || 'user' };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [logs, settings.users]);

  // Identifier la plaque active pour l'employé sélectionné (basé sur son dernier Punch In aujourd'hui)
  const activePlaque = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('fr-FR');
    const userLogs = logs.filter(l => l.employeeName === selectedEmployee && l.timestamp.includes(todayStr));
    const sorted = [...userLogs].sort((a, b) => parseDate(b.timestamp) - parseDate(a.timestamp));
    const lastIn = sorted.find(l => l.type === 'in');
    return lastIn?.plaque;
  }, [logs, selectedEmployee]);

  // Calcul approfondi de la production basé sur la PLAQUE pour les chauffeurs
  const dailyProduction = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const userBillets = history.filter(b => {
      const isToday = b.date === todayStr;
      if (!isToday) return false;

      if (isPlaqueRole && activePlaque) {
        const bPlaque = (b.plaque === 'Autre' ? b.plaqueOther : b.plaque)?.trim().toUpperCase();
        const aPlaque = activePlaque.trim().toUpperCase();
        return bPlaque === aPlaque;
      }
      
      return b.issuerName === selectedEmployee;
    });
    
    const materials: Record<string, { tons: number; trips: number }> = {};
    let totalTons = 0;

    userBillets.forEach(b => {
      const mat = b.typeSol === 'Autre' ? (b.typeSolOther || 'Autre') : (b.typeSol || 'Inconnu');
      const tons = parseFloat(b.quantite === 'Autre' ? (b.quantiteOther || '0') : (b.quantite || '0')) || 0;
      if (!materials[mat]) {
        materials[mat] = { tons: 0, trips: 0 };
      }
      materials[mat].tons += tons;
      materials[mat].trips += 1;
      totalTons += tons;
    });

    return {
      trips: userBillets.length,
      totalTons,
      materials
    };
  }, [history, selectedEmployee, isPlaqueRole, activePlaque]);

  const dailyWorkDuration = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('fr-FR');
    const userLogs = logs.filter(l => l.employeeName === selectedEmployee && l.timestamp.includes(todayStr));
    
    const sortedLogs = [...userLogs].sort((a, b) => parseDate(a.timestamp) - parseDate(b.timestamp));
    let totalMs = 0;
    let currentInTime: number | null = null;

    sortedLogs.forEach(log => {
      const logMs = parseDate(log.timestamp);
      if (log.type === 'in') currentInTime = logMs;
      else if (log.type === 'out' && currentInTime !== null) {
        totalMs += (logMs - currentInTime);
        currentInTime = null;
      }
    });

    if (currentInTime !== null) totalMs += (currentTime.getTime() - currentInTime);

    const seconds = Math.floor((totalMs / 1000) % 60);
    const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
    const hours = Math.floor((totalMs / (1000 * 60 * 60)));

    return {
      formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      isActive: currentInTime !== null
    };
  }, [logs, selectedEmployee, currentTime]);

  const handlePunch = (type: 'in' | 'out') => {
    if (!selectedEmployee) return;
    const newLog: PunchLog = {
      id: `PUNCH-${Date.now()}`,
      employeeName: selectedEmployee,
      type,
      timestamp: new Date().toLocaleString('fr-FR'),
      plaque: type === 'in' ? plaque : undefined,
      lunchMinutes: type === 'out' ? lunchMinutes : undefined
    };
    onPunch(newLog);
    setPlaque('');
  };

  const LUNCH_OPTIONS = [
    { label: '0 min', value: 0 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '60 min', value: 60 }
  ];

  return (
    <div className="p-4 space-y-6 animate-in slide-in-from-right duration-300 pb-20">
      {!isPunchOnly && (
        <button onClick={onBack} className="flex items-center gap-1 text-black font-black uppercase text-[10px] bg-slate-200 px-3 py-1.5 rounded-lg mb-4">
          <ArrowLeft className="w-3 h-3" /> Retour
        </button>
      )}

      {canSelectOthers && selectedEmployee !== currentUser?.name && (
        <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-2xl shadow-sm animate-in slide-in-from-left duration-300">
          <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Employé sélectionné</div>
          <div className="text-base font-black text-blue-900 uppercase italic leading-none">{selectedEmployee}</div>
          {activePlaque && <div className="text-[10px] font-black text-[#76a73c] uppercase mt-1 italic">Camion: {activePlaque}</div>}
        </div>
      )}

      <div className={`grid grid-cols-2 gap-3`}>
        <div className={`p-5 rounded-3xl shadow-xl flex flex-col justify-between transition-colors duration-500 ${dailyWorkDuration.isActive ? 'bg-[#76a73c] text-white' : 'bg-white text-black border-2 border-slate-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Timer className={`w-4 h-4 ${dailyWorkDuration.isActive ? 'text-white' : 'text-[#76a73c]'}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${dailyWorkDuration.isActive ? 'text-white/70' : 'text-slate-400'}`}>Travail</span>
          </div>
          <div className="text-2xl font-black font-mono tracking-tighter leading-none">{dailyWorkDuration.formatted}</div>
          <div className={`text-[8px] font-black uppercase mt-2 ${dailyWorkDuration.isActive ? 'text-white/80 animate-pulse' : 'text-slate-300'}`}>
            {dailyWorkDuration.isActive ? 'Session Active' : 'Pause'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Voyages</span>
          </div>
          <div className="text-2xl font-black text-black tracking-tighter leading-none">{dailyProduction.trips || 0}</div>
          <div className="text-[8px] font-black text-slate-300 uppercase mt-2">Total {activePlaque ? activePlaque : "Aujourd'hui"}</div>
        </div>
      </div>

      {showProductionStats && (
        <div className="bg-white p-5 rounded-[2.5rem] border-2 border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-500">
           <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="w-4 h-4 text-[#76a73c]" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Résumé de Production du Jour</h3>
           </div>
           
           {!activePlaque && dailyWorkDuration.isActive && (
              <div className="text-[9px] font-black text-orange-600 bg-orange-50 p-2 rounded-lg border border-orange-200 animate-pulse">
                Note: Aucune plaque n'a été enregistrée pour cette session. Les stats de voyages pourraient être incomplètes.
              </div>
           )}
           
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl">
                 <div className="flex items-center gap-1.5 mb-1.5">
                    <Weight className="w-3 h-3 text-[#76a73c]" />
                    <span className="text-[8px] font-black text-slate-400 uppercase">Tonnage</span>
                 </div>
                 <div className="text-xl font-black text-black leading-none">{dailyProduction.totalTons.toLocaleString()} T</div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-2xl">
                 <div className="flex items-center gap-1.5 mb-2 border-b border-slate-200 pb-1">
                    <Layers className="w-3 h-3 text-blue-500" />
                    <span className="text-[8px] font-black text-slate-400 uppercase">Matériaux (V / T)</span>
                 </div>
                 <div className="space-y-1.5 max-h-20 overflow-y-auto pr-1">
                    {Object.keys(dailyProduction.materials).length === 0 ? (
                      <div className="text-[9px] font-bold text-slate-300 italic uppercase">Aucun bon</div>
                    ) : (
                      Object.entries(dailyProduction.materials).map(([mat, data]) => (
                        <div key={mat} className="flex justify-between items-center text-[9px] font-black uppercase tracking-tight">
                           <span className="text-slate-500 truncate mr-1.5">{mat}</span>
                           <span className="text-black shrink-0">
                             <span className="text-[#76a73c]">{data.trips}V</span> / {data.tons}T
                           </span>
                        </div>
                      ))
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4">
        {canSelectOthers && (
          <div className="space-y-4">
            <div className="text-[10px] font-black text-blue-600 uppercase italic px-1">Superviseur : Sélection d'employé active</div>
            
            {/* Liste des employés actifs (PUNCHED IN) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Activity className="w-3 h-3 text-[#76a73c] animate-pulse" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Personnel Actif sur le terrain ({activeUsers.length})</span>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {activeUsers.length === 0 ? (
                  <div className="text-[9px] font-bold text-slate-300 uppercase italic px-1 py-2">Aucun employé actif.</div>
                ) : (
                  activeUsers.map(user => (
                    <button 
                      key={user.name} 
                      onClick={() => setSelectedEmployee(user.name)}
                      className={`flex-shrink-0 min-w-[120px] p-3 rounded-2xl border-2 transition-all text-left ${selectedEmployee === user.name ? 'bg-black border-black text-[#76a73c] shadow-lg' : 'bg-slate-50 border-slate-100 text-black'}`}
                    >
                      <div className="text-[10px] font-black truncate uppercase leading-none mb-1">{user.name}</div>
                      <div className="flex items-center justify-between">
                         <span className={`text-[7px] font-bold uppercase ${selectedEmployee === user.name ? 'text-[#76a73c]/60' : 'text-slate-400'}`}>{user.role}</span>
                         <span className={`text-[7px] font-black font-mono ${selectedEmployee === user.name ? 'text-[#76a73c]' : 'text-[#76a73c]'}`}>IN: {user.time}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Rechercher un employé..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm text-black" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            {search.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-2 p-1 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                {filteredEmployees.map(u => (
                  <button key={u.id} onClick={() => { setSelectedEmployee(u.name); setSearch(''); }} className={`w-full text-left px-4 py-3 rounded-lg font-black text-[11px] uppercase transition-all flex items-center justify-between ${selectedEmployee === u.name ? 'bg-black text-[#76a73c] shadow-md' : 'bg-white text-black border border-slate-100 hover:bg-slate-50'}`}>
                    <span>{u.name}</span>
                    <span className="text-[8px] opacity-40">{u.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 pt-2">
          {!dailyWorkDuration.isActive ? (
            !isNoInputRole && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">{isPlaqueRole ? "Numéro de Plaque" : "Provenance"}</label>
                <div className="flex items-center gap-3 bg-white border-2 border-slate-200 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-colors">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  {isPlaqueRole ? <input type="text" value={plaque} placeholder="EX: L-12345" onChange={(e) => setPlaque(e.target.value.toUpperCase())} className="w-full bg-transparent font-black text-black outline-none" /> : 
                    <select value={plaque} onChange={(e) => setPlaque(e.target.value)} className="w-full bg-transparent font-black text-black outline-none appearance-none">
                      <option value="">Choisir...</option>
                      {settings.provenances.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  }
                </div>
              </div>
            )
          ) : (
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 space-y-3">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-black uppercase text-orange-800 italic">Temps de dîner aujourd'hui</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {LUNCH_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setLunchMinutes(opt.value)} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${lunchMinutes === opt.value ? 'bg-black text-orange-500 border-black shadow-lg' : 'bg-white text-slate-400 border-slate-200'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handlePunch('in')} disabled={dailyWorkDuration.isActive || !selectedEmployee} className={`p-6 rounded-2xl font-black uppercase flex flex-col items-center gap-2 shadow-lg active:scale-95 transition-all ${dailyWorkDuration.isActive || !selectedEmployee ? 'bg-slate-100 text-slate-300' : 'bg-green-500 text-white'}`}><LogIn className="w-8 h-8" />Punch In</button>
            <button onClick={() => handlePunch('out')} disabled={!dailyWorkDuration.isActive || !selectedEmployee} className={`p-6 rounded-2xl font-black uppercase flex flex-col items-center gap-2 shadow-lg active:scale-95 transition-all ${!dailyWorkDuration.isActive || !selectedEmployee ? 'bg-slate-100 text-slate-300' : 'bg-red-500 text-white'}`}><LogOut className="w-8 h-8" />Punch Out</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PunchView;
