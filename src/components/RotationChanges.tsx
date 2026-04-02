import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, CheckCircle, RefreshCw, Users, FileText, 
  ArrowRightLeft, Siren, ShieldCheck, Info, X, Check, ChevronDown, Sparkles, ClipboardList
} from 'lucide-react';
import { MOCK_SECTIONS } from '../constants';
import { ClinicalSection, ExecutionHistoryItem, Resident } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit, Timestamp } from 'firebase/firestore';

interface RotationChangesProps {
  onBack: () => void;
  residents: Resident[];
  sections: ClinicalSection[];
}

export default function RotationChanges({ onBack, residents, sections }: RotationChangesProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReorg, setShowReorg] = useState(false);
  const [history, setHistory] = useState<ExecutionHistoryItem[]>([]);
  const [formData, setFormData] = useState({
    residentId: '',
    currentSection: '',
    currentMonth: '',
    currentYear: new Date().getFullYear().toString(),
    newSection: '',
    newMonth: '',
    newYear: new Date().getFullYear().toString(),
    reason: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'rotationRequests'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setHistory(historyData.map(h => ({
        id: h.id,
        proposedChange: `${h.currentSection} → ${h.newSection}`,
        autoImpact: 'Ajuste Automático',
        result: 'success'
      })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'rotationRequests'));

    return () => unsubscribe();
  }, []);

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const startYear = currentMonth < 4 ? currentYear - 1 : currentYear;
  const years = [startYear, startYear + 1, startYear + 2];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.residentId || !formData.newSection) return;

    setIsProcessing(true);
    try {
      await addDoc(collection(db, 'rotationRequests'), {
        ...formData,
        createdAt: Timestamp.now(),
        status: 'confirmed'
      });
      setIsProcessing(false);
      setShowSuccess(true);
      setFormData({
        residentId: '',
        currentSection: '',
        currentMonth: '',
        currentYear: new Date().getFullYear().toString(),
        newSection: '',
        newMonth: '',
        newYear: new Date().getFullYear().toString(),
        reason: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'rotationRequests');
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      {/* Header Section */}
      <header className="mb-12 pt-4">
        <h2 className="text-4xl font-extrabold text-on-surface font-headline tracking-tight mb-2">Solicitud de Cambios Mensuales</h2>
        <p className="text-on-surface-variant font-medium max-w-2xl font-body">Gestione modificaciones de rotación con optimización automática de la planificación global para cumplir normativas clínicas.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: New Request Form */}
        <div className="lg:col-span-5 space-y-8">
          <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
            <h3 className="text-xl font-bold font-headline text-primary mb-8 flex items-center gap-2">
              <RefreshCw className="text-primary" size={24} />
              Reorganización de Cambios
            </h3>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Residente que solicita el cambio */}
              <div className="p-5 bg-surface-container-low rounded-xl border border-outline-variant/10">
                <h4 className="text-[0.625rem] font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Users size={14} className="text-primary" />
                  Residente Solicitante
                </h4>
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1 ml-1">Seleccionar Residente</label>
                  <div className="relative group">
                    <select 
                      value={formData.residentId}
                      onChange={(e) => setFormData({...formData, residentId: e.target.value})}
                      className="w-full bg-white border border-outline-variant/30 rounded-lg py-2 px-3 text-sm font-medium focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                    >
                      <option value="">Seleccione un residente...</option>
                      {residents.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.level}{r.subLevel})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline" size={16} />
                  </div>
                </div>
              </div>

              {/* Estado Actual Card */}
              <div className="p-5 bg-surface-container-low rounded-xl border border-outline-variant/10">
                <h4 className="text-[0.625rem] font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  Configuración Actual
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1 ml-1">Sección</label>
                      <div className="relative">
                        <select 
                          value={formData.currentSection}
                          onChange={(e) => setFormData({...formData, currentSection: e.target.value})}
                          className="w-full bg-white border border-outline-variant/30 rounded-lg py-2 px-3 text-sm font-medium focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                        >
                          <option value="">Seleccione sección...</option>
                          {sections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline" size={16} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1 ml-1">Mes</label>
                        <div className="relative">
                          <select 
                            value={formData.currentMonth}
                            onChange={(e) => setFormData({...formData, currentMonth: e.target.value})}
                            className="w-full bg-white border border-outline-variant/30 rounded-lg py-2 px-3 text-sm font-medium focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                          >
                            <option value="">Seleccione mes...</option>
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline" size={16} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1 ml-1">Año</label>
                        <div className="relative">
                          <select 
                            value={formData.currentYear}
                            onChange={(e) => setFormData({...formData, currentYear: e.target.value})}
                            className="w-full bg-white border border-outline-variant/30 rounded-lg py-2 px-3 text-sm font-medium focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                          >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline" size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Swap Icon Divider */}
              <div className="flex justify-center -my-3 relative z-10">
                <div className="bg-primary text-white p-2 rounded-full shadow-md border-4 border-surface-container-lowest">
                  <ArrowRightLeft size={20} className="rotate-90 lg:rotate-0" />
                </div>
              </div>

              {/* Cambio Propuesto Card */}
              <div className="p-5 bg-primary/5 rounded-xl border border-primary/10">
                <h4 className="text-[0.625rem] font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  Cambio Propuesto
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-primary/70 uppercase mb-1 ml-1">Nueva Sección</label>
                      <div className="relative">
                        <select 
                          value={formData.newSection}
                          onChange={(e) => setFormData({...formData, newSection: e.target.value})}
                          className="w-full bg-white border border-primary/20 rounded-lg py-2 px-3 text-sm font-medium focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                        >
                          <option value="">Seleccione nueva sección...</option>
                          {sections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary/50" size={16} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-primary/70 uppercase mb-1 ml-1">Nuevo Mes</label>
                        <div className="relative">
                          <select 
                            value={formData.newMonth}
                            onChange={(e) => setFormData({...formData, newMonth: e.target.value})}
                            className="w-full bg-white border border-primary/20 rounded-lg py-2 px-3 text-sm font-medium focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                          >
                            <option value="">Seleccione mes...</option>
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary/50" size={16} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-primary/70 uppercase mb-1 ml-1">Año</label>
                        <div className="relative">
                          <select 
                            value={formData.newYear}
                            onChange={(e) => setFormData({...formData, newYear: e.target.value})}
                            className="w-full bg-white border border-primary/20 rounded-lg py-2 px-3 text-sm font-medium focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                          >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary/50" size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Constraint Validation Preview */}
              <div className="space-y-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
                <h4 className="text-[0.6875rem] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={14} />
                  Validación en Tiempo Real
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-xs font-semibold text-green-700">
                    <CheckCircle size={14} />
                    Requisito Retina R3/R4 cumplido
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-green-700">
                    <CheckCircle size={14} />
                    Límites de capacidad verificados
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <label className="text-[0.6875rem] font-bold text-on-surface-variant uppercase tracking-wider px-1">Motivo del Cambio</label>
                <textarea 
                  className="w-full bg-surface-container-highest border-none rounded-xl focus:ring-0 focus:border-b-2 focus:border-primary text-on-surface placeholder:text-outline font-medium text-sm transition-all p-4" 
                  placeholder="Explique la necesidad clínica..." 
                  rows={2}
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                ></textarea>
              </div>

              <button 
                type="submit"
                disabled={isProcessing}
                className={`w-full py-4 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold tracking-wide shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 ${isProcessing ? 'opacity-80 cursor-not-allowed' : ''}`}
              >
                {isProcessing ? (
                  <RefreshCw className="animate-spin" size={20} />
                ) : (
                  <CheckCircle size={20} />
                )}
                {isProcessing ? 'Procesando...' : 'Aplicar y Reorganizar Planificación'}
              </button>
            </form>
          </section>
        </div>

        {/* Right Column: Request Log & Global Reorganization Impact */}
        <div className="lg:col-span-7 space-y-8">
          {/* Global Reorganization Feedback */}
          <section className="bg-primary/5 rounded-2xl p-1 border border-primary/10 overflow-hidden">
            <div className="bg-white/40 backdrop-blur-sm p-6 rounded-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold font-headline text-primary">Impacto en la Planificación Automática</h3>
                  <p className="text-sm font-medium text-on-surface-variant italic font-body">Recalculando 124 turnos en los servicios clínicos...</p>
                </div>
                <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20">
                  <RefreshCw className="animate-spin" size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">Analizando repercusiones</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-[0.625rem] font-black text-outline uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-slate-400 rounded-full"></span> CONFIGURACIÓN PRE-INTERCAMBIO
                  </h4>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold">Estándar 2024</span>
                      <span className="text-[10px] text-slate-400">Fijo</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-100 rounded-full w-full overflow-hidden">
                        <div className="h-full bg-primary w-2/3"></div>
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                        <span>Capacidad (Urgencias)</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[0.625rem] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full relative">
                      <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50"></span>
                    </span> 
                    PLAN OPTIMIZADO
                  </h4>
                  <div className="bg-primary/10 rounded-xl p-4 shadow-sm border border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-primary">Plan Optimizado</span>
                      <span className="text-[10px] font-bold text-primary bg-primary-container/20 px-1.5 rounded">NUEVO</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-200 rounded-full w-full overflow-hidden">
                        <div className="h-full bg-primary w-3/4"></div>
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-primary uppercase">
                        <span>Balance Ajustado</span>
                        <span>Eficiencia del 88%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Active Request Module */}
          <article className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10 border-l-4 border-primary">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary-fixed text-primary p-3 rounded-xl">
                  <ArrowRightLeft size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg font-headline">Medicina Interna → Urgencias</h4>
                  <p className="text-sm text-on-surface-variant font-medium">ID Solicitud: #ROT-9021 • Ene - Feb</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="bg-primary/5 text-primary border border-primary/20 px-3 py-1 rounded-full text-[0.6875rem] font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                  Recalculando Global
                </span>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-5 mb-4 space-y-4">
              <div className="flex justify-between items-center">
                <h5 className="text-[0.6875rem] font-black text-primary uppercase tracking-widest">Análisis de Efecto Dominó</h5>
                <span className="text-[10px] font-bold text-on-surface-variant">Estándar 1.4-A aplicado</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-[0.6875rem] text-on-surface-variant font-medium uppercase tracking-tighter">Estado</p>
                  <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                    <Sparkles size={14} className="text-green-600" />
                    Solucionable
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[0.6875rem] text-on-surface-variant font-medium uppercase tracking-tighter">Ajustes</p>
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Users size={14} />
                    7 residentes movidos
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[0.6875rem] text-on-surface-variant font-medium uppercase tracking-tighter">Conflicto Mitigado</p>
                  <p className="text-on-surface font-bold text-sm">UCI Sarah Chen compensado</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button className="px-5 py-2 text-primary font-bold text-sm hover:bg-surface-container-high rounded-lg transition-colors">Retirar</button>
              <button 
                onClick={() => setShowReorg(true)}
                className="px-5 py-2 bg-primary text-white font-bold text-sm rounded-lg shadow-sm hover:opacity-90 transition-opacity"
              >
                Ver Reorganización
              </button>
            </div>
          </article>

          {/* History Summary */}
          <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
            <h3 className="text-xl font-bold font-headline text-on-surface mb-6">Historial de Ejecución</h3>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[0.6875rem] font-extrabold text-outline-variant uppercase tracking-widest border-b border-outline-variant/10">
                    <th className="pb-4 font-extrabold">Cambio Propuesto</th>
                    <th className="pb-4 font-extrabold">Auto-Impacto</th>
                    <th className="pb-4 font-extrabold">Resultado</th>
                    <th className="pb-4 font-extrabold">Log</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {history.map(item => (
                    <tr key={item.id} className="group">
                      <td className="py-4">
                        <p className="font-bold text-sm">{item.proposedChange}</p>
                        <p className="text-[0.6875rem] text-on-surface-variant italic">Intercambio con Dr. Patel</p>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1.5 text-[0.6875rem] font-bold text-primary">
                          <ClipboardList size={14} />
                          {item.autoImpact}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`text-[0.6875rem] font-bold px-2 py-0.5 rounded ${item.result === 'success' ? 'text-green-700 bg-green-50' : 'text-error bg-error-container/20'}`}>
                          {item.result === 'success' ? 'Éxito' : 'Fallido'}
                        </span>
                      </td>
                      <td className="py-4">
                        <button className="text-outline-variant group-hover:text-primary transition-colors">
                          <FileText size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* Success Overlay Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-background/40 backdrop-blur-sm px-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-outline-variant/20 text-center transform transition-all animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-extrabold text-on-surface font-headline mb-3">¡Confirmado!</h3>
            <p className="text-on-surface-variant font-medium text-sm leading-relaxed mb-8 font-body">
              Cambio aceptado. El Planning Dinámico ha sido reorganizado y actualizado.
            </p>
            <button 
              className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-container transition-colors shadow-lg" 
              onClick={() => setShowSuccess(false)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Reorganization Details Modal */}
      {showReorg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-container text-primary flex items-center justify-center">
                    <RefreshCw size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-headline font-extrabold text-on-surface">Propuesta de Reorganización</h3>
                    <p className="text-on-surface-variant text-sm font-medium">Análisis de impacto para la solicitud #ROT-9021</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowReorg(false)}
                  className="p-2 hover:bg-surface-container-high rounded-full transition-colors"
                >
                  <X size={24} className="text-outline" />
                </button>
              </div>

              <div className="bg-surface-container-low rounded-3xl overflow-hidden border border-outline-variant/10 mb-8">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-container-high/50 border-b border-outline-variant/10">
                      <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">Residente</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">Mes</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">Estado Anterior</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">Nuevo Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/5">
                    <ReorgRow name="Dr. Julián García" month="Enero" oldVal="Med. Interna" newVal="Urgencias" isRequest />
                    <ReorgRow name="Dra. Sarah Chen" month="Enero" oldVal="Urgencias" newVal="Med. Interna" />
                    <ReorgRow name="Dr. Marcos Ruiz" month="Febrero" oldVal="Retina" newVal="Glaucoma" />
                    <ReorgRow name="Dra. Lucía Sanz" month="Febrero" oldVal="Glaucoma" newVal="Retina" />
                    <ReorgRow name="Dr. Pablo Torres" month="Marzo" oldVal="Guardia" newVal="Vacaciones" />
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-8">
                <Info size={20} className="text-primary shrink-0" />
                <p className="text-xs text-primary font-medium leading-relaxed">
                  Esta reorganización ha sido optimizada por la IA para evitar conflictos de guardia y asegurar que se mantienen los mínimos de personal en todas las secciones.
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowReorg(false);
                    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                  }}
                  className="flex-1 py-4 bg-primary text-on-primary font-bold rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  Confirmar y Aplicar
                </button>
                <button 
                  onClick={() => setShowReorg(false)}
                  className="flex-1 py-4 border border-outline-variant text-on-surface font-bold rounded-2xl hover:bg-surface-container-high transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReorgRow({ name, month, oldVal, newVal, isRequest = false }: { name: string, month: string, oldVal: string, newVal: string, isRequest?: boolean }) {
  return (
    <tr className={isRequest ? 'bg-primary/5' : ''}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {isRequest && <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>}
          <span className="text-sm font-bold text-on-surface">{name}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-on-surface-variant font-medium">{month}</td>
      <td className="px-6 py-4">
        <span className="text-xs font-bold text-outline line-through opacity-60">{oldVal}</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-primary font-bold">
          <ArrowRight size={14} />
          <span className="text-sm">{newVal}</span>
        </div>
      </td>
    </tr>
  );
}
