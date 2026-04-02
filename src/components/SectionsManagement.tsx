import React, { useState } from 'react';
import { 
  ArrowLeft, Plus, Search, Siren, Eye, Network, Droplets, User, Baby, 
  Edit2, Trash2, Palette, Stethoscope, FlaskConical, Activity, Pill,
  LayoutDashboard, Users, Calendar, Settings, Globe, CheckCircle
} from 'lucide-react';
import { MOCK_SECTIONS } from '../constants';
import { ClinicalSection } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

interface SectionsManagementProps {
  onBack: () => void;
  sections: ClinicalSection[];
  setSections: React.Dispatch<React.SetStateAction<ClinicalSection[]>>;
}

export default function SectionsManagement({ onBack, sections, setSections }: SectionsManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<ClinicalSection | null>(sections[0] || null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleDeleteSection = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the section when deleting
    try {
      await deleteDoc(doc(db, 'sections', id));
      if (selectedSection?.id === id) {
        setSelectedSection(sections.find(s => s.id !== id) || null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sections/${id}`);
    }
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
      setSelectedSection(newSec);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `sections/${newId}`);
    }
  };

  const handleLocalUpdate = (updatedSection: ClinicalSection) => {
    setSelectedSection(updatedSection);
    setSaveSuccess(false);
  };

  const handleSaveSection = async () => {
    if (!selectedSection) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await setDoc(doc(db, 'sections', selectedSection.id), selectedSection);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setSelectedSection(null);
      }, 1500);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `sections/${selectedSection.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSections = sections.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      {/* TopAppBar Shell */}
      <header className="fixed top-0 w-full z-50 bg-[#f7f9fc]/80 dark:bg-slate-900/80 backdrop-blur-xl flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors active:scale-95 transition-transform duration-200"
          >
            <ArrowLeft className="text-slate-500" size={20} />
          </button>
          <h1 className="font-headline font-bold text-xl tracking-tight text-[#00529B] dark:text-blue-400">Gestión de Secciones</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleAddSection}
            className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-full font-headline font-bold text-sm transition-all flex items-center gap-2 shadow-[0_4px_24px_rgba(25,28,30,0.04)]"
          >
            <Plus size={18} />
            <span className="hidden md:inline">Nueva Sección</span>
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-24 px-6 max-w-4xl mx-auto">
        {/* Descriptive Hero Section */}
        <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-md">
            <h2 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight leading-tight">
              Catálogo de <span className="text-primary-container">Rotaciones Clínicas</span>
            </h2>
            <p className="mt-3 text-on-surface-variant font-body leading-relaxed text-sm">
              Configure las áreas de especialidad para el programa de residencia. Defina colores distintivos para optimizar la visualización del calendario de guardias.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-surface-container-lowest p-4 rounded-full shadow-[0_4px_24px_rgba(25,28,30,0.04)] flex items-center gap-3">
              <span className="text-primary font-headline font-bold text-2xl">{sections.length.toString().padStart(2, '0')}</span>
              <span className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest leading-none">Secciones<br/>Activas</span>
            </div>
          </div>
        </section>

        {/* Search and Filter Bar */}
        <div className="mb-8 flex items-center bg-surface-container-low rounded-full px-5 py-3 gap-3 border-none">
          <Search className="text-outline" size={20} />
          <input 
            className="bg-transparent border-none focus:ring-0 w-full text-sm font-body text-on-surface" 
            placeholder="Buscar sección..." 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Section List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSections.map(section => (
            <SectionItem 
              key={section.id} 
              section={section} 
              active={selectedSection?.id === section.id}
              onClick={() => setSelectedSection(section)}
              onDelete={(e) => handleDeleteSection(section.id, e)}
            />
          ))}
          {/* Add New Section Card */}
          <button 
            onClick={handleAddSection}
            className="group bg-surface-container-low/30 p-5 rounded-full border-2 border-dashed border-outline-variant hover:bg-surface-container-low hover:border-primary transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <Plus size={24} />
            </div>
            <span className="font-headline font-bold text-on-surface-variant group-hover:text-primary transition-colors">Añadir Nueva Sección</span>
          </button>
        </div>

        {/* Editor Section */}
        {selectedSection ? (
          <div className="mt-12 bg-white/40 backdrop-blur-md rounded-[2rem] p-8 border border-white/40 shadow-[0_4px_24px_rgba(25,28,30,0.04)]">
            <h3 className="font-headline font-bold text-xl text-primary mb-6 flex items-center gap-2">
              <Palette size={24} />
              Editor de Etiquetas: {selectedSection.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Nombre de la Sección</label>
                <input 
                  className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface font-body focus:ring-2 focus:ring-primary-container" 
                  type="text" 
                  value={selectedSection.name}
                  onChange={(e) => handleLocalUpdate({...selectedSection, name: e.target.value})}
                />
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant pt-2">Icono Representativo</label>
                <div className="flex flex-wrap gap-2">
                  <IconButton active={selectedSection.icon === 'emergency'} icon={<Siren size={20} />} onClick={() => handleLocalUpdate({...selectedSection, icon: 'emergency'})} />
                  <IconButton active={selectedSection.icon === 'visibility'} icon={<Eye size={20} />} onClick={() => handleLocalUpdate({...selectedSection, icon: 'visibility'})} />
                  <IconButton active={selectedSection.icon === 'hub'} icon={<Network size={20} />} onClick={() => handleLocalUpdate({...selectedSection, icon: 'hub'})} />
                  <IconButton active={selectedSection.icon === 'opacity'} icon={<Droplets size={20} />} onClick={() => handleLocalUpdate({...selectedSection, icon: 'opacity'})} />
                  <IconButton active={selectedSection.icon === 'face'} icon={<User size={20} />} onClick={() => handleLocalUpdate({...selectedSection, icon: 'face'})} />
                  <IconButton active={selectedSection.icon === 'child_care'} icon={<Baby size={20} />} onClick={() => handleLocalUpdate({...selectedSection, icon: 'child_care'})} />
                  <IconButton active={selectedSection.icon === 'group'} icon={<Users size={20} />} onClick={() => handleLocalUpdate({...selectedSection, icon: 'group'})} />
                  <IconButton active={selectedSection.icon === 'public'} icon={<Globe size={20} />} onClick={() => handleLocalUpdate({...selectedSection, icon: 'public'})} />
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Color del Sistema</label>
                <div className="grid grid-cols-5 gap-3">
                  <ColorDot color="bg-error" active={selectedSection.color === 'bg-error'} onClick={() => handleLocalUpdate({...selectedSection, color: 'bg-error'})} />
                  <ColorDot color="bg-primary" active={selectedSection.color === 'bg-primary'} onClick={() => handleLocalUpdate({...selectedSection, color: 'bg-primary'})} />
                  <ColorDot color="bg-tertiary" active={selectedSection.color === 'bg-tertiary'} onClick={() => handleLocalUpdate({...selectedSection, color: 'bg-tertiary'})} />
                  <ColorDot color="bg-secondary" active={selectedSection.color === 'bg-secondary'} onClick={() => handleLocalUpdate({...selectedSection, color: 'bg-secondary'})} />
                  <ColorDot color="bg-blue-400" active={selectedSection.color === 'bg-blue-400'} onClick={() => handleLocalUpdate({...selectedSection, color: 'bg-blue-400'})} />
                  <ColorDot color="bg-teal-500" active={selectedSection.color === 'bg-teal-500'} onClick={() => handleLocalUpdate({...selectedSection, color: 'bg-teal-500'})} />
                  <ColorDot color="bg-indigo-600" active={selectedSection.color === 'bg-indigo-600'} onClick={() => handleLocalUpdate({...selectedSection, color: 'bg-indigo-600'})} />
                  <ColorDot color="bg-emerald-500" active={selectedSection.color === 'bg-emerald-500'} onClick={() => handleLocalUpdate({...selectedSection, color: 'bg-emerald-500'})} />
                  <ColorDot color="bg-amber-500" active={selectedSection.color === 'bg-amber-500'} onClick={() => handleLocalUpdate({...selectedSection, color: 'bg-amber-500'})} />
                  <ColorDot color="bg-rose-500" active={selectedSection.color === 'bg-rose-500'} onClick={() => handleLocalUpdate({...selectedSection, color: 'bg-rose-500'})} />
                </div>
                <div className="pt-4">
                  <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between">
                    <span className="text-sm font-medium text-on-surface-variant">Vista previa en calendario</span>
                    <div className={`${selectedSection.color} text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase`}>
                      {selectedSection.name.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-8 gap-3 items-center">
              {saveSuccess && (
                <span className="text-emerald-600 font-bold text-sm flex items-center gap-2 animate-pulse">
                  <CheckCircle size={18} />
                  ¡Cambios guardados!
                </span>
              )}
              <button 
                onClick={handleSaveSection}
                disabled={isSaving}
                className="bg-primary text-white px-8 py-3 rounded-xl font-headline font-bold text-sm shadow-lg hover:bg-primary-container active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle size={20} />
                )}
                Finalizar y Guardar
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-12 bg-white/40 backdrop-blur-md rounded-[2rem] p-12 border border-dashed border-primary/30 shadow-[0_4px_24px_rgba(25,28,30,0.04)] flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
              <Plus size={40} />
            </div>
            <h3 className="font-headline font-bold text-2xl text-on-surface mb-2">No hay sección seleccionada</h3>
            <p className="text-on-surface-variant mb-8 max-w-sm">Seleccione una sección de la lista para editarla o cree una nueva para añadirla al catálogo.</p>
            <button 
              onClick={handleAddSection}
              className="bg-primary text-white px-8 py-4 rounded-xl font-headline font-bold text-sm shadow-lg hover:bg-primary-container active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={20} />
              Crear Nueva Sección
            </button>
          </div>
        )}
      </main>

      {/* Persistent Action Bar */}
      <div className="fixed bottom-0 left-0 w-full h-24 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex items-center justify-center px-6 z-40">
        <div className="max-w-4xl w-full flex items-center justify-between">
          <p className="hidden md:block text-xs font-medium text-on-surface-variant">Gestione sus secciones y rotaciones clínicas</p>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              onClick={onBack}
              className="flex-1 md:flex-none px-8 py-3 rounded-full font-headline font-bold text-sm text-primary hover:bg-surface-container-high transition-colors"
            >
              Volver al Dashboard
            </button>
            <button 
              onClick={handleSaveSection}
              disabled={!selectedSection || isSaving}
              className="flex-1 md:flex-none px-10 py-3 rounded-full font-headline font-bold text-sm text-on-primary bg-gradient-to-br from-primary to-primary-container shadow-[0_4px_24px_rgba(25,28,30,0.04)] active:scale-95 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>

      {/* BottomNavBar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex justify-around items-center px-4 pb-safe z-50 shadow-[0_-4px_24px_rgba(25,28,30,0.04)]">
        <MobileNavItem icon={<LayoutDashboard size={20} />} label="Dashboard" />
        <MobileNavItem icon={<Users size={20} />} label="Residents" />
        <MobileNavItem icon={<Calendar size={20} />} label="Plan" active />
        <MobileNavItem icon={<Settings size={20} />} label="Settings" />
      </nav>

      {/* Floating Action Button */}
      <button 
        onClick={handleAddSection}
        className="fixed bottom-28 right-6 md:bottom-32 md:right-10 w-16 h-16 rounded-full bg-primary text-on-primary shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-40 lg:hidden"
      >
        <Plus size={32} />
      </button>
    </div>
  );
}

function SectionItem({ section, active = false, onClick, onDelete }: { section: ClinicalSection; active?: boolean; onClick?: () => void; onDelete?: (e: React.MouseEvent) => void; key?: string }) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'emergency': return <Siren size={24} />;
      case 'steth': return <Stethoscope size={24} />;
      case 'flask': return <FlaskConical size={24} />;
      case 'activity': return <Activity size={24} />;
      case 'pill': return <Pill size={24} />;
      case 'visibility': return <Eye size={24} />;
      case 'hub': return <Network size={24} />;
      case 'opacity': return <Droplets size={24} />;
      case 'face': return <User size={24} />;
      case 'child_care': return <Baby size={24} />;
      case 'group': return <Users size={24} />;
      case 'public': return <Globe size={24} />;
      default: return <Activity size={24} />;
    }
  };

  const getIconBg = (color: string) => {
    if (color === 'bg-error') return 'bg-error-container text-on-error-container';
    if (color === 'bg-secondary') return 'bg-secondary-container text-on-secondary-container';
    if (color === 'bg-primary') return 'bg-primary-fixed text-on-primary-fixed-variant';
    if (color === 'bg-tertiary') return 'bg-tertiary-fixed text-on-tertiary-fixed-variant';
    // Fallback for other colors using opacity
    return `${color}/20 ${color.replace('bg-', 'text-')}`;
  };

  return (
    <div 
      onClick={onClick}
      className={`group bg-surface-container-lowest p-5 rounded-full shadow-[0_4px_24px_rgba(25,28,30,0.04)] transition-all hover:translate-y-[-2px] flex items-center justify-between cursor-pointer border-2 ${
        active ? 'border-primary' : 'border-transparent'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getIconBg(section.color)}`}>
          {getIcon(section.icon)}
        </div>
        <div>
          <h3 className="font-headline font-bold text-on-surface">{section.name}</h3>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-2 rounded-full hover:bg-surface-container-high text-primary transition-colors">
          <Edit2 size={18} />
        </button>
        <button 
          onClick={onDelete}
          className="p-2 rounded-full hover:bg-error-container/30 text-error transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

function IconButton({ icon, active = false, onClick }: { icon: React.ReactNode, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
      active ? 'bg-surface-container-highest text-primary-container' : 'bg-surface-container text-outline hover:bg-surface-container-highest'
    }`}>
      {icon}
    </button>
  );
}

function ColorDot({ color, active = false, onClick }: { color: string, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`w-full aspect-square rounded-full ${color} cursor-pointer transition-all hover:scale-110 ${
      active ? 'border-4 border-white shadow-[0_4px_24px_rgba(25,28,30,0.04)] ring-2 ring-error/20' : ''
    }`}></div>
  );
}

function MobileNavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`flex flex-col items-center justify-center px-4 py-1.5 transition-all duration-200 cursor-pointer ${
      active 
        ? 'text-[#003b72] dark:text-blue-300 bg-[#eceef1] dark:bg-slate-800 rounded-xl' 
        : 'text-slate-400 dark:text-slate-500 hover:text-[#00529B] dark:hover:text-blue-400 active:scale-90'
    }`}>
      {icon}
      <span className="font-body text-[11px] font-medium uppercase tracking-wider">{label}</span>
    </div>
  );
}
