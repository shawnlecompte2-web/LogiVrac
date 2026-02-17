
import React from 'react';
import { ViewMode } from '../types';
import { ArrowLeft, Clock, CheckCircle2, ChevronRight, UserCheck, BarChart3 } from 'lucide-react';

interface Props {
  onBack: () => void;
  onNavigate: (view: ViewMode) => void;
}

const ApprovalMenuView: React.FC<Props> = ({ onBack, onNavigate }) => {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <button onClick={onBack} className="flex items-center gap-1 text-black font-black uppercase text-[10px] bg-slate-200 px-3 py-1.5 rounded-lg mb-4 active:scale-95 transition-transform">
        <ArrowLeft className="w-3 h-3" /> Retour Accueil
      </button>

      <div className="text-center mb-8">
        <div className="bg-orange-500 p-4 rounded-3xl text-white inline-block shadow-lg mb-3">
          <UserCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black uppercase italic text-black tracking-tighter leading-none">Gestion des Heures</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Validation des pointages terrain</p>
      </div>

      <div className="grid gap-4">
        <button 
          onClick={() => onNavigate('approval_pending')} 
          className="w-full bg-white p-6 rounded-[2.5rem] border-2 border-slate-200 hover:border-orange-500 shadow-sm flex items-center justify-between transition-all active:scale-95 group"
        >
          <div className="flex items-center gap-5">
            <div className="bg-orange-100 p-4 rounded-2xl text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <Clock className="w-7 h-7" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-black text-black uppercase italic leading-none">En attente</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Heures à approuver</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-black" />
        </button>

        <button 
          onClick={() => onNavigate('approval_list')} 
          className="w-full bg-white p-6 rounded-[2.5rem] border-2 border-slate-200 hover:border-[#76a73c] shadow-sm flex items-center justify-between transition-all active:scale-95 group"
        >
          <div className="flex items-center gap-5">
            <div className="bg-green-100 p-4 rounded-2xl text-[#76a73c] group-hover:bg-[#76a73c] group-hover:text-white transition-colors">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-black text-black uppercase italic leading-none">Approuvé</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Consulter l'historique</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-black" />
        </button>

        <button 
          onClick={() => onNavigate('approval_summary')} 
          className="w-full bg-white p-6 rounded-[2.5rem] border-2 border-slate-200 hover:border-blue-600 shadow-sm flex items-center justify-between transition-all active:scale-95 group"
        >
          <div className="flex items-center gap-5">
            <div className="bg-blue-100 p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-black text-black uppercase italic leading-none">Totale</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Récapitulatif par Projet</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-black" />
        </button>
      </div>
    </div>
  );
};

export default ApprovalMenuView;
