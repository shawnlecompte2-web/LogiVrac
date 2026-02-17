
import React, { useState } from 'react';
import { BilletData, AppSettings } from '../types';
import { Calendar, Clock, User, Truck, MapPin, Layers, Weight, Save, ChevronDown, Plus, Check, X, ShieldCheck, Trash2, Edit3 } from 'lucide-react';

interface Props {
  data: BilletData;
  settings: AppSettings;
  onSave: (data: BilletData) => void;
  onAddSettingOption: (key: keyof Omit<AppSettings, 'users'>, newValue: string) => void;
  onRemoveSettingOption: (key: keyof Omit<AppSettings, 'users'>, valueToRemove: string) => void;
}

const BilletForm: React.FC<Props> = ({ data, settings, onSave, onAddSettingOption, onRemoveSettingOption }) => {
  const [form, setForm] = useState<BilletData>(data);
  const [managingField, setManagingField] = useState<keyof Omit<AppSettings, 'users'> | null>(null);
  const [newOptionValue, setNewOptionValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNewOption = (key: keyof Omit<AppSettings, 'users'>, fieldName: keyof BilletData) => {
    if (!newOptionValue.trim()) return;
    onAddSettingOption(key, newOptionValue);
    setForm(prev => ({ ...prev, [fieldName]: newOptionValue }));
    setNewOptionValue('');
  };

  const renderSelect = (label: string, name: keyof BilletData, settingKey: keyof Omit<AppSettings, 'users'>, options: string[], icon: React.ReactNode, hasOther = false) => {
    const isOtherSelected = hasOther && form[name] === "Autre";
    const otherFieldName = `${name}Other` as keyof BilletData;
    const isManaging = managingField === settingKey;

    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all overflow-hidden">
        <div className="flex justify-between items-center mb-2">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
            {icon} {label}
          </label>
          <button 
            type="button"
            onClick={() => setManagingField(isManaging ? null : settingKey)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black uppercase transition-colors ${isManaging ? 'bg-black text-white' : 'bg-[#76a73c]/10 text-[#76a73c] hover:bg-[#76a73c]/20'}`}
          >
            {isManaging ? <Check className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
            {isManaging ? 'Terminer' : 'Gérer'}
          </button>
        </div>

        {isManaging ? (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
            {/* Liste des options actuelles avec bouton de suppression */}
            <div className="max-h-40 overflow-y-auto space-y-1.5 p-1 bg-slate-50 rounded-lg">
              {options.length === 0 ? (
                <p className="text-[10px] text-center text-slate-400 py-4 italic">Aucune option enregistrée.</p>
              ) : (
                options.map(opt => (
                  <div key={opt} className="flex items-center justify-between bg-white px-3 py-2 rounded-md border border-slate-100 group">
                    <span className="text-xs font-bold text-black uppercase">{opt}</span>
                    <button 
                      type="button"
                      onClick={() => onRemoveSettingOption(settingKey, opt)}
                      className="text-red-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Formulaire d'ajout rapide */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <input 
                type="text"
                placeholder={`Ajouter ${label.toLowerCase()}...`}
                value={newOptionValue}
                onChange={(e) => setNewOptionValue(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border-2 border-slate-200 bg-white outline-none text-xs font-bold text-black focus:border-[#76a73c]"
              />
              <button 
                type="button"
                onClick={() => handleAddNewOption(settingKey, name)}
                className="bg-[#76a73c] text-white px-3 py-2 rounded-lg shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative">
              <select 
                name={name}
                value={form[name] as string}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-[#76a73c] appearance-none text-black font-semibold"
                required
              >
                <option value="" disabled>Choisir...</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                {hasOther && <option value="Autre">Autre (Saisie manuelle...)</option>}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {isOtherSelected && (
              <input 
                type="text"
                name={otherFieldName}
                value={form[otherFieldName] as string || ''}
                onChange={handleChange}
                placeholder="Précisez ici..."
                className="mt-2 w-full px-4 py-2.5 rounded-xl border-2 border-[#76a73c] bg-white outline-none animate-in slide-in-from-top-2 text-black font-semibold"
                required
                autoFocus
              />
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4 pb-10">
      {/* SECTION 1: LOGISTIQUE */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 border-b border-slate-100 pb-1 uppercase italic">1. Logistique</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Date</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input type="date" name="date" value={form.date} onChange={handleChange} className="bg-transparent text-sm font-bold w-full outline-none text-black" required />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Heure</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
              <Clock className="w-4 h-4 text-slate-400" />
              <input type="time" name="time" value={form.time} onChange={handleChange} className="bg-transparent text-sm font-bold w-full outline-none text-black" required />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: ACTEURS - RESPONSABLE AUTOMATIQUE */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase italic ml-1">2. Acteurs</h3>
        <div className="bg-black p-4 rounded-xl border-b-4 border-[#76a73c] shadow-md flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-[#76a73c] uppercase tracking-widest leading-none mb-1">Émetteur / Responsable</span>
            <span className="text-sm font-black text-white uppercase italic">{form.issuerName || "Utilisateur Inconnu"}</span>
          </div>
          <div className="bg-[#76a73c]/20 p-2 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-[#76a73c]" />
          </div>
        </div>
        {renderSelect("Client", "clientName", "clients", settings.clients, <User className="w-3 h-3" />)}
      </div>

      {/* SECTION 3: DÉTAILS */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase italic ml-1">3. Détails du dépôt</h3>
        {renderSelect("Provenance", "provenance", "provenances", settings.provenances, <MapPin className="w-3 h-3" />)}
        {renderSelect("Destination / Place où ils vont", "destination", "destinations", settings.destinations, <MapPin className="w-3 h-3" />, true)}
        {renderSelect("Camion (Plaque)", "plaque", "plaques", settings.plaques, <Truck className="w-3 h-3" />, true)}
        {renderSelect("Matériau", "typeSol", "typeSols", settings.typeSols, <Layers className="w-3 h-3" />, true)}
        {renderSelect("Quantité (Tonnes)", "quantite", "quantites", settings.quantites, <Weight className="w-3 h-3" />, true)}
        {renderSelect("Transporteur", "transporteur", "transporteurs", settings.transporteurs, <Truck className="w-3 h-3" />, true)}
      </div>

      <button type="submit" className="w-full py-4 bg-black text-white font-black uppercase italic rounded-2xl shadow-xl hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 mt-6 active:scale-95">
        <Save className="w-5 h-5" /> Générer le bon
      </button>
    </form>
  );
};

export default BilletForm;
