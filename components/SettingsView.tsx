
import React, { useState } from 'react';
import { AppSettings, UserAccount, Permission, UserRole } from '../types';
import { Plus, Trash2, Save, User, Shield, Key, Truck, ArrowLeft, ChevronRight, Settings2, Users, Briefcase } from 'lucide-react';

interface Props {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

type SettingsSubView = 'menu' | 'users';

const SettingsView: React.FC<Props> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const [subView, setSubView] = useState<SettingsSubView>('menu');

  const addUser = () => {
    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      name: 'Nouvel Utilisateur',
      code: Math.floor(1000 + Math.random() * 8999).toString(),
      role: 'user',
      group: 'DDL Excavation',
      permissions: ['punch']
    };
    setLocalSettings(prev => ({ ...prev, users: [...prev.users, newUser] }));
  };

  const removeUser = (id: string) => {
    if (localSettings.users.length <= 1) return;
    setLocalSettings(prev => ({ ...prev, users: prev.users.filter(u => u.id !== id) }));
  };

  const updateUser = (id: string, updates: Partial<UserAccount>) => {
    setLocalSettings(prev => ({
      ...prev,
      users: prev.users.map(u => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          
          // Mise à jour automatique des permissions selon le rôle
          const fieldRoles: UserRole[] = ['chauffeur', 'mécano', 'manoeuvre', 'operateur', 'opérateur_cour'];
          const fullAccessRoles: UserRole[] = ['admin', 'surintendant', 'chargée_de_projet'];

          if (updates.role && fieldRoles.includes(updates.role as UserRole)) {
            updated.permissions = ['punch'];
          } else if (updates.role && fullAccessRoles.includes(updates.role as UserRole)) {
            updated.permissions = ['punch', 'envoi', 'reception', 'history', 'provenance', 'reports', 'settings', 'approval'];
          } else if (updates.role === 'gestionnaire_cour') {
            updated.permissions = ['punch', 'reception', 'approval', 'history', 'provenance', 'reports'];
          } else if (updates.role === 'contremaitre') {
            updated.permissions = ['punch', 'approval', 'envoi', 'reception', 'history', 'provenance', 'reports'];
          } else if (updates.role === 'gestionnaire_mécano' || updates.role === 'gestionnaire_chauffeur') {
            updated.permissions = ['punch', 'approval'];
          }
          
          return updated;
        }
        return u;
      })
    }));
  };

  const togglePermission = (userId: string, perm: Permission) => {
    const user = localSettings.users.find(u => u.id === userId);
    if (!user) return;
    
    // Certains rôles ont des permissions fixes
    const restrictedRoles: UserRole[] = [
      'chauffeur', 'mécano', 'manoeuvre', 'operateur', 'opérateur_cour', 
      'gestionnaire_cour', 'contremaitre', 'gestionnaire_mécano', 'gestionnaire_chauffeur',
      'surintendant', 'chargée_de_projet'
    ];
    if (restrictedRoles.includes(user.role)) return;
    
    const newPermissions = user.permissions.includes(perm)
      ? user.permissions.filter(p => p !== perm)
      : [...user.permissions, perm];
    updateUser(userId, { permissions: newPermissions });
  };

  if (subView === 'menu') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black uppercase italic text-black tracking-tighter">Configuration</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Choisissez une section à modifier</p>
        </div>

        <div className="grid gap-4">
          <button 
            onClick={() => setSubView('users')}
            className="group bg-white p-6 rounded-[2.5rem] border-2 border-slate-200 hover:border-black shadow-sm flex items-center gap-5 transition-all active:scale-95 w-full"
          >
            <div className="bg-black p-4 rounded-2xl text-[#76a73c] shadow-lg group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8" />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-xl font-black text-black uppercase italic leading-none">Utilisateurs</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Codes PIN & Permissions</p>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-black" />
          </button>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 text-center">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-4">Modifications globales</p>
          <button 
            onClick={() => onSave(localSettings)} 
            className="w-full py-4 bg-black text-[#76a73c] font-black uppercase italic rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Save className="w-5 h-5" /> Enregistrer tout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in slide-in-from-right duration-300 pb-20">
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={() => setSubView('menu')}
          className="flex items-center gap-1 text-black font-black uppercase text-[10px] bg-slate-200 px-3 py-1.5 rounded-lg active:scale-95"
        >
          <ArrowLeft className="w-3 h-3" /> Menu Réglages
        </button>
        <button onClick={addUser} className="flex items-center gap-1 text-[10px] font-black text-[#76a73c] uppercase bg-[#76a73c]/10 px-3 py-1.5 rounded-lg active:scale-95">
          <Plus className="w-3 h-3" /> Ajouter un compte
        </button>
      </div>

      <div className="bg-black text-white p-5 rounded-2xl mb-4 border-b-4 border-[#76a73c]">
         <h3 className="text-xl font-black uppercase italic tracking-tighter">Gestion des Accès</h3>
         <p className="text-[9px] font-bold text-[#76a73c] uppercase tracking-widest">Contrôle des utilisateurs et PIN</p>
      </div>

      {localSettings.users.map(user => (
        <div key={user.id} className="bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Nom de l'utilisateur</div>
              <input 
                value={user.name} 
                onChange={(e) => updateUser(user.id, { name: e.target.value })} 
                className="text-sm font-black uppercase text-black bg-slate-50 px-3 py-2 rounded-lg w-full outline-none focus:ring-1 focus:ring-black mb-2" 
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex-1">
                  <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Groupe / Division</div>
                  <select 
                    value={user.group || ''} 
                    onChange={(e) => updateUser(user.id, { group: e.target.value })} 
                    className="w-full text-[10px] font-black uppercase text-black bg-slate-50 px-3 py-2 rounded-lg outline-none"
                  >
                    <option value="DDL Logistiques">DDL Logistiques</option>
                    <option value="DDL Excavation">DDL Excavation</option>
                    <option value="Groupe DDL">Groupe DDL</option>
                  </select>
                </div>
                <div className="flex-1">
                  <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Code PIN (4 chiffres)</div>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
                    <Key className="w-3 h-3 text-[#76a73c]" />
                    <input 
                      value={user.code} 
                      onChange={(e) => updateUser(user.id, { code: e.target.value.slice(0, 4) })} 
                      className="text-xs font-mono font-black text-black w-full bg-transparent outline-none" 
                      placeholder="0000" 
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3">
                  <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Rôle Système</div>
                  <select 
                    value={user.role} 
                    onChange={(e) => updateUser(user.id, { role: e.target.value as any })} 
                    className="w-full text-[10px] font-black uppercase text-black bg-slate-50 px-3 py-2 rounded-lg outline-none"
                  >
                    <option value="chauffeur">Chauffeur</option>
                    <option value="mécano">Mécano</option>
                    <option value="manoeuvre">Manoeuvre</option>
                    <option value="operateur">Opérateur</option>
                    <option value="opérateur_cour">Opérateur cour</option>
                    <option value="gestionnaire_cour">Gestionnaire Cour</option>
                    <option value="contremaitre">Contremaître</option>
                    <option value="gestionnaire_mécano">Gestionnaire Mécano</option>
                    <option value="gestionnaire_chauffeur">Gestionnaire Chauffeur</option>
                    <option value="surintendant">Surintendant</option>
                    <option value="chargée_de_projet">Chargée de projet</option>
                    <option value="user">Employé Standard</option>
                    <option value="admin">Administrateur</option>
                  </select>
              </div>
            </div>
            {user.role !== 'admin' && user.name !== 'Shawn Lecompte' && (
              <button onClick={() => removeUser(user.id)} className="p-2 text-red-300 hover:text-red-500 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[8px] font-black uppercase text-slate-400 mb-2">Modules accessibles :</p>
            <div className="flex flex-wrap gap-1.5">
              {(['punch', 'envoi', 'reception', 'history', 'reports', 'settings', 'approval'] as Permission[]).map(p => (
                <button 
                  key={p} 
                  disabled={['chauffeur', 'mécano', 'manoeuvre', 'operateur', 'opérateur_cour', 'gestionnaire_cour', 'contremaitre', 'gestionnaire_mécano', 'gestionnaire_chauffeur', 'surintendant', 'chargée_de_projet'].includes(user.role)}
                  onClick={() => togglePermission(user.id, p)} 
                  className={`text-[8px] font-black uppercase px-2 py-1.5 rounded-md border transition-all ${user.permissions.includes(p) ? 'bg-black text-[#76a73c] border-black' : 'bg-white text-slate-300 border-slate-200'} ${['chauffeur', 'mécano', 'manoeuvre', 'operateur', 'opérateur_cour', 'gestionnaire_cour', 'contremaitre', 'gestionnaire_mécano', 'gestionnaire_chauffeur', 'surintendant', 'chargée_de_projet'].includes(user.role) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {p === 'envoi' ? 'Billet Envoi' : p === 'reception' ? 'Réception' : p === 'history' ? 'Historique' : p === 'reports' ? 'Rapports' : p === 'settings' ? 'Réglages' : p === 'approval' ? 'Approbation' : p}
                </button>
              ))}
            </div>
            {['chauffeur', 'mécano', 'manoeuvre', 'operateur', 'opérateur_cour', 'gestionnaire_cour', 'contremaitre', 'gestionnaire_mécano', 'gestionnaire_chauffeur', 'surintendant', 'chargée_de_projet'].includes(user.role) && (
              <p className="text-[7px] font-black text-[#76a73c] uppercase mt-2 italic">* Les permissions de ce rôle sont prédéfinies par le système.</p>
            )}
          </div>
        </div>
      ))}

      <button 
        onClick={() => onSave(localSettings)} 
        className="fixed bottom-20 left-4 right-4 py-4 bg-black text-white font-black uppercase italic rounded-2xl shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform z-10"
      >
        <Plus className="w-5 h-5 text-[#76a73c]" /> Sauvegarder les accès
      </button>
    </div>
  );
};

export default SettingsView;
