import React, { useEffect, useMemo, useState } from "react";
import {
  BilletData,
  ViewMode,
  AppSettings,
  PunchLog,
  UserAccount,
  Permission,
  ApprovalRecord,
} from "./types";

import BilletForm from "./components/BilletForm";
import BilletPreview from "./components/BilletPreview";
import SettingsView from "./components/SettingsView";
import ProvenanceView from "./components/ProvenanceView";
import ReportView from "./components/ReportView";
import PunchView from "./components/PunchView";
import ReceptionView from "./components/ReceptionView";
import LoginView from "./components/LoginView";
import PunchReportView from "./components/PunchReportView";
import ApprovalMenuView from "./components/ApprovalMenuView";
import ApprovalPendingView from "./components/ApprovalPendingView";
import ApprovalListView from "./components/ApprovalListView";
import ApprovalSummaryView from "./components/ApprovalSummaryView";
import ApprovedCompilationView from "./components/ApprovedCompilationView";
import DriverCompilationView from "./components/DriverCompilationView";

import {
  ArrowLeft,
  Download,
  FileBarChart,
  Truck,
  CheckCircle,
  Clock,
  LayoutDashboard,
  Lock,
  LogOut,
  AlertTriangle,
  ClipboardList,
  ChevronRight,
  CalendarCheck,
  UserCheck,
  Library,
  UserCircle,
  Settings,
} from "lucide-react";

import { auth, db } from "./firebase";
import { signInAnonymously } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

/** Change l’équipe ici si tu veux */
const TEAM_ID = "equipe1";

/** -----------------------------
 *  Helpers Firestore (IMPORTANT)
 *  Firestore n’accepte PAS undefined.
 *  ----------------------------- */
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  Object.keys(obj).forEach((k) => {
    const v = obj[k];
    if (v !== undefined) cleaned[k] = v;
  });
  return cleaned;
}

/** -----------------------------
 *  Tes users/settings par défaut
 *  ----------------------------- */
const FULL_ACCESS: Permission[] = [
  "punch",
  "envoi",
  "reception",
  "history",
  "provenance",
  "reports",
  "settings",
  "approval",
];

const SHAWN_USER: UserAccount = {
  id: "shawn-1",
  name: "Shawn Lecompte",
  code: "3422",
  role: "admin",
  group: "DDL Excavation",
  permissions: FULL_ACCESS,
};

