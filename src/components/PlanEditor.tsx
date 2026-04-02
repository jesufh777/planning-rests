import React, { useState, useEffect } from 'react';
import { 
  Settings, PlusCircle, Siren, Eye, BriefcaseMedical, Trash2, Globe, 
  Sparkles, MessageSquare, Send, CheckCircle, Info, LayoutDashboard, 
  Users, Calendar, ClipboardList, Plus, ArrowRight, Network, Droplets, User, Baby
} from 'lucide-react';
import { MOCK_SECTIONS } from '../constants';
import { RotationBlock, GlobalRule, MasterPlan, ClinicalSection } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface PlanEditorProps {
  onBack: () => void;
  masterPlan: MasterPlan;
  setMasterPlan: React.Dispatch<React.SetStateAction<MasterPlan>>;
  sections: ClinicalSection[];
  setSections: React.Dispatch<React.SetStateAction<ClinicalSection[]>>;
}

export default function PlanEditor({ onBack, masterPlan, setMasterPlan, sections, setSections }: PlanEditorProps) {
  const [currentPGY, setCurrentPGY] = useState(1);
  const [localMasterPlan, setLocalMasterPlan] = useState<MasterPlan>(masterPlan);
  
  useEffect(() => {
    setLocalMasterPlan(masterPlan);
  }, [masterPlan]);
  const [rules, setRules] = useState<GlobalRule[]>([
    { id: '1', text: 'Permitir R1/R2 con R3/R4 en Glaucoma', active: false, type: 'exception' }
  ]);
  const [newRuleText, setNewRuleText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentBlocksA = localMasterPlan[currentPGY].blocksA;
  const currentBlocksB = localMasterPlan[currentPGY].blocksB;

  const handleAddBlock = (resident: 'A' | 'B') => {
    const newBlock: RotationBlock = {
      id: Math.random().toString(36).substr(2, 9),
      sectionId: sections[0].id,
      duration: 3
    };
    
    setLocalMasterPlan(prev => ({
      ...prev,
      [currentPGY]: {
        ...prev[currentPGY],
        [resident === 'A' ? 'blocksA' : 'blocksB']: [
          ...(resident === 'A' ? prev[currentPGY].blocksA : prev[currentPGY].blocksB),
          newBlock
        ]
      }
    }));
  };

  const handleRemoveBlock = (resident: 'A' | 'B', id: string) => {
    setLocalMasterPlan(prev => ({
      ...prev,
      [currentPGY]: {
        ...prev[currentPGY],
        [resident === 'A' ? 'blocksA' : 'blocksB']: (resident === 'A' ? prev[currentPGY].blocksA : prev[currentPGY].blocksB).filter(b => b.id !== id)
      }
    }));
  };

  const handleUpdateBlock = (resident: 'A' | 'B', index: number, updates: Partial<RotationBlock>) => {
    setLocalMasterPlan(prev => {
      const blocks = [...(resident === 'A' ? prev[currentPGY].blocksA : prev[currentPGY].blocksB)];
      blocks[index] = { ...blocks[index], ...updates };
      return {
        ...prev,
        [currentPGY]: {
          ...prev[currentPGY],
          [resident === 'A' ? 'blocksA' : 'blocksB']: blocks
        }
      };
    });
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      console.log('Saving Master Plan to Firestore:', localMasterPlan);
      
      // Ensure keys are strings for Firestore
      const dataToSave: any = {};
      Object.keys(localMasterPlan).forEach(key => {
        dataToSave[key] = localMasterPlan[Number(key)];
      });

      await setDoc(doc(db, 'config', 'masterPlan'), dataToSave);
      setMasterPlan(localMasterPlan);
      setSaveSuccess(true);
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (e) {
      console.error('Error saving master plan:', e);
      setSaveError('Error al guardar los cambios. Verifique sus permisos.');
      handleFirestoreError(e, OperationType.WRITE, 'config/masterPlan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRule = () => {
    if (!newRuleText.trim()) return;
    const newRule: GlobalRule = {
      id: Math.random().toString(36).substr(2, 9),
      text: newRuleText,
      active: true,
      type: 'constraint'
    };
    setRules([...rules, newRule]);
    setNewRuleText('');
  };

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const handleAddSection = async () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newSec: ClinicalSection = {
      id: newId,
      name: 'Nueva Sección',
      icon: 'steth',
      color: 'bg-primary'
    };
    try {
      await setDoc(doc(db, 'sections', newId), newSec);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `sections/${newId}`);
    }
  };

  const getSectionIcon = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return <BriefcaseMedical size={24} />;
    
    switch (section.icon) {
      case 'emergency': return <Siren size={24} />;
      case 'visibility': return <Eye size={24} />;
      case 'hub': return <Network size={24} />;
      case 'opacity': return <Droplets size={24} />;
      case 'face': return <User size={24} />;
      case 'child_care': return <Baby size={24} />;
      case 'group': return <Users size={24} />;
      case 'public': return <Globe size={24} />;
      default: return <BriefcaseMedical size={24} />;
    }
  };

  return (
    <div className="bg-background font-body text-on-surface min-h-screen pb-48">
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div>
          <span className="font-label text-primary font-semibold tracking-wider uppercase text-xs mb-2 block">Configuración Académica</span>
          <div className="flex items-center gap-4">
            <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">Editor de Plan con Reglas IA</h2>
            <button 
              onClick={handleAddSection}
              className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
              title="Añadir Nueva Sección"
            >
              <Plus size={24} />
            </button>
          </div>
          <p className="text-on-surface-variant mt-2 max-w-2xl font-body">Edite la duración y secuencia de bloques para los residentes. El sistema validará automáticamente la carga horaria y solapamientos.</p>
        </div>
        <div className="flex gap-3">
          {saveError && (
            <div className="flex items-center gap-2 px-4 py-2 bg-error/10 text-error rounded-xl text-sm font-bold border border-error/20">
              <Siren size={16} />
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-sm font-bold border border-emerald-500/20 animate-pulse">
              <CheckCircle size={16} />
              ¡Cambios guardados con éxito!
            </div>
          )}
          <button 
            onClick={onBack}
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-surface-container-high text-primary font-bold transition-all hover:bg-surface-container-highest active:scale-95 disabled:opacity-50"
          >
            Descartar
          </button>
          <button 
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>
      </div>

      {/* Year Tabs */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2 custom-scrollbar">
        {[1, 2, 3, 4].map(pgy => (
          <button 
            key={pgy}
            onClick={() => setCurrentPGY(pgy)}
            className={`px-8 py-4 rounded-xl font-bold transition-all shrink-0 text-left ${
              currentPGY === pgy 
                ? 'bg-primary text-on-primary shadow-lg' 
                : 'bg-white text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            PGY-{pgy} 
            <span className={`block text-[10px] font-normal uppercase tracking-widest mt-1 ${currentPGY === pgy ? 'opacity-80' : 'opacity-60'}`}>
              {pgy === 1 ? 'Primer Año' : pgy === 2 ? 'Segundo Año' : pgy === 3 ? 'Tercer Año' : 'Cuarto Año'}
            </span>
          </button>
        ))}
      </div>

      {/* Parallel Comparison Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start mb-16">
        {/* Residente A Column */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-primary rounded-full"></div>
              <h3 className="font-headline text-2xl font-bold tracking-tight">Residente A</h3>
            </div>
            <button 
              onClick={() => handleAddBlock('A')}
              className="flex items-center gap-2 text-primary font-bold text-sm hover:underline"
            >
              <PlusCircle size={18} />
              Añadir Bloque
            </button>
          </div>
          <div className="space-y-4 flex flex-col">
            {localMasterPlan[currentPGY].blocksA.map((block, index) => (
              <div key={block.id} className="flex flex-col items-center gap-0">
                <div className="flex items-center gap-4 w-full group">
                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-xs font-bold text-primary mb-1">{index + 1}º</span>
                    <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-primary shadow-sm group-hover:shadow-md transition-all">
                      {getSectionIcon(block.sectionId)}
                    </div>
                  </div>
                  <div className="flex-grow bg-surface-container-lowest p-5 rounded-full shadow-sm flex items-center gap-4 group-hover:shadow-md transition-all border border-outline-variant/10">
                    <div className="flex-grow grid grid-cols-2 gap-4">
                      <div className="relative z-10">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter absolute -top-2 left-3 bg-white px-1 z-20">Sección</label>
                        <select 
                          className="w-full bg-white border border-outline-variant/30 rounded-lg text-on-surface font-semibold focus:ring-1 focus:ring-primary cursor-pointer py-2 px-3 text-sm appearance-none"
                          value={block.sectionId}
                          onChange={(e) => handleUpdateBlock('A', index, { sectionId: e.target.value })}
                        >
                          {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="relative z-10">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter absolute -top-2 left-3 bg-white px-1 z-20">Duración</label>
                        <select 
                          className="w-full bg-white border border-outline-variant/30 rounded-lg text-on-surface font-semibold focus:ring-1 focus:ring-primary cursor-pointer py-2 px-3 text-sm appearance-none"
                          value={block.duration}
                          onChange={(e) => handleUpdateBlock('A', index, { duration: parseInt(e.target.value) })}
                        >
                          <option value={1}>1 Mes</option>
                          <option value={2}>2 Meses</option>
                          <option value={3}>3 Meses</option>
                          <option value={4}>4 Meses</option>
                          <option value={6}>6 Meses</option>
                        </select>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveBlock('A', block.id)}
                      className="p-2 text-slate-300 hover:text-error transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                {index < localMasterPlan[currentPGY].blocksA.length - 1 && <div className="w-0.5 h-6 bg-slate-200 -ml-16"></div>}
              </div>
            ))}
          </div>
        </section>

        {/* Residente B Column */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-tertiary rounded-full"></div>
              <h3 className="font-headline text-2xl font-bold tracking-tight">Residente B</h3>
            </div>
            <button 
              onClick={() => handleAddBlock('B')}
              className="flex items-center gap-2 text-primary font-bold text-sm hover:underline"
            >
              <PlusCircle size={18} />
              Añadir Bloque
            </button>
          </div>
          <div className="space-y-4 flex flex-col">
            {localMasterPlan[currentPGY].blocksB.map((block, index) => (
              <div key={block.id} className="flex flex-col items-center gap-0">
                <div className="flex items-center gap-4 w-full group">
                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-xs font-bold text-tertiary mb-1">{index + 1}º</span>
                    <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary shadow-sm group-hover:shadow-md transition-all">
                      {getSectionIcon(block.sectionId)}
                    </div>
                  </div>
                  <div className="flex-grow bg-surface-container-lowest p-5 rounded-full shadow-sm flex items-center gap-4 border-l-4 border-tertiary/20 group-hover:shadow-md transition-all border-y border-r border-outline-variant/10">
                    <div className="flex-grow grid grid-cols-2 gap-4">
                      <div className="relative z-10">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter absolute -top-2 left-3 bg-white px-1 z-20">Sección</label>
                        <select 
                          className="w-full bg-white border border-outline-variant/30 rounded-lg text-on-surface font-semibold focus:ring-1 focus:ring-primary cursor-pointer py-2 px-3 text-sm appearance-none"
                          value={block.sectionId}
                          onChange={(e) => handleUpdateBlock('B', index, { sectionId: e.target.value })}
                        >
                          {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="relative z-10">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter absolute -top-2 left-3 bg-white px-1 z-20">Duración</label>
                        <select 
                          className="w-full bg-white border border-outline-variant/30 rounded-lg text-on-surface font-semibold focus:ring-1 focus:ring-primary cursor-pointer py-2 px-3 text-sm appearance-none"
                          value={block.duration}
                          onChange={(e) => handleUpdateBlock('B', index, { duration: parseInt(e.target.value) })}
                        >
                          <option value={1}>1 Mes</option>
                          <option value={2}>2 Meses</option>
                          <option value={3}>3 Meses</option>
                          <option value={4}>4 Meses</option>
                          <option value={6}>6 Meses</option>
                        </select>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveBlock('B', block.id)}
                      className="p-2 text-slate-300 hover:text-error transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                {index < localMasterPlan[currentPGY].blocksB.length - 1 && <div className="w-0.5 h-6 bg-slate-200 -ml-16"></div>}
              </div>
            ))}
            <button 
              onClick={() => handleAddBlock('B')}
              className="w-full py-6 border-2 border-dashed border-outline-variant rounded-full flex items-center justify-center gap-2 text-outline hover:bg-surface-container-low transition-colors group"
            >
              <Plus size={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-bold">Añadir rotación personalizada</span>
            </button>
          </div>
        </section>
      </div>

      {/* AI Global Rule Section */}
      <section className="mt-16 space-y-8 bg-surface-container-low/30 p-8 rounded-[2rem] border border-surface-variant/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between px-2 border-b border-outline-variant pb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Globe className="text-white" size={32} />
            </div>
            <div>
              <h3 className="font-headline text-3xl font-extrabold tracking-tight">Reglas Globales de Validación</h3>
              <p className="text-sm text-on-surface-variant font-medium mt-1 font-body">Estas reglas supervisan a los 8 residentes durante el ciclo completo de 4 años (PGY-1 a PGY-4).</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
            <Sparkles className="text-primary" size={16} />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">AI Global Assistant</span>
          </div>
        </div>

        {/* AI Input Box */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-surface-variant max-w-4xl mx-auto flex items-center gap-2 ring-4 ring-primary/5">
          <div className="flex-grow flex items-center gap-3 px-4">
            <MessageSquare className="text-primary/40" size={20} />
            <input 
              className="w-full border-none focus:ring-0 text-on-surface placeholder:text-slate-400 font-medium py-3 text-sm" 
              placeholder='Añadir regla global (ej: "Máximo 2 residentes en Retina sumando todos los años")' 
              type="text"
              value={newRuleText}
              onChange={(e) => setNewRuleText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
            />
          </div>
          <button 
            onClick={handleAddRule}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-container transition-all shadow-md active:scale-95 shrink-0"
          >
            <span>Añadir Regla</span>
            <Send size={16} />
          </button>
        </div>

        {/* Active Rules List */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {rules.map(rule => (
            <div key={rule.id} className={`bg-white border rounded-2xl p-5 flex items-center justify-between transition-all ${rule.active ? 'border-primary/20 shadow-sm' : 'border-slate-200 opacity-70'}`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${rule.active ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-400'}`}>
                  <Siren size={20} />
                </div>
                <div>
                  <p className={`font-semibold text-lg ${rule.active ? 'text-on-surface' : 'text-slate-500'}`}>{rule.text}</p>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${rule.active ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-400'}`}>
                      {rule.type === 'exception' ? 'Excepción Global' : 'Regla de Restricción'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={rule.active}
                    onChange={() => toggleRule(rule.id)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
                <button 
                  onClick={() => removeRule(rule.id)}
                  className="p-2 text-slate-300 hover:text-error transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Plan Integrity Footer */}
      <div className="mt-12 bg-white/60 backdrop-blur-xl border-t border-white p-8 rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-8">
          <div className="text-center md:text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Duración Total</p>
            <p className="text-2xl font-headline font-extrabold text-primary">12 <span className="text-sm font-bold opacity-60">MESES</span></p>
          </div>
          <div className="h-10 w-px bg-slate-200"></div>
          <div className="text-center md:text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estado de Integridad</p>
            <div className="flex items-center gap-2 text-emerald-600 font-bold">
              <CheckCircle size={14} />
              Plan Balanceado
            </div>
          </div>
          <div className="h-10 w-px bg-slate-200"></div>
          <div className="flex -space-x-3">
            <img 
              alt="Residente A" 
              className="w-10 h-10 rounded-full border-2 border-white object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKWYCrpz4JwQj8p4L3N7no0RD3nf4MjWP7TFpmkPXbts5dtxBhTXqOY6GPZjkVUw1UgglCCbdsyFRlLECNVqcKO3py_rk8WtCBS2P6bf863YVbrRJqjCL_kKh0T4x2Au9JvwRcpQ2M3A_3iqUJ_LZfHYWVMenNCCwX4ups83zoDewmEjKVqul4uLLz5xi11xi46DXoOPN3N2uljR1nHUGqEzb2Yrq3PSXl2AChDYdnJ5Iq6449xlyjaiRPREeDuIk-yPRs0RAOwX7t"
              referrerPolicy="no-referrer"
            />
            <img 
              alt="Residente B" 
              className="w-10 h-10 rounded-full border-2 border-white object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBSYuDPBJGaF5KjTEaJIMcyLSys_t1UO-lO6_JhT9aVWJIxh4Dw5xWB8IaM4zRk3tiy2KWPp95kg0RN5oZ_O-QPSDCtiNygYqaFrLyPLROLZYwkF7BUET_HmI4TuB_QvHjN0IsA8BBSWuImHltXtKjD_p8YwvHXku8MbPDhonxsTnYkraxn_vFlEXX_tJV8VK4QDXEQOHri1T_WBTiGuG5Shqd-J69qV526l-zjJTWr3IvdfynHB-xaTTzjMAzn6LVEjJk0uxFhSvo"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-secondary-container rounded-lg text-primary text-xs font-bold flex items-center gap-2">
            <Info size={14} />
            Cambios sin guardar
          </div>
          <button 
            onClick={handleSaveChanges}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg active:scale-95 transition-all"
          >
            Publicar Plan Maestro
          </button>
        </div>
      </div>
    </div>
  );
}
