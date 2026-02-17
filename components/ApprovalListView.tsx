
import React from 'react';
import { ApprovalRecord } from '../types';
import { ArrowLeft, CheckCircle2, User, Calendar, Timer, ShieldCheck } from 'lucide-react';

interface Props {
  approvals: ApprovalRecord[];
  onBack: () => void;
}

const ApprovalListView: React.FC<Props> = ({ approvals, onBack }) => {
  const formatMs = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  };

  const sortedApprovals = [...approvals].sort((a, b) => b.approvalDate!.localeCompare(a.approvalDate!));

  return (
    <div className="p-4 space-y-6 animate-in slide-in-from-right duration-300">
      <button onClick={onBack} className="flex items-center gap-1 text-black font-black uppercase text-[10px] bg-slate-200 px-3 py-1.5 rounded-lg mb-4 active:scale-95 transition-transform">
        <ArrowLeft className="w-3 h-3" /> Retour Menu
      </button>

      <div className="bg-[#76a73c] p-6 rounded-3xl shadow-xl text-white border-b-4 border-black/20">
        <div className="flex items-center gap-3 mb-2">
           <CheckCircle2 className="w-8 h-8" />
           <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Heures Approuvées</h2>
        </div>
        <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Historique des validations</p>
      </div>

      <div className="space-y-3">
        {sortedApprovals.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-[10px] font-black text-slate-400 uppercase">Aucun historique d'approbation.</p>
          </div>
        ) : (
          sortedApprovals.map(app => (
            <div key={app.id} className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                   <User className="w-4 h-4 text-[#76a73c]" />
                   <span className="text-sm font-black text-black uppercase italic">{app.employeeName}</span>
                </div>
                <span className="text-[10px] font-black text-black font-mono bg-slate-100 px-2 py-1 rounded">{formatMs(app.totalMs)}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[9px] font-bold uppercase text-slate-400">
                <div className="flex items-center gap-1">
                   <Calendar className="w-3 h-3" /> Journée: <span className="text-black">{app.date}</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                   <ShieldCheck className="w-3 h-3 text-[#76a73c]" /> Approuvé par: <span className="text-black">{app.approverName}</span>
                </div>
              </div>

              <div className="text-center text-[8px] font-black text-slate-300 uppercase tracking-tighter">
                Validé le {app.approvalDate}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ApprovalListView;