const NEW_USERS_LIST: UserAccount[] = [
  { id: "u1", name: "Sylvain Desjardins", code: "4459", role: "chauffeur", group: "DDL Logistiques", permissions: ["punch"] },
  { id: "u2", name: "Jean-Daniel Cartier", code: "3250", role: "gestionnaire_chauffeur", group: "DDL Logistiques", permissions: ["punch", "approval"] },
  { id: "u3", name: "Denis Boulet", code: "1449", role: "chauffeur", group: "DDL Logistiques", permissions: ["punch"] },
  { id: "u4", name: "Serge d'Amour", code: "2526", role: "gestionnaire_mécano", group: "DDL Logistiques", permissions: ["punch", "approval"] },
  { id: "u5", name: "Eric Charlebois", code: "3105", role: "chauffeur", group: "DDL Logistiques", permissions: ["punch"] },
  { id: "u6", name: "Maxime Sévigny", code: "1408", role: "chauffeur", group: "DDL Logistiques", permissions: ["punch"] },
  { id: "u7", name: "Pascal Leboeuf", code: "1491", role: "chauffeur", group: "DDL Logistiques", permissions: ["punch"] },
  { id: "u8", name: "Laurier Riel", code: "4574", role: "chauffeur", group: "DDL Logistiques", permissions: ["punch"] },
  { id: "u9", name: "Steve Obomsawin", code: "0041", role: "mécano", group: "DDL Logistiques", permissions: ["punch"] },
  { id: "u10", name: "Pierre-Luc Thauvette", code: "3731", role: "chauffeur", group: "DDL Logistiques", permissions: ["punch"] },
  { id: "u11", name: "Eric Massé", code: "0801", role: "gestionnaire_cour", group: "DDL Excavation", permissions: ["punch", "reception", "approval", "history", "provenance", "reports"] },
  { id: "u12", name: "Martin Cardinal", code: "2034", role: "opérateur_cour", group: "DDL Excavation", permissions: ["punch"] },
  { id: "u13", name: "Janot Blais", code: "6946", role: "gestionnaire_chauffeur", group: "DDL Excavation", permissions: ["punch", "approval"] },
  { id: "u14", name: "Andréanne Turmel", code: "9978", role: "admin", group: "Groupe DDL", permissions: FULL_ACCESS },
  { id: "u15", name: "Raphael Lambert", code: "9436", role: "chargée_de_projet", group: "DDL Excavation", permissions: FULL_ACCESS },
  { id: "u16", name: "Julie Allard", code: "0797", role: "admin", group: "Groupe DDL", permissions: FULL_ACCESS },
  { id: "u17", name: "Manon Cuerrier", code: "2221", role: "admin", group: "Groupe DDL", permissions: FULL_ACCESS },
  { id: "u18", name: "Dany Lecompte", code: "0908", role: "admin", group: "Groupe DDL", permissions: FULL_ACCESS },
  { id: "u19", name: "Christophe Lalonde", code: "1448", role: "manoeuvre", group: "DDL Excavation", permissions: ["punch"] },
  { id: "u20", name: "Charles Raby", code: "1111", role: "manoeuvre", group: "DDL Excavation", permissions: ["punch"] },
  { id: "u21", name: "Jacob Campbell", code: "1811", role: "manoeuvre", group: "DDL Excavation", permissions: ["punch"] },
  { id: "u22", name: "Marc-Antoine Yelle", code: "2460", role: "contremaitre", group: "DDL Excavation", permissions: ["punch", "approval", "envoi", "reception", "history", "provenance", "reports"] },
  { id: "u23", name: "Donald Strat", code: "0861", role: "operateur", group: "DDL Excavation", permissions: ["punch"] },
  { id: "u24", name: "André Lauzon", code: "0582", role: "manoeuvre", group: "DDL Excavation", permissions: ["punch"] },
  { id: "u25", name: "Jean Benoit Boulerice", code: "4414", role: "operateur", group: "DDL Excavation", permissions: ["punch"] },
  { id: "u26", name: "Olivier Primeau", code: "3014", role: "manoeuvre", group: "DDL Excavation", permissions: ["punch"] },
  { id: "u27", name: "Mathis Carpentier", code: "2222", role: "mécano", group: "DDL Excavation", permissions: ["punch"] },
];

const DEFAULT_SETTINGS: AppSettings = {
  issuers: ["Responsable 1"],
  clients: ["Client A"],
  provenances: ["Chantier Ville"],
  destinations: ["Site de dépose 1"],
  plaques: ["L-12345"],
  typeSols: ["Terre végétale"],
  quantites: ["10", "20"],
  transporteurs: ["Transporteur A"],
  users: [SHAWN_USER, ...NEW_USERS_LIST],
};

