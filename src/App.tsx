import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Bell, CalendarDays, Users, Settings, TriangleAlert, ChevronDown, Filter, CalendarClock, Info, CircleAlert, Calendar, ClipboardList, ShieldAlert, Siren, ArrowRightLeft, CheckCircle, LogIn, LogOut } from 'lucide-react';
import { RESIDENTS, MOCK_ALERTS, INITIAL_MASTER_PLAN, MOCK_SECTIONS, MOCK_LAST_CHANGES } from './constants';
import { RotationType, Alert, Resident, MasterPlan, Rotation, ClinicalSection, RotationChangeRequest } from './types';
import SectionsManagement from './components/SectionsManagement';
import ResidentsManagement from './components/ResidentsManagement';
import PlanEditor from './components/PlanEditor';
import RotationChanges from './components/RotationChanges';
import AlertsView from './components/AlertsView';
import { auth, db, login, logout, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, getDocFromServer } from 'firebase/firestore';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const ACADEMIC_MONTH_INDICES = [4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3];

type View = 'dashboard' | 'sections' | 'residents' | 'plan-editor' | 'changes' | 'alerts';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Algo salió mal.";
      const error = this.state.error as any;
      try {
        const errInfo = JSON.parse(error.message);
        if (errInfo.error.includes("insufficient permissions")) {
          errorMessage = "No tienes permisos suficientes para realizar esta acción.";
        }
      } catch (e) {
        errorMessage = error.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
            <CircleAlert className="mx-auto text-error mb-4" size={48} />
            <h2 className="text-2xl font-bold text-blue-900 mb-2">Error de Aplicación</h2>
            <p className="text-slate-600 mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  // Academic year starts in May (index 4)
  const startYear = currentMonth < 4 ? currentYear - 1 : currentYear;
  const academicYear = `${startYear} - ${startYear + 1}`;
  
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [selectedYear, setSelectedYear] = useState(academicYear);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sections, setSections] = useState<ClinicalSection[]>([]);
  const [masterPlan, setMasterPlan] = useState<MasterPlan>(INITIAL_MASTER_PLAN);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rotationRequests, setRotationRequests] = useState<RotationChangeRequest[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setIsAuthReady(true);
      
      if (user) {
        // Ensure user document exists
        try {
          const userDoc = await getDocFromServer(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
              role: user.email === 'jesufh@gmail.com' ? 'admin' : 'user',
              email: user.email,
              id: user.uid
            });
          }
        } catch (e) {
          // Ignore errors here as security rules might block read if not owner
          // or if it's the first time and rules are still propagating
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) return;

    // Listen for sections
    const unsubscribeSections = onSnapshot(collection(db, 'sections'), (snapshot) => {
      const sectionsData = snapshot.docs.map(doc => doc.data() as ClinicalSection);
      if (sectionsData.length === 0) {
        // Initialize with mock data if empty
        MOCK_SECTIONS.forEach(async (s) => {
          try {
            await setDoc(doc(db, 'sections', s.id), s);
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, `sections/${s.id}`);
          }
        });
      } else {
        setSections(sectionsData);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sections'));

    // Listen for residents
    const unsubscribeResidents = onSnapshot(collection(db, 'residents'), (snapshot) => {
      const residentsData = snapshot.docs.map(doc => {
        const data = doc.data() as Resident;
        const r = { ...data, id: doc.id };
        // Ensure entryYear and entryMonth exist
        if (r.entryYear === undefined || r.entryMonth === undefined) {
          const levelNum = parseInt(r.level?.slice(1)) || 1;
          r.entryYear = r.entryYear || (startYear - levelNum + 1);
          r.entryMonth = r.entryMonth !== undefined ? r.entryMonth : 4; // Default to May
        }
        return r;
      });
      if (residentsData.length === 0) {
        // Initialize with mock data if empty
        const initialResidents = RESIDENTS.map(r => ({
          ...r,
          specialty: 'Oftalmología',
          progress: (parseInt(r.level.slice(1)) / 4) * 100
        }));
        initialResidents.forEach(async (r) => {
          try {
            await setDoc(doc(db, 'residents', r.id), r);
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, `residents/${r.id}`);
          }
        });
      } else {
        setResidents(residentsData);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'residents'));

    // Listen for rotation requests (changes)
    const unsubscribeRequests = onSnapshot(collection(db, 'rotationRequests'), (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RotationChangeRequest[];
      setRotationRequests(requestsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'rotationRequests'));

    // Listen for master plan
    const unsubscribePlan = onSnapshot(doc(db, 'config', 'masterPlan'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        console.log('Master Plan updated from Firestore:', data);
        const normalizedPlan: MasterPlan = {};
        Object.keys(data).forEach(key => {
          const numKey = parseInt(key);
          if (!isNaN(numKey)) {
            normalizedPlan[numKey] = data[key];
          }
        });
        setMasterPlan(normalizedPlan);
      } else {
        console.log('Master Plan document does not exist, initializing...');
        // Initialize with mock data
        try {
          setDoc(doc(db, 'config', 'masterPlan'), INITIAL_MASTER_PLAN);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'config/masterPlan');
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'config/masterPlan'));

    return () => {
      unsubscribeSections();
      unsubscribeResidents();
      unsubscribeRequests();
      unsubscribePlan();
    };
  }, [isAuthReady, user, startYear]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border border-slate-100">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <ShieldAlert className="text-primary" size={40} />
          </div>
          <h2 className="text-3xl font-headline font-extrabold text-blue-900 mb-4 tracking-tight">Clinical Nexus</h2>
          <p className="text-slate-600 mb-10 font-medium">Inicia sesión para gestionar el planning de residentes del Hospital de León.</p>
          <button 
            onClick={login}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <LogIn size={20} />
            Entrar con Google
          </button>
        </div>
      </div>
    );
  }

  const getRotationColor = (type: string) => {
    const section = sections.find(s => s.name === type);
    if (section) return `${section.color} text-white`;
    
    // Fallbacks for types that might not be in sections yet
    switch (type) {
      case 'Guardia':
        return 'bg-tertiary-fixed text-on-tertiary-fixed';
      case 'Vacaciones':
        return 'bg-surface-container-highest text-secondary italic';
      default:
        return 'bg-slate-200 text-slate-600';
    }
  };

  const getRotationsForResident = (resident: Resident, yearStr: string): Rotation[] => {
    const yearStart = parseInt(yearStr.split(' - ')[0]);
    const entryYear = resident.entryYear;
    const entryMonth = resident.entryMonth; // 0-indexed
    const durationMonths = resident.durationMonths || 48;

    const academicMonths = [4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3];
    const rotations: Rotation[] = [];

    // Helper to get the plan for a specific PGY level and month offset
    const getPlanRotation = (pgy: number, monthOffset: number, subLevel: string) => {
      const pgyPlan = masterPlan[pgy];
      if (!pgyPlan) return 'Guardia';

      const blocks = subLevel === 'B' ? pgyPlan.blocksB : pgyPlan.blocksA;
      let currentOffset = 0;
      for (const block of blocks) {
        if (monthOffset >= currentOffset && monthOffset < currentOffset + block.duration) {
          const section = sections.find(s => s.id === block.sectionId);
          return section?.name || 'Externa';
        }
        currentOffset += block.duration;
      }
      return 'Guardia';
    };

    for (let mIdx = 0; mIdx < 12; mIdx++) {
      const m = academicMonths[mIdx];
      const actualYear = m < 4 ? yearStart + 1 : yearStart;
      
      // Calculate total months since entry
      const totalMonthsSinceEntry = (actualYear - entryYear) * 12 + (m - entryMonth);
      
      let type: RotationType = RotationType.GUARDIA;

      if (totalMonthsSinceEntry < 0) {
        type = RotationType.NO_INCORPORADO;
      } else if (totalMonthsSinceEntry >= durationMonths) {
        type = RotationType.FINALIZADO;
      } else {
        const pgyLevel = Math.floor(totalMonthsSinceEntry / 12) + 1;
        const monthInPgy = totalMonthsSinceEntry % 12;
        type = getPlanRotation(pgyLevel, monthInPgy, resident.subLevel || 'A') as RotationType;
      }

      // Apply changes (Cambios)
      const fullMonthName = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ][m];
      
      const relevantChange = rotationRequests.find(req => 
        req.residentId === resident.id && 
        req.newYear === actualYear.toString() && 
        req.newMonth === fullMonthName &&
        req.status === 'confirmed'
      );

      if (relevantChange) {
        type = relevantChange.newSection as RotationType;
      }

      rotations.push({
        residentId: resident.id,
        month: m,
        type
      });
    }

    return rotations;
  };

  const allRotations = residents.flatMap(r => getRotationsForResident(r, selectedYear));

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface antialiased">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl flex justify-between items-center px-6 h-16 w-full max-w-none">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-fixed flex items-center justify-center">
            <img 
              alt="Logo Hospital de León" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZSLxIcRZmlCgAYS-ojD54gFi3GzQOMpM4kyrp7FMD6xuYUBjx-y-WIkTAvpbC37vIwELfeFQumqkE_LICBs7jQ7sZQ55GdGRBETXMdESMGlFRLhwikcNV6lt5Kw_qlamrVki1LwKbNmtKB1OwSOClJc1ddoTMx2XTYEai6nY3U20zkDmfcm8weSqW03ahH4zmEDhul_3FSaGbuwLqZszNYbUCHvA7BxBP2vQxMde7qF3KGYaf-uwAMpvffYmrA0Cn3WKH3Xx9IpMs"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="font-headline font-extrabold text-blue-900 dark:text-blue-100 tracking-tighter text-2xl">Clinical Nexus</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors text-slate-500 dark:text-slate-400">
            <Search size={20} />
          </button>
          <button 
            onClick={() => setCurrentView('alerts')}
            className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors text-blue-900 dark:text-blue-200 relative"
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
          </button>
        </div>
      </header>

      <div className="flex pt-16 min-h-screen">
        {/* NavigationDrawer (Sidebar) */}
        <aside className="hidden lg:flex flex-col h-[calc(100vh-64px)] sticky top-16 p-4 gap-2 bg-slate-50 dark:bg-slate-900 h-full w-72 border-r-0">
          <div className="mb-8 px-2 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg">HL</div>
            <div>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-100 font-headline">Hospital de León</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Dpto. Oftalmología</p>
            </div>
          </div>
          <nav className="space-y-1">
            <NavItem 
              icon={<CalendarDays size={20} />} 
              label="Inicio" 
              active={currentView === 'dashboard'} 
              onClick={() => setCurrentView('dashboard')}
            />
            <NavItem 
              icon={<Users size={20} />} 
              label="Residentes" 
              active={currentView === 'residents'}
              onClick={() => setCurrentView('residents')}
            />
            <NavItem 
              icon={<Settings size={20} />} 
              label="Plan Maestro" 
              active={currentView === 'plan-editor'}
              onClick={() => setCurrentView('plan-editor')}
            />
            <NavItem 
              icon={<CalendarDays size={20} />} 
              label="Secciones" 
              active={currentView === 'sections'}
              onClick={() => setCurrentView('sections')}
            />
            <NavItem 
              icon={<ArrowRightLeft size={20} />} 
              label="Cambios" 
              active={currentView === 'changes'}
              onClick={() => setCurrentView('changes')}
            />
            <NavItem 
              icon={<TriangleAlert size={20} />} 
              label="Alertas" 
              active={currentView === 'alerts'}
              onClick={() => setCurrentView('alerts')}
            />
          </nav>
          <div className="mt-auto p-4 rounded-2xl bg-slate-100 dark:bg-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <img 
                alt={user.displayName || 'Usuario'} 
                className="w-10 h-10 rounded-full border-2 border-white object-cover" 
                src={user.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuDOlW_V18zMlp6wFGJczoBZjxd4KxRN5lL8qsN2cb_3ioCINmhkPQQ_wbf6ErPekvkhDs3npkpjZCVADJdGWAKJFsfKDpTfmNd2D1SgmE-xCT-xAtVEd75lBl1S3jg8fI_vGWmiaQIl1o64oDwAFvLgDSQaXCFMGqDQqxl266THdrMb2HT3pI9D01UtiPK_daglK5USLB-YP3z36CJtmLIUhPN4CsTf9Viuk6ZQ5HVx3U2v8De5XarMcqd6VdizjHpj8K-lYwte3kZe"}
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100 truncate max-w-[120px]">{user.displayName || 'Usuario'}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Administrador</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-50 transition-colors"
            >
              <LogOut size={14} />
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-10 max-w-full overflow-x-hidden pb-24 lg:pb-10">
          {currentView === 'sections' ? (
            <SectionsManagement 
              onBack={() => setCurrentView('dashboard')} 
              sections={sections}
              setSections={setSections}
            />
          ) : currentView === 'plan-editor' ? (
            <PlanEditor 
              onBack={() => setCurrentView('dashboard')} 
              masterPlan={masterPlan}
              setMasterPlan={setMasterPlan}
              sections={sections}
              setSections={setSections}
            />
          ) : currentView === 'residents' ? (
            <ResidentsManagement 
              onBack={() => setCurrentView('dashboard')} 
              residents={residents}
              setResidents={setResidents}
            />
          ) : currentView === 'changes' ? (
            <RotationChanges 
              onBack={() => setCurrentView('dashboard')} 
              residents={residents}
              sections={sections}
            />
          ) : currentView === 'alerts' ? (
            <AlertsView onBack={() => setCurrentView('dashboard')} />
          ) : (
            <>
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                  <h2 className="text-4xl font-headline font-extrabold text-blue-900 tracking-tight mb-2">Planning actualizado</h2>
                  <p className="text-secondary font-medium max-w-xl">Optimiza las rotaciones clínicas y gestiona la distribución del personal durante el año académico.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Año Académico</label>
                  <div className="relative group">
                    <select 
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="appearance-none bg-surface-container-lowest border-none rounded-xl px-6 py-3 pr-12 text-blue-900 font-bold shadow-sm focus:ring-2 focus:ring-primary transition-all cursor-pointer"
                    >
                      {[0, 1, 2, 3, 4].map(offset => {
                        const year = startYear + offset;
                        return <option key={year}>{year} - {year + 1}</option>;
                      })}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-700" size={20} />
                  </div>
                </div>
              </div>

              {/* Bento Grid Content */}
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
                {/* Main Schedule Table Module */}
                <div className="xl:col-span-3 bg-surface-container-lowest rounded-[1.5rem] shadow-sm overflow-hidden flex flex-col border border-outline-variant/10">
                  <div className="p-6 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 bg-primary rounded-full"></div>
                      <h3 className="text-xl font-headline font-bold text-on-surface">Planning actualizado</h3>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setCurrentView('plan-editor')}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
                      >
                        <CalendarClock size={18} />
                        Plan Maestro
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low border-b border-outline-variant/10">
                          <th className="sticky left-0 z-20 bg-surface-container-low px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest min-w-[140px]">Residente</th>
                          <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest min-w-[80px]">Duración</th>
                          {ACADEMIC_MONTH_INDICES.map(monthIndex => (
                            <th key={monthIndex} className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest min-w-[100px]">{MONTHS[monthIndex]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {residents.map(resident => {
                          const yearStart = parseInt(selectedYear.split(' - ')[0]);
                          const entryYear = resident.entryYear || (startYear - (parseInt(resident.level.slice(1)) || 1) + 1);
                          const levelAtYear = yearStart - entryYear + 1;
                          
                          if (levelAtYear < 1 || levelAtYear > 4) return null;

                          return (
                            <tr key={resident.id} className="group hover:bg-blue-50/30 transition-colors">
                              <td className="sticky left-0 z-10 bg-white group-hover:bg-blue-50/30 px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                    levelAtYear === 4 ? 'bg-primary-fixed text-primary' : 
                                    levelAtYear === 3 ? 'bg-secondary-fixed text-secondary' : 
                                    'bg-surface-container-highest text-slate-700'
                                  }`}>
                                    R{levelAtYear}{resident.subLevel}
                                  </div>
                                  <span className="text-sm font-bold text-on-surface whitespace-nowrap">{resident.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="text-xs font-bold text-slate-500">{resident.durationMonths || 48}m</span>
                              </td>
                              {ACADEMIC_MONTH_INDICES.map(monthIndex => {
                                const rotation = allRotations.find(r => r.residentId === resident.id && r.month === monthIndex);
                                return (
                                  <td key={monthIndex} className="px-2 py-3">
                                    <motion.div 
                                      whileHover={{ scale: 1.05 }}
                                      className={`rounded-xl p-2 text-[11px] font-bold text-center shadow-sm ${getRotationColor(rotation?.type || RotationType.EXTERNA)}`}
                                    >
                                      {rotation?.type}
                                    </motion.div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-6 bg-slate-50 border-t border-outline-variant/10 flex flex-wrap gap-4 items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Leyenda:</span>
                    {sections.map(section => (
                      <LegendItem key={section.id} color={section.color} label={section.name} />
                    ))}
                  </div>
                </div>

                {/* Validation Warnings & Stats */}
                <div className="flex flex-col gap-6">
                  <div className="bg-surface-container-lowest rounded-[1.5rem] p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-headline font-bold text-on-surface">Alertas de Validación</h3>
                      <div className="w-8 h-8 rounded-full bg-error-container flex items-center justify-center text-error font-bold text-xs">{MOCK_ALERTS.length}</div>
                    </div>
                    <div className="space-y-4">
                      {MOCK_ALERTS.map(alert => (
                        <AlertCard key={alert.id} alert={alert} />
                      ))}
                    </div>
                    <button className="w-full mt-6 py-3 border border-outline-variant/30 text-primary font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors">
                      Ejecutar Auditoría Completa
                    </button>
                  </div>

                  {/* Last Changes Module */}
                  <div className="bg-surface-container-lowest rounded-[1.5rem] p-6 shadow-sm border border-outline-variant/10">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-headline font-bold text-on-surface">Últimos cambios</h3>
                      <ArrowRightLeft className="text-primary" size={20} />
                    </div>
                    <div className="space-y-4">
                      {MOCK_LAST_CHANGES.map(change => (
                        <div key={change.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <CheckCircle size={16} />
                          </div>
                          <div className="flex-grow">
                            <p className="text-sm font-bold text-on-surface">{change.resident}</p>
                            <p className="text-xs text-on-surface-variant font-medium">{change.change}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{change.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => setCurrentView('changes')}
                      className="w-full mt-6 py-3 bg-primary/5 text-primary font-bold text-sm rounded-xl hover:bg-primary/10 transition-colors"
                    >
                      Ver todos los cambios
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* BottomNavBar (Mobile only) */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-50 rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
        <MobileNavItem 
          icon={<Calendar size={20} />} 
          label="Inicio" 
          active={currentView === 'dashboard'} 
          onClick={() => setCurrentView('dashboard')}
        />
        <MobileNavItem 
          icon={<ClipboardList size={20} />} 
          label="Residentes" 
          active={currentView === 'residents'}
          onClick={() => setCurrentView('residents')}
        />
        <MobileNavItem 
          icon={<ShieldAlert size={20} />} 
          label="Plan Estándar" 
          active={currentView === 'plan-editor'}
          onClick={() => setCurrentView('plan-editor')}
        />
        <MobileNavItem 
          icon={<ArrowRightLeft size={20} />} 
          label="Cambios" 
          active={currentView === 'changes'}
          onClick={() => setCurrentView('changes')}
        />
        <MobileNavItem 
          icon={<Siren size={20} />} 
          label="Alertas" 
          active={currentView === 'alerts'}
          onClick={() => setCurrentView('alerts')}
          badge 
        />
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-headline text-sm font-semibold transition-all duration-300 ${
        active 
          ? 'bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-100 shadow-sm' 
          : 'text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MobileNavItem({ icon, label, active = false, badge = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, badge?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-2xl px-4 py-1 active:scale-90 transition-transform duration-150 relative ${
        active ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' : 'text-slate-500 dark:text-slate-400'
      }`}
    >
      {icon}
      <span className="font-body text-[10px] font-medium tracking-wide">{label}</span>
      {badge && <span className="absolute top-1 right-4 w-2 h-2 bg-error rounded-full"></span>}
    </button>
  );
}

function LegendItem({ color, label }: { color: string, label: string; key?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${color}`}></span>
      <span className="text-xs font-medium text-slate-600">{label}</span>
    </div>
  );
}

function AlertCard({ alert }: { alert: Alert; key?: string }) {
  const isError = alert.type === 'error';
  const isWarning = alert.type === 'warning';
  
  const getAlertStyles = () => {
    if (isError) return 'bg-error-container/20 border-error text-on-error-container';
    if (isWarning) return 'bg-tertiary-fixed/30 border-tertiary text-on-tertiary-fixed';
    return 'bg-secondary-fixed/30 border-secondary text-on-secondary-fixed';
  };

  const getAlertIcon = () => {
    if (isError) return <CircleAlert className="text-error" size={18} />;
    if (isWarning) return <TriangleAlert className="text-tertiary" size={18} />;
    return <Info className="text-secondary" size={18} />;
  };

  return (
    <div className={`p-4 rounded-xl border-l-4 ${getAlertStyles()}`}>
      <div className="flex items-start gap-3">
        {getAlertIcon()}
        <div>
          <p className="text-sm font-bold">{alert.title}</p>
          <p className="text-xs mt-1 opacity-80">{alert.description}</p>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <li className="flex items-center justify-between text-sm">
      <span className="opacity-80">{label}</span>
      <span className="font-bold">{value}</span>
    </li>
  );
}
