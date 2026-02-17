
import React, { useState, useMemo } from 'react';
import { BilletData, AppSettings } from '../types';
import { CheckCircle, ArrowLeft, Filter, FileText, ChevronRight, AlertCircle, Clock, MapPin, Edit, Save, X } from 'lucide-react';

interface Props {
  history: BilletData[];
  settings: AppSettings;
  onApprove: (id: string, updatedData?: Partial<BilletData>) => void;
  onBack: () => void;
}

const ReceptionView: React.FC<Props> = ({ history, settings, onApprove, onBack }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<BilletData>>({});

  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      if (filter === 'all') return true;
      return h.status === filter;
    });
  }, [history, filter]);

  const groupedByDestination = useMemo(() => {
    const groups: Record<string, BilletData[]> = {};
    filteredHistory.forEach(h => {
      const dest = h.destination === 'Autre' ? (h.destinationOther || 'Autre') : (h.destination || 'Non spécifiée');
      if (!groups[dest]) groups[dest] = [];
      groups[dest].push(h);
    });
    return groups;
  }, [filteredHistory]);

  const pendingCount = history.filter(h => h.status === 'pending').length;

  const startEditing = (billet: BilletData) => {
    setEditingId(billet.id);
    setEditForm({
      provenance: billet.provenance,
      plaque: billet.plaque,
      plaqueOther: billet.plaqueOther,
      typeSol: billet.typeSol,
      typeSolOther: billet.typeSolOther,
      quantite: billet.quantite,
      quantiteOther: billet.quantiteOther
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const saveAndApprove = (id: string) => {
    onApprove(id, editForm);
    setEditingId(null);
    setEditForm({});
  };

  return (
    <div className="p-4 space-y-6 animate-in slide-in-from-right duration-300">
      <button onClick={onBack} className="flex items-center gap-1 text-black font-black uppercase text-[10px] bg-slate-200 px-3 py-1.5 rounded-lg mb-4">
        <ArrowLeft className="w-3 h-3" /> Retour
      </button>

      <div className="bg-black p-6 rounded-3xl shadow-xl text-white border-b-4 border-[#76a73c]">
        <div className="flex items-center gap-3 mb-2">
           <CheckCircle className="w-8 h-8 text-[#76a73c]" />
           <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Réception Sols</h2>
        </div>
        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Vérification & Approbation</p>
      </div>

      <div className="flex bg-white p-1 rounded-2xl border-2 border-slate-200 shadow-sm">
        <button 
          onClick={() => setFilter('pending')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${filter === 'pending' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400'}`}
        >
          <Clock className="w-4 h-4" /> EN ATTENTE {pendingCount > 0 && `(${pendingCount})`}
        </button>
        <button 
          onClick={() => setFilter('approved')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${filter === 'approved' ? 'bg-[#76a73c] text-white shadow-md' : 'text-slate-400'}`}
        >
          <CheckCircle className="w-4 h-4" /> APPROUVÉS
        </button>
        <button 
          onClick={() => setFilter('all')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${filter === 'all' ? 'bg-black text-white shadow-md' : 'text-slate-400'}`}
        >
          <Filter className="w-4 h-4" /> TOUS
        </button>
      </div>

      <div className="space-y-8">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <AlertCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-[10px] font-black text-slate-400 uppercase">Aucun billet trouvé.</p>
          </div>
        ) : (
          Object.keys(groupedByDestination).sort().map(dest => (
            <div key={dest} className="space-y-3">
              <div className="flex items-center gap-2 border-b-2 border-slate-200 pb-1 px-1">
                <MapPin className="w-3.5 h-3.5 text-[#76a73c]" />
                <h3 className="text-[11px] font-black text-black uppercase italic tracking-tight">{dest}</h3>
                <span className="ml-auto text-[9px] font-black text-slate-300 uppercase">{groupedByDestination[dest].length} Billet(s)</span>
              </div>
              
              <div className="space-y-4">
                {groupedByDestination[dest].map(h => {
                  const isEditing = editingId === h.id;
                  return (
                    <div key={h.id} className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm space-y-4 hover:border-black transition-colors relative">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-100 p-2 rounded-xl">
                            <FileText className="w-5 h-5 text-black" />
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-[#76a73c] leading-none mb-1">{h.id}</div>
                            <div className="text-sm font-black text-black uppercase leading-none">{h.clientName}</div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase mt-1">{h.date} — {h.time}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className={`px-2 py-1 rounded text-[8px] font-black uppercase ${h.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                            {h.status === 'approved' ? 'REÇU' : 'EN ATTENTE'}
                          </div>
                          {h.status === 'pending' && !isEditing && (
                            <button 
                              onClick={() => startEditing(h)}
                              className="text-[#76a73c] flex items-center gap-1 text-[10px] font-bold uppercase hover:underline"
                            >
                              <Edit className="w-3 h-3" /> Modifier
                            </button>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="bg-slate-50 p-4 rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col">
                              <label className="text-[8px] font-black uppercase text-slate-400 mb-1">Provenance</label>
                              <select 
                                name="provenance" 
                                value={editForm.provenance} 
                                onChange={handleEditChange}
                                className="text-[10px] font-bold text-black bg-white border border-slate-200 p-2 rounded outline-none"
                              >
                                {settings.provenances.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                            <div className="flex flex-col">
                              <label className="text-[8px] font-black uppercase text-slate-400 mb-1">Camion / Plaque</label>
                              <input 
                                type="text" 
                                name="plaque" 
                                value={editForm.plaque === 'Autre' ? editForm.plaqueOther : editForm.plaque} 
                                onChange={(e) => setEditForm(prev => ({ ...prev, plaque: e.target.value }))}
                                className="text-[10px] font-bold text-black bg-white border border-slate-200 p-2 rounded outline-none"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col">
                              <label className="text-[8px] font-black uppercase text-slate-400 mb-1">Matériau</label>
                              <select 
                                name="typeSol" 
                                value={editForm.typeSol} 
                                onChange={handleEditChange}
                                className="text-[10px] font-bold text-black bg-white border border-slate-200 p-2 rounded outline-none"
                              >
                                {settings.typeSols.map(t => <option key={t} value={t}>{t}</option>)}
                                <option value="Autre">Autre</option>
                              </select>
                              {editForm.typeSol === 'Autre' && (
                                <input 
                                  type="text" 
                                  name="typeSolOther" 
                                  value={editForm.typeSolOther} 
                                  onChange={handleEditChange} 
                                  placeholder="Précisez..."
                                  className="mt-1 text-[10px] font-bold text-black bg-white border border-slate-200 p-2 rounded outline-none"
                                />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <label className="text-[8px] font-black uppercase text-slate-400 mb-1">Quantité (T)</label>
                              <input 
                                type="text" 
                                name="quantite" 
                                value={editForm.quantite === 'Autre' ? editForm.quantiteOther : editForm.quantite} 
                                onChange={(e) => setEditForm(prev => ({ ...prev, quantite: e.target.value }))}
                                className="text-[10px] font-bold text-black bg-white border border-slate-200 p-2 rounded outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                             <button onClick={cancelEditing} className="flex-1 py-2 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1">
                               <X className="w-3 h-3" /> Annuler
                             </button>
                             <button onClick={() => saveAndApprove(h.id)} className="flex-2 py-2 bg-[#76a73c] text-black rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1">
                               <Save className="w-3 h-3" /> Enregistrer & Approuver
                             </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase text-slate-600 bg-slate-50 p-3 rounded-xl">
                          <div><span className="opacity-50">Provenance:</span> {h.provenance}</div>
                          <div><span className="opacity-50">Plaque:</span> {h.plaque === 'Autre' ? h.plaqueOther : h.plaque}</div>
                          <div><span className="opacity-50">Matériau:</span> {h.typeSol === 'Autre' ? h.typeSolOther : h.typeSol}</div>
                          <div><span className="opacity-50">Quantité:</span> {h.quantite === 'Autre' ? h.quantiteOther : h.quantite} T</div>
                        </div>
                      )}

                      {h.status === 'pending' && !isEditing && (
                        <button 
                          onClick={() => onApprove(h.id)}
                          className="w-full py-3 bg-black text-white font-black uppercase italic rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                        >
                          <CheckCircle className="w-4 h-4 text-[#76a73c]" /> Approuver la réception
                        </button>
                      )}

                      {h.status === 'approved' && h.approvalDate && (
                        <div className="text-[8px] font-bold text-slate-400 uppercase text-center border-t border-slate-100 pt-2">
                          Approuvé le {h.approvalDate} par {h.approverName || 'un administrateur'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReceptionView;
