
import React, { useMemo, useState } from 'react';
import { PunchLog, UserAccount, ApprovalRecord, UserRole } from '../types';
import { ArrowLeft, Clock, User, LogIn, LogOut, Timer, Coffee, MapPin, ChevronDown, ChevronRight, Calendar, BarChart3 } from 'lucide-react';

interface Props {
  logs: PunchLog[];
  users: UserAccount[];
  approvals: ApprovalRecord[];
  onBack: () => void;
  currentUser: UserAccount | null;
}

const ApprovalSummaryView: React.FC<Props> = ({ logs, users, approvals, onBack, currentUser }) => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  const parseTimestamp = (ts: string) => {
    if (!ts) return 0;
    const [datePart, timePart] = ts.replace(',', '').trim().split(/\s+/);
    const [d, m, y] = datePart.split('/').map(Number);
    const [hh, mm] = timePart.split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm).getTime();
  };

  const getSundayKey = (dateStr: string) => {
    const [d, m, y] = dateStr.split('/').map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0);
    const day = date.getDay();
    const diff = date.getDate() - day;
    const sunday = new Date(date.setDate(diff));
    return sunday.toISOString().split('T')[0];
  };

  const formatWeekRange = (sundayKey: string) => {
    const sun = new Date(sundayKey + 'T12:00:00');
    const sat = new Date(new Date(sun).setDate(sun.getDate() + 6));
    return `Du ${sun.getDate()} ${sun.toLocaleDateString('fr-FR', { month: 'short' })} au ${sat.getDate()} ${sat.toLocaleDateString('fr-FR', { month: 'short' })} ${sat.getFullYear()}`;
  };

  const formatMs = (ms: number) => {
    const totalMs = Math.max(0, ms);
    const h = Math.floor(totalMs / 3600000);
    const m = Math.floor((totalMs % 3600000) / 60000);
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  };

  // Groupement hiérarchique : Projet -> Semaine -> Registres
  const summaryData = useMemo(() => {
    const data: Record<string, Record<string, any[]>> = {};

    const getAllowedRolesToApprove = (role: UserRole | undefined): UserRole[] => {
      if (!role) return [];
      const allRoles: UserRole[] = [
        'chauffeur', 'mécano', 'manoeuvre', 'operateur', 'opérateur_cour', 
        'contremaitre', 'gestionnaire_cour', 'gestionnaire_mécano', 'gestionnaire_chauffeur', 
        'surintendant', 'chargée_de_projet', 'user', 'admin'
      ];

      if (['admin', 'surintendant', 'chargée_de_projet'].includes(role)) return allRoles;
      if (role === 'gestionnaire_cour') return ['opérateur_cour'];
      if (role === 'contremaitre') return ['operateur', 'manoeuvre'];
      if (role === 'gestionnaire_mécano') return ['mécano'];
      if (role === 'gestionnaire_chauffeur') return ['chauffeur'];
      return [];
    };

    const allowedRoles = getAllowedRolesToApprove(currentUser?.role);

    // On ne traite que les pointages approuvés du personnel autorisé
    approvals.forEach(approval => {
      const employee = approval.employeeName;
      const user = users.find(u => u.name === employee);
      if (!user || !allowedRoles.includes(user.role)) return;

      const dateParts = approval.date.split('-');
      const dateStr = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
      const dayLogs = logs.filter(l => l.employeeName === employee && l.timestamp.startsWith(dateStr));
      
      const firstIn = dayLogs.find(l => l.type === 'in');
      const lastOut = [...dayLogs].reverse().find(l => l.type === 'out');
      const project = firstIn?.plaque || "NON SPÉCIFIÉ";
      const weekKey = getSundayKey(dateStr);

      if (!data[project]) data[project] = {};
      if (!data[project][weekKey]) data[project][weekKey] = [];

      data[project][weekKey].push({
        ...approval,
        arrival: firstIn ? firstIn.timestamp.split(/[ ,]+/)[1]?.slice(0, 5) : '--:--',
        departure: lastOut ? lastOut.timestamp.split(/[ ,]+/)[1]?.slice(0, 5) : '--:--',
        role: user?.role
      });
    });

    return data;
  }, [logs, users, approvals, currentUser]);

  const projects = Object.keys(summaryData).sort();

  if (selectedProject && selectedWeek) {
    const records = summaryData[selectedProject][selectedWeek].sort((a, b) => a.date.localeCompare(b.date));
    const weeklyTotalMs = records.reduce((acc, curr) => acc + curr.totalMs, 0);

    return (
      <div className="p-4 space-y-6 animate-in slide-in-from-right duration-300">
        <button onClick={() => setSelectedWeek(null)} className="flex items-center gap-1 text-black font-black uppercase text-[10px] bg-slate-200 px-3 py-1.5 rounded-lg active:scale-95">
          <ArrowLeft className="w-3 h-3" /> Retour semaines
        </button>

        <div className="bg-black text-white p-6 rounded-3xl border-l-4 border-blue-600 shadow-xl">
           <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedProject}</span>
           </div>
           <h2 className="text-xl font-black uppercase italic tracking-tighter">{formatWeekRange(selectedWeek)}</h2>
           <div className="mt-4 flex justify-between items-end">
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Total approuvé semaine</span>
              <span className="text-2xl font-black font-mono text-white leading-none">{formatMs(weeklyTotalMs)}</span>
           </div>
        </div>

        <div className="space-y-4">
           {records.map((rec, i) => (
             <div key={i} className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm space-y-3">
               <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                 <div>
                   <h3 className="text-sm font-black text-black uppercase italic leading-none">{rec.employeeName}</h3>
                   <span className="text-[9px] font-bold text-slate-400 uppercase">{rec.date} — {rec.role}</span>
                 </div>
                 <div className="text-right">
                   <div className="text-[10px] font-black text-black font-mono">{formatMs(rec.totalMs)}</div>
                   <div className="text-[8px] font-bold text-slate-300 uppercase">Total Jour</div>
                 </div>
               </div>
               
               <div className="grid grid-cols-3 gap-2">
                 <div className="bg-slate-50 p-2 rounded-xl text-center">
                   <div className="text-[7px] font-black text-slate-400 uppercase mb-1">Arrivée</div>
                   <div className="text-[10px] font-black text-black">{rec.arrival}</div>
                 </div>
                 <div className="bg-slate-50 p-2 rounded-xl text-center">
                   <div className="text-[7px] font-black text-slate-400 uppercase mb-1">Départ</div>
                   <div className="text-[10px] font-black text-black">{rec.departure}</div>
                 </div>
                 <div className="bg-orange-50 p-2 rounded-xl text-center">
                   <div className="text-[7px] font-black text-orange-400 uppercase mb-1">Dîner</div>
                   <div className="text-[10px] font-black text-orange-600">{rec.lunchMs ? `${rec.lunchMs / 60000}m` : '0m'}</div>
                 </div>
               </div>
             </div>
           ))}
        </div>
      </div>
    );
  }

  if (selectedProject) {
    const weeks = Object.keys(summaryData[selectedProject]).sort((a, b) => b.localeCompare(a));
    return (
      <div className="p-4 space-y-6 animate-in slide-in-from-right duration-300">
        <button onClick={() => setSelectedProject(null)} className="flex items-center gap-1 text-black font-black uppercase text-[10px] bg-slate-200 px-3 py-1.5 rounded-lg active:scale-95">
          <ArrowLeft className="w-3 h-3" /> Retour projets
        </button>

        <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl border-b-4 border-black/20">
           <div className="text-[10px] font-black text-white/70 uppercase mb-1 tracking-widest">Récapitulatif Projet</div>
           <h2 className="text-2xl font-black uppercase italic tracking-tighter">{selectedProject}</h2>
        </div>

        <div className="space-y-3">
          {weeks.map(weekKey => (
            <button
              key={weekKey}
              onClick={() => setSelectedWeek(weekKey)}
              className="w-full bg-white p-5 rounded-3xl border-2 border-slate-200 hover:border-blue-600 flex items-center justify-between shadow-sm active:scale-95 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-blue-50 text-black">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Période</div>
                  <div className="text-sm font-black text-black uppercase italic">{formatWeekRange(weekKey)}</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-black" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-in slide-in-from-right duration-300">
      <button onClick={onBack} className="flex items-center gap-1 text-black font-black uppercase text-[10px] bg-slate-200 px-3 py-1.5 rounded-lg mb-4 active:scale-95">
        <ArrowLeft className="w-3 h-3" /> Retour Menu
      </button>

      <div className="bg-black text-white p-6 rounded-3xl shadow-xl border-b-4 border-blue-600">
        <div className="flex items-center gap-3 mb-2">
           <BarChart3 className="w-8 h-8 text-blue-500" />
           <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Totale par Projet</h2>
        </div>
        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
           {['admin', 'surintendant', 'chargée_de_projet'].includes(currentUser?.role || '') ? "Personnel Global" : "Personnel sous votre gestion"}
        </p>
      </div>

      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3 opacity-20" />
            <p className="text-[10px] font-black text-slate-400 uppercase">Aucune donnée approuvée disponible.</p>
          </div>
        ) : (
          projects.map(proj => (
            <button
              key={proj}
              onClick={() => setSelectedProject(proj)}
              className="w-full bg-white p-6 rounded-[2.5rem] border-2 border-slate-200 hover:border-blue-600 shadow-sm flex items-center justify-between transition-all active:scale-95 group"
            >
              <div className="flex items-center gap-5">
                <div className="bg-slate-50 p-4 rounded-2xl text-black group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <MapPin className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-black text-black uppercase italic leading-none">{proj}</h3>
                  <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                    {Object.keys(summaryData[proj]).length} Semaine(s) active(s)
                  </div>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-black" />
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ApprovalSummaryView;
