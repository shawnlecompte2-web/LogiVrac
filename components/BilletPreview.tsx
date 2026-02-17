
import React from 'react';
import { BilletData } from '../types';

interface Props {
  data: BilletData;
}

const BilletPreview: React.FC<Props> = ({ data }) => {
  const displayVal = (field: keyof BilletData, otherField?: keyof BilletData) => {
    if (data[field] === "Autre" && otherField && data[otherField]) {
      return data[otherField];
    }
    return data[field] || "---";
  };

  return (
    <div className="bg-white rounded-none shadow-none print:shadow-none border-2 border-black max-w-[21.59cm] mx-auto flex flex-col overflow-hidden text-black leading-tight">
      {/* HEADER CONDENSÉ */}
      <div className="flex justify-between items-stretch border-b-2 border-black">
        <div className="p-4 flex-1 border-r-2 border-black bg-white flex flex-col justify-center">
          <h1 className="text-3xl font-black italic tracking-tighter leading-none text-black">
            GROUPE <span className="text-[#76a73c]">DDL</span>
          </h1>
          <div className="text-[8px] font-black tracking-[0.2em] text-slate-400 uppercase mt-1">LOGISTIQUE • TRANSPORT</div>
        </div>
        <div className="bg-black text-white p-4 flex flex-col justify-center items-end min-w-[160px]">
          <div className="text-[8px] font-black text-[#76a73c] uppercase tracking-widest leading-none mb-1">BILLET DE TRANSPORT</div>
          <div className="text-xl font-black font-mono tracking-tighter">{data.id}</div>
          <div className={`mt-2 px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${data.status === 'approved' ? 'bg-[#76a73c] text-black' : 'bg-orange-500 text-black'}`}>
            {data.status === 'approved' ? 'APPROUVÉ' : 'EN ATTENTE'}
          </div>
        </div>
      </div>

      {/* METADONNÉES LOGISTIQUES RAPIDES */}
      <div className="grid grid-cols-3 border-b-2 border-black bg-slate-50 text-[9px] font-bold uppercase">
        <div className="p-3 border-r-2 border-black">
          <span className="text-slate-400 block mb-0.5">Émis le</span>
          <span className="font-black">{data.date} <span className="text-slate-300 mx-1">|</span> {data.time}</span>
        </div>
        <div className="p-3 border-r-2 border-black">
          <span className="text-slate-400 block mb-0.5">Émetteur</span>
          <span className="font-black">{data.issuerName || "---"}</span>
        </div>
        <div className="p-3">
          <span className="text-slate-400 block mb-0.5">Client</span>
          <span className="font-black truncate block">{data.clientName || "---"}</span>
        </div>
      </div>

      {/* CONTENU PRINCIPAL BIEN CONDENSÉ */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div className="border-b border-slate-200 pb-1">
            <span className="text-[7px] font-black text-[#76a73c] uppercase tracking-widest block mb-0.5">Provenance</span>
            <span className="text-sm font-black uppercase">{data.provenance}</span>
          </div>

          <div className="border-b border-slate-200 pb-1">
            <span className="text-[7px] font-black text-[#76a73c] uppercase tracking-widest block mb-0.5">Destination / Place</span>
            <span className="text-sm font-black uppercase">{displayVal("destination", "destinationOther")}</span>
          </div>

          <div className="border-b border-slate-200 pb-1">
            <span className="text-[7px] font-black text-[#76a73c] uppercase tracking-widest block mb-0.5">Matériau</span>
            <span className="text-sm font-black uppercase">{displayVal("typeSol", "typeSolOther")}</span>
          </div>

          <div className="border-b border-slate-200 pb-1">
            <span className="text-[7px] font-black text-[#76a73c] uppercase tracking-widest block mb-0.5">Transporteur</span>
            <span className="text-sm font-black uppercase">{displayVal("transporteur", "transporteurOther")}</span>
          </div>
        </div>

        {/* SECTION TRANSPORT & POIDS */}
        <div className="flex border-2 border-black overflow-hidden">
          <div className="flex-1 bg-slate-900 text-white p-3">
            <span className="text-[7px] font-black text-[#76a73c] uppercase tracking-widest block mb-1">Identification Camion</span>
            <div className="text-lg font-black uppercase italic leading-none">PLAQUE : {displayVal("plaque", "plaqueOther")}</div>
          </div>
          <div className="bg-[#76a73c] text-black p-3 min-w-[120px] text-center flex flex-col justify-center">
            <span className="text-[7px] font-black uppercase tracking-widest leading-none mb-1">Tonnage Brut</span>
            <div className="text-2xl font-black font-mono leading-none tracking-tighter">{displayVal("quantite", "quantiteOther")} T</div>
          </div>
        </div>
      </div>

      {/* FOOTER ET SIGNATURES COMPACTS */}
      <div className="p-4 bg-white border-t-2 border-black">
        <div className="grid grid-cols-2 gap-10">
          <div className="flex flex-col">
            <div className="flex-1 border-b border-slate-300 min-h-[40px]"></div>
            <div className="text-[7px] font-black text-slate-400 uppercase mt-1">Signature Chauffeur</div>
          </div>
          <div className="flex flex-col">
            <div className="flex-1 border-b border-slate-300 min-h-[40px] flex items-end justify-center pb-1">
              {data.status === 'approved' && (
                <div className="border border-[#76a73c] text-[#76a73c] px-2 py-0.5 rounded-full text-[7px] font-black uppercase rotate-[-2deg] opacity-70">
                   Reçu par {data.approverName || 'Système'}
                </div>
              )}
            </div>
            <div className="text-[7px] font-black text-slate-400 uppercase mt-1">Validation Réception</div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center opacity-50">
          <p className="text-[7px] text-black font-black uppercase tracking-widest">
            LOGIVRAC • GROUPE DDL EXCAVATION INC.
          </p>
          <p className="text-[6px] text-slate-400 font-bold uppercase tracking-tighter">
            Document généré électroniquement • Valeur contractuelle
          </p>
        </div>
      </div>
    </div>
  );
};

export default BilletPreview;
