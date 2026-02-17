
export type UserRole = 
  | 'admin' 
  | 'user' 
  | 'chauffeur' 
  | 'manoeuvre' 
  | 'contremaitre' 
  | 'operateur' 
  | 'mécano' 
  | 'opérateur_cour' 
  | 'gestionnaire_cour' 
  | 'gestionnaire_mécano' 
  | 'gestionnaire_chauffeur'
  | 'surintendant'
  | 'chargée_de_projet';

export type Permission = 'punch' | 'envoi' | 'reception' | 'history' | 'provenance' | 'reports' | 'settings' | 'approval';

export interface UserAccount {
  id: string;
  name: string;
  code: string;
  role: UserRole;
  group?: string;
  permissions: Permission[];
}

export interface BilletData {
  id: string;
  date: string;
  time: string;
  issuerName: string;
  clientName: string;
  provenance: string;
  destination: string;
  destinationOther?: string;
  plaque: string;
  plaqueOther?: string;
  typeSol: string;
  typeSolOther?: string;
  quantite: string;
  quantiteOther?: string;
  transporteur: string;
  transporteurOther?: string;
  status: 'pending' | 'approved';
  approvalDate?: string;
  approverName?: string;
}

export interface PunchLog {
  id: string;
  employeeName: string;
  type: 'in' | 'out';
  timestamp: string;
  plaque?: string;
  lunchMinutes?: number;
}

export interface ApprovalRecord {
  id: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  totalMs: number;
  lunchMs?: number;
  status: 'pending' | 'approved';
  approverName?: string;
  approvalDate?: string;
}

export interface AppSettings {
  issuers: string[];
  clients: string[];
  provenances: string[];
  destinations: string[];
  plaques: string[];
  typeSols: string[];
  quantites: string[];
  transporteurs: string[];
  users: UserAccount[];
}

export type ViewMode = 
  | 'login' 
  | 'home' 
  | 'envoi' 
  | 'reception' 
  | 'punch' 
  | 'preview' 
  | 'history' 
  | 'settings' 
  | 'provenance_view' 
  | 'report_view' 
  | 'archives' 
  | 'punch_report'
  | 'approval_menu'
  | 'approval_pending'
  | 'approval_list'
  | 'approval_summary'
  | 'driver_compilation'
  | 'approved_compilation';