function createNewBillet(issuerName: string = ""): BilletData {
  const now = new Date();
  return {
    id: `EV-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 8999)}`,
    date: now.toISOString().split("T")[0],
    time: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    issuerName,
    clientName: "",
    provenance: "",
    destination: "",
    plaque: "",
    typeSol: "",
    quantite: "",
    transporteur: "",
    status: "pending",
  };
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [view, setView] = useState<ViewMode>("login");

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<BilletData[]>([]);
  const [punchLogs, setPunchLogs] = useState<PunchLog[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [billet, setBillet] = useState<BilletData>(() => createNewBillet());

  /** 1) Auth anonyme (obligatoire pour lire/écrire si règles auth) */
  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
  }, []);

  /** 2) SETTINGS en temps réel : teams/{TEAM_ID}/settings/main */
  useEffect(() => {
    const ref = doc(db, "teams", TEAM_ID, "settings", "main");

    return onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AppSettings;
        // sécurité: champs manquants
        setSettings({
          ...DEFAULT_SETTINGS,
          ...data,
          users: data.users?.length ? data.users : DEFAULT_SETTINGS.users,
        });
      } else {
        // 1ère fois: crée settings par défaut dans Firestore
        await setDoc(ref, DEFAULT_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
      }
    });
  }, []);

  /** 3) PUNCH LOGS en temps réel : teams/{TEAM_ID}/logs */
  useEffect(() => {
    const q = query(collection(db, "teams", TEAM_ID, "logs"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => {
      const next = snap.docs.map((d) => {
        const data = d.data() as any;
        // PunchLog exige id: string
        const log: PunchLog = {
          id: data.id ?? d.id,
          employeeName: data.employeeName,
          type: data.type,
          timestamp: data.timestamp,
          plaque: data.plaque,
          lunchMinutes: data.lunchMinutes,
        };
        return log;
      });
      setPunchLogs(next);
    });
  }, []);

  /** 4) HISTORY billets en temps réel : teams/{TEAM_ID}/history */
  useEffect(() => {
    const q = query(collection(db, "teams", TEAM_ID, "history"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      const next = snap.docs.map((d) => ({ ...(d.data() as any), id: d.id })) as BilletData[];
      setHistory(next);
    });
  }, []);

  /** 5) APPROVALS en temps réel : teams/{TEAM_ID}/approvals */
  useEffect(() => {
    const q = query(collection(db, "teams", TEAM_ID, "approvals"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      const next = snap.docs.map((d) => ({ ...(d.data() as any), id: d.id })) as ApprovalRecord[];
      setApprovals(next);
    });
  }, []);

  const hasPermission = (p: Permission) => currentUser?.permissions.includes(p);

  const isPunchedIn = () => {
    if (!currentUser) return false;
    if (["admin", "surintendant", "chargée_de_projet"].includes(currentUser.role)) return true;

    const userLogs = punchLogs.filter((log) => log.employeeName === currentUser.name);
    if (userLogs.length === 0) return false;
    const last = userLogs[userLogs.length - 1];
    return last.type === "in";
  };

  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);

    const isFreeAccess = ["admin", "surintendant", "chargée_de_projet"].includes(user.role);
    if (isFreeAccess) {
      setView("home");
      return;
    }

    const userLogs = punchLogs.filter((log) => log.employeeName === user.name);
    const last = userLogs[userLogs.length - 1];
    const currentlyIn = last?.type === "in";

    if (!currentlyIn) setView("punch");
    else setView("home");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView("login");
  };

  /** SAVE SETTINGS -> Firestore (synchro tous téléphones) */
  const saveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    const ref = doc(db, "teams", TEAM_ID, "settings", "main");
    await setDoc(ref, newSettings);
  };

  const updateSettingsList = (key: keyof Omit<AppSettings, "users">, newValue: string) => {
    const newSettings = { ...settings, [key]: [...(settings[key] as string[]), newValue] };
    saveSettings(newSettings).catch(console.error);
  };

  const removeSettingsOption = (key: keyof Omit<AppSettings, "users">, valueToRemove: string) => {
    const currentList = settings[key] as string[];
    const newSettings = { ...settings, [key]: currentList.filter((item) => item !== valueToRemove) };
    saveSettings(newSettings).catch(console.error);
  };

  /** PUNCH -> Firestore (IMPORTANT: pas de undefined) */
  const savePunch = async (log: PunchLog) => {
    // ✅ Fix principal: Firestore refuse undefined
    const safeLog = stripUndefined({
      ...log,
      // si lunchMinutes est vide, on l’enlève. (ou mets 0/30 si tu veux)
      lunchMinutes: log.lunchMinutes ?? undefined,
      plaque: log.plaque?.trim() ? log.plaque.trim().toUpperCase() : undefined,
      createdAt: serverTimestamp(),
    });

    await addDoc(collection(db, "teams", TEAM_ID, "logs"), safeLog);

    // auto-ajout plaque dans settings (si chauffeur)
    if (safeLog.type === "in" && safeLog.plaque) {
      const targetUser = settings.users.find((u) => u.name === safeLog.employeeName);
      if (targetUser?.role === "chauffeur" && !settings.plaques.includes(safeLog.plaque)) {
        updateSettingsList("plaques", safeLog.plaque);
      }
    }

    const isPunchOnly = currentUser?.permissions.length === 1 && currentUser.permissions[0] === "punch";
    if (safeLog.type === "in" && !isPunchOnly) setView("home");
  };

  /** BILLET -> preview */
  const handleSaveBillet = (data: BilletData) => {
    setBillet(data);
    setView("preview");
  };

  /** FINALIZE billet -> Firestore */
  const finalizeBillet = async () => {
    const payload = stripUndefined({
      ...billet,
      createdAt: serverTimestamp(),
    });

    await addDoc(collection(db, "teams", TEAM_ID, "history"), payload);

    alert("Billet créé et envoyé !");
    setView("home");
  };

  /** Approver billet -> update Firestore (optionnel si ton ReceptionView utilise déjà autre chose) */
  const approveBillet = async (id: string, updatedData?: Partial<BilletData>) => {
    const ref = doc(db, "teams", TEAM_ID, "history", id);
    await updateDoc(
      ref,
      stripUndefined({
        ...(updatedData || {}),
        status: "approved",
        approvalDate: new Date().toLocaleString("fr-FR"),
        approverName: currentUser?.name,
      })
    );
  };

  /** Approver heures -> Firestore */
  const handleApproveHours = async (employeeName: string, date: string, totalMs: number, lunchMs?: number) => {
    const payload: ApprovalRecord = {
      id: `APP-${Date.now()}`, // on garde un id dans data, mais Firestore aura aussi son doc id
      employeeName,
      date,
      totalMs,
      lunchMs,
      status: "approved",
      approverName: currentUser?.name,
      approvalDate: new Date().toLocaleString("fr-FR"),
    };

    await addDoc(collection(db, "teams", TEAM_ID, "approvals"), stripUndefined({ ...payload, createdAt: serverTimestamp() }));
  };

  /** Safety settings */
  const safeSettings = useMemo(() => {
    return {
      ...settings,
      users: settings?.users ?? [],
      issuers: settings?.issuers ?? [],
      clients: settings?.clients ?? [],
      provenances: settings?.provenances ?? [],
      destinations: settings?.destinations ?? [],
      plaques: settings?.plaques ?? [],
      typeSols: settings?.typeSols ?? [],
      quantites: settings?.quantites ?? [],
      transporteurs: settings?.transporteurs ?? [],
    } as AppSettings;
  }, [settings]);

  /** UI */
  if (view === "login") return <LoginView users={safeSettings.users} onLogin={handleLogin} />;

  const activeSession = isPunchedIn();
  const isPunchOnly = currentUser?.permissions.length === 1 && currentUser.permissions[0] === "punch";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col max-w-md mx-auto shadow-2xl relative overflow-x-hidden border-x border-slate-200">
      <header className="bg-black text-white p-3 shadow-lg sticky top-0 z-20 flex justify-between items-center">
        <div className="flex flex-col items-start cursor-pointer" onClick={() => !isPunchOnly && setView("home")}>
          <span className="text-[8px] font-black tracking-[0.3em] mb-0.5 uppercase opacity-60">
            Logistique / Transport
          </span>
          <h1 className="text-2xl font-black italic tracking-tighter leading-none text-white">
            GROUPE <span className="text-[#76a73c]">DDL</span>
          </h1>
        </div>

        <div className="flex gap-1 items-center">
          <div className="mr-2 text-right">
            <div className="text-[8px] font-black uppercase opacity-50">Session</div>
            <div className="text-[10px] font-black text-[#76a73c] uppercase leading-none">{currentUser?.name}</div>
            {currentUser?.group && (
              <div className="text-[7px] font-black text-white/40 uppercase tracking-widest">{currentUser.group}</div>
            )}
          </div>

          {view !== "home" && !isPunchOnly && (
            <button title="Accueil" onClick={() => setView("home")} className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
              <LayoutDashboard className="w-4 h-4" />
            </button>
          )}

          {hasPermission("settings") && (
            <button
              title="Réglages"
              onClick={() => setView("settings")}
              className={`p-2 rounded-lg ${view === "settings" ? "bg-[#76a73c]" : "bg-white/10 hover:bg-white/20"}`}
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          <button
            title="Déconnexion"
            onClick={handleLogout}
            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-slate-50">
        {view === "home" && (
          <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-black uppercase italic text-black tracking-tighter">Menu Principal</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Bienvenue, {currentUser?.name}
              </p>
              {currentUser?.group && (
                <p className="text-[8px] font-black text-[#76a73c] uppercase tracking-widest mt-1">{currentUser.group}</p>
              )}
            </div>

            {!activeSession && (
              <div className="bg-red-100 border-2 border-red-500 p-4 rounded-2xl flex items-center gap-3 animate-pulse mb-2">
                <AlertTriangle className="text-red-600 w-6 h-6 flex-shrink-0" />
                <div className="text-[10px] font-black text-red-800 uppercase leading-tight">
                  Action Requise : Vous devez effectuer votre pointage (Punch In) pour déverrouiller les autres modules.
                </div>
              </div>
            )}

            <div className="grid gap-4">
              {hasPermission("punch") && (
                <button
                  onClick={() => setView("punch")}
                  className="group bg-white p-6 rounded-[2rem] border-2 border-slate-200 hover:border-blue-500 shadow-sm flex items-center gap-5 transition-all active:scale-95"
                >
                  <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg">
                    <Clock className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-black text-black uppercase italic leading-none">Punch Mobile</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Pointage des heures</p>
                  </div>
                </button>
              )}

              {hasPermission("approval") && (
                <button
                  disabled={!activeSession}
                  onClick={() => setView("approval_menu")}
                  className={`group bg-white p-6 rounded-[2rem] border-2 shadow-sm flex items-center gap-5 transition-all active:scale-95 relative overflow-hidden ${
                    !activeSession ? "opacity-40 border-slate-100 cursor-not-allowed grayscale" : "border-slate-200 hover:border-black"
                  }`}
                >
                  <div className="bg-orange-500 p-4 rounded-2xl text-white shadow-lg">
                    <UserCheck className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-black text-black uppercase italic leading-none">Approbation Heures</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Personnel terrain</p>
                  </div>
                  {!activeSession && <Lock className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />}
                </button>
              )}

              {hasPermission("envoi") && (
                <button
                  disabled={!activeSession}
                  onClick={() => {
                    setBillet(createNewBillet(currentUser?.name));
                    setView("envoi");
                  }}
                  className={`group bg-white p-6 rounded-[2rem] border-2 shadow-sm flex items-center gap-5 transition-all active:scale-95 relative overflow-hidden ${
                    !activeSession ? "opacity-40 border-slate-100 cursor-not-allowed grayscale" : "border-slate-200 hover:border-[#76a73c]"
                  }`}
                >
                  <div className="bg-[#76a73c] p-4 rounded-2xl text-white shadow-lg">
                    <Truck className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-black text-black uppercase italic leading-none">Envoi des Sols</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Nouveau billet</p>
                  </div>
                  {!activeSession && <Lock className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />}
                </button>
              )}

              {hasPermission("reception") && (
                <button
                  disabled={!activeSession}
                  onClick={() => setView("reception")}
                  className={`group bg-white p-6 rounded-[2rem] border-2 shadow-sm flex items-center gap-5 transition-all active:scale-95 relative overflow-hidden ${
                    !activeSession ? "opacity-40 border-slate-100 cursor-not-allowed grayscale" : "border-slate-200 hover:border-black"
                  }`}
                >
                  <div className="bg-black p-4 rounded-2xl text-white shadow-lg">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-black text-black uppercase italic leading-none">Réception Sols</h3>
                    <p className="text-[10px] font-bold text-white/50 uppercase mt-1">Approbation réception</p>
                  </div>
                  {!activeSession && <Lock className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />}
                </button>
              )}

              {(hasPermission("history") || hasPermission("provenance") || hasPermission("reports")) && (
                <button
                  disabled={!activeSession}
                  onClick={() => setView("archives")}
                  className={`group bg-white p-6 rounded-[2rem] border-2 shadow-sm flex items-center gap-5 transition-all active:scale-95 relative overflow-hidden ${
                    !activeSession ? "opacity-40 border-slate-100 cursor-not-allowed grayscale" : "border-slate-200 hover:border-blue-800"
                  }`}
                >
                  <div className="bg-slate-800 p-4 rounded-2xl text-white shadow-lg">
                    <ClipboardList className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-black text-black uppercase italic leading-none">Centre de Données</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Archives, Chantiers & Rapports</p>
                  </div>
                  {!activeSession && <Lock className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />}
                </button>
              )}
            </div>
          </div>
        )}

        {view === "approval_menu" && <ApprovalMenuView onBack={() => setView("home")} onNavigate={(v) => setView(v)} />}
        {view === "approval_pending" && (
          <ApprovalPendingView
            logs={punchLogs}
            users={safeSettings.users}
            approvals={approvals}
            onApprove={handleApproveHours}
            onBack={() => setView("approval_menu")}
            currentUser={currentUser}
          />
        )}
        {view === "approval_list" && <ApprovalListView approvals={approvals} onBack={() => setView("approval_menu")} />}
        {view === "approval_summary" && (
          <ApprovalSummaryView
            logs={punchLogs}
            users={safeSettings.users}
            approvals={approvals}
            onBack={() => setView("approval_menu")}
            currentUser={currentUser}
          />
        )}

        {view === "archives" && (
          <div className="p-6 space-y-6 animate-in slide-in-from-right duration-300">
            <button onClick={() => setView("home")} className="flex items-center gap-1 text-black font-black uppercase text-[10px] bg-slate-200 px-3 py-1.5 rounded-lg mb-4">
              <ArrowLeft className="w-3 h-3" /> Retour Accueil
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-black uppercase italic text-black tracking-tighter">Consultation</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accédez aux archives et aux statistiques</p>
            </div>

            <div className="grid gap-4">
              <button onClick={() => setView("punch_report")} className="flex items-center justify-between p-6 bg-white border-2 border-slate-200 rounded-3xl hover:border-[#76a73c] transition-all active:scale-95 shadow-sm group">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-3 rounded-2xl text-slate-600 group-hover:bg-[#76a73c] group-hover:text-white transition-colors">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                  <span className="text-base font-black uppercase italic text-black">Pointage des Heures</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-black mt-1" />
              </button>

              <button onClick={() => setView("driver_compilation")} className="flex items-center justify-between p-6 bg-white border-2 border-slate-200 rounded-3xl hover:border-black transition-all active:scale-95 shadow-sm group">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-3 rounded-2xl text-slate-600 group-hover:bg-black group-hover:text-white transition-colors">
                    <UserCircle className="w-6 h-6" />
                  </div>
                  <span className="text-base font-black uppercase italic text-black">Compilation Chauffeur</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-black mt-1" />
              </button>

              <button onClick={() => setView("approved_compilation")} className="flex items-center justify-between p-6 bg-white border-2 border-slate-200 rounded-3xl hover:border-[#76a73c] transition-all active:scale-95 shadow-sm group">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-3 rounded-2xl text-slate-600 group-hover:bg-[#76a73c] group-hover:text-white transition-colors">
                    <Library className="w-6 h-6" />
                  </div>
                  <span className="text-base font-black uppercase italic text-black">Billets de Sols Approuvés</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-black mt-1" />
              </button>

              {hasPermission("reports") && (
                <button onClick={() => setView("report_view")} className="flex items-center justify-between p-6 bg-white border-2 border-slate-200 rounded-3xl hover:border-black transition-all active:scale-95 shadow-sm group">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 p-3 rounded-2xl text-slate-600 group-hover:bg-black group-hover:text-white transition-colors">
                      <FileBarChart className="w-6 h-6" />
                    </div>
                    <span className="text-base font-black uppercase italic text-black">Rapports Sols (Stats)</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-black" />
                </button>
              )}
            </div>
          </div>
        )}

        {view === "driver_compilation" && (
          <DriverCompilationView logs={punchLogs} users={safeSettings.users} history={history} approvals={approvals} onBack={() => setView("archives")} />
        )}
        {view === "approved_compilation" && <ApprovedCompilationView history={history} onBack={() => setView("archives")} />}
        {view === "punch_report" && (
          <PunchReportView logs={punchLogs} users={safeSettings.users} history={history} approvals={approvals} onBack={() => setView("archives")} />
        )}

        {view === "punch" && (
          <PunchView
            settings={safeSettings}
            logs={punchLogs}
            history={history}
            onPunch={savePunch}
            onBack={() => setView("home")}
            currentUser={currentUser}
          />
        )}

        {view === "envoi" && (
          <div className="p-4 animate-in slide-in-from-right duration-300">
            <button onClick={() => setView("home")} className="flex items-center gap-1 text-black font-black uppercase text-[10px] bg-slate-200 px-3 py-1.5 rounded-lg mb-4">
              <ArrowLeft className="w-3 h-3" /> Retour
            </button>
            <BilletForm
              data={billet}
              settings={safeSettings}
              onSave={handleSaveBillet}
              onAddSettingOption={updateSettingsList}
              onRemoveSettingOption={removeSettingsOption}
            />
          </div>
        )}

        {view === "reception" && <ReceptionView history={history} settings={safeSettings} onApprove={approveBillet} onBack={() => setView("home")} />}

        {view === "preview" && (
          <div className="p-4 animate-in zoom-in-95 duration-300">
            <button onClick={() => setView("envoi")} className="flex items-center gap-1 text-black font-black uppercase text-xs mb-4">
              <ArrowLeft className="w-4 h-4" /> Modifier
            </button>
            <BilletPreview data={billet} />
            <button
              onClick={() => finalizeBillet().catch(console.error)}
              className="w-full mt-6 py-4 bg-[#76a73c] text-white font-black uppercase italic rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Download className="w-5 h-5" /> Confirmer & Créer
            </button>
          </div>
        )}

        {view === "provenance_view" && (
          <div className="p-4">
            <button onClick={() => setView("archives")} className="mb-4 text-[10px] font-black uppercase bg-slate-200 px-3 py-1.5 rounded-lg">
              Retour Données
            </button>
            <ProvenanceView history={history} onSelectBillet={(h) => { setBillet(h); setView("preview"); }} />
          </div>
        )}

        {view === "report_view" && <ReportView history={history} onBack={() => setView("archives")} />}

        {view === "settings" && hasPermission("settings") && (
          <div className="p-4">
            <button onClick={() => setView("home")} className="mb-4 text-xs font-black uppercase flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <SettingsView settings={safeSettings} onSave={(s) => saveSettings(s).then(() => setView("home")).catch(console.error)} />
          </div>
        )}
      </main>

      <footer className="p-4 text-center border-t border-slate-200 bg-white">
        <div className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">LOGIVRAC LOGISTIQUE MOBILE</div>
      </footer>
    </div>
  );
};

export default App;


