import React, { useState } from 'react';
import { 
  UserPlus, CheckCircle, ArrowRight, Edit, Trash2, Filter, 
  ChevronLeft, ChevronRight, Verified, BriefcaseMedical,
  Users, LayoutDashboard, CalendarDays, Siren, ClipboardList, ShieldAlert
} from 'lucide-react';
import { RESIDENTS } from '../constants';
import { Resident } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

interface ResidentsManagementProps {
  onBack: () => void;
  residents: Resident[];
  setResidents: React.Dispatch<React.SetStateAction<Resident[]>>;
}

export default function ResidentsManagement({ onBack, residents, setResidents }: ResidentsManagementProps) {
  const now = new Date();
  const currentAcademicYearStart = now.getMonth() < 4 ? now.getFullYear() - 1 : now.getFullYear();

  const [formData, setFormData] = useState<Partial<Resident>>({
    name: '',
    subLevel: 'A',
    entryYear: currentAcademicYearStart,
    entryMonth: 4, // May (typical start month)
    durationMonths: 48 // Default 4 years
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const calculateLevel = (entryYear: number, entryMonth: number) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let yearsCompleted = currentYear - entryYear;
    if (currentMonth < entryMonth) {
      yearsCompleted--;
    }

    const levelNum = Math.max(1, Math.min(4, yearsCompleted + 1));
    return `R${levelNum}`;
  };

  const currentCalculatedLevel = formData.entryYear !== undefined && formData.entryMonth !== undefined
    ? calculateLevel(formData.entryYear, formData.entryMonth)
    : 'R1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.entryYear === undefined || formData.entryMonth === undefined) return;

    const level = calculateLevel(formData.entryYear, formData.entryMonth);
    
    try {
      if (editingId) {
        const updatedResident: Resident = {
          id: editingId,
          name: formData.name!,
          level: level,
          subLevel: formData.subLevel as 'A' | 'B',
          entryYear: formData.entryYear,
          entryMonth: formData.entryMonth,
          durationMonths: formData.durationMonths,
          specialty: 'Oftalmología',
          progress: (parseInt(level.slice(1)) / 4) * 100
        };
        await setDoc(doc(db, 'residents', editingId), updatedResident);
        setEditingId(null);
      } else {
        const id = Math.random().toString(36).substr(2, 9);
        const residentToAdd: Resident = {
          id,
          name: formData.name,
          level: level,
          subLevel: formData.subLevel as 'A' | 'B',
          entryYear: formData.entryYear,
          entryMonth: formData.entryMonth,
          durationMonths: formData.durationMonths,
          specialty: 'Oftalmología',
          progress: (parseInt(level.slice(1)) / 4) * 100
        };
        await setDoc(doc(db, 'residents', id), residentToAdd);
      }

      setFormData({
        name: '',
        subLevel: 'A',
        entryYear: currentAcademicYearStart,
        entryMonth: 4,
        durationMonths: 48
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `residents/${editingId || 'new'}`);
    }
  };

  const handleEditClick = (resident: Resident) => {
    setEditingId(resident.id);
    setFormData({
      name: resident.name,
      subLevel: resident.subLevel,
      entryYear: resident.entryYear,
      entryMonth: resident.entryMonth,
      durationMonths: resident.durationMonths || 48
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    const now = new Date();
    const currentAcademicYearStart = now.getMonth() < 4 ? now.getFullYear() - 1 : now.getFullYear();
    setFormData({
      name: '',
      subLevel: 'A',
      entryYear: currentAcademicYearStart,
      entryMonth: 4,
      durationMonths: 48
    });
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteResident = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'residents', id));
      setDeleteConfirmId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `residents/${id}`);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-24">
      {/* Hero Section / Context */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight font-headline">Gestión de Residentes</h1>
          <p className="text-on-surface-variant max-w-md mt-2 font-body">Gestione las rotaciones clínicas, cohortes de entrada y trayectorias de progresión para el año académico 2024.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-2 rounded-xl text-sm font-medium shadow-sm">
            <BriefcaseMedical size={18} />
            {residents.length} Residentes en Total
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Registration Form Module */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-sm border border-outline-variant/10 sticky top-24">
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2 font-headline">
              {editingId ? <Edit size={24} /> : <UserPlus size={24} />}
              {editingId ? 'Editar Residente' : 'Añadir Residente'}
            </h2>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Nombre Completo</label>
                <input 
                  className="w-full bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary transition-all px-4 py-3 placeholder:text-outline-variant text-sm" 
                  placeholder="Dra. Elena Rodriguez" 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Año de Entrada</label>
                  <input 
                    className="w-full bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary transition-all px-4 py-3 text-sm" 
                    type="number" 
                    value={formData.entryYear}
                    onChange={(e) => setFormData({...formData, entryYear: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Mes de Entrada</label>
                  <select 
                    className="w-full bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary transition-all px-4 py-3 appearance-none text-sm"
                    value={formData.entryMonth}
                    onChange={(e) => setFormData({...formData, entryMonth: parseInt(e.target.value)})}
                  >
                    {months.map((month, index) => (
                      <option key={index} value={index}>{month}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Duración (Meses)</label>
                <input 
                  className="w-full bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary transition-all px-4 py-3 text-sm" 
                  type="number" 
                  value={formData.durationMonths}
                  onChange={(e) => setFormData({...formData, durationMonths: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="bg-primary-container/20 p-4 rounded-xl border border-primary/10">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-on-surface-variant">Nivel calculado:</span>
                  <span className="px-3 py-1 bg-primary text-on-primary font-bold text-sm rounded-lg shadow-sm">{currentCalculatedLevel}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Letra (A/B)</label>
                <div className="flex gap-2 p-1 bg-surface-container-high rounded-xl">
                  <button 
                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${formData.subLevel === 'A' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-outline hover:bg-white/50'}`} 
                    type="button"
                    onClick={() => setFormData({...formData, subLevel: 'A'})}
                  >
                    Letra A
                  </button>
                  <button 
                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${formData.subLevel === 'B' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-outline hover:bg-white/50'}`} 
                    type="button"
                    onClick={() => setFormData({...formData, subLevel: 'B'})}
                  >
                    Letra B
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button className="w-full mt-4 py-4 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold tracking-tight shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  {editingId ? <CheckCircle size={20} /> : <UserPlus size={20} />}
                  {editingId ? 'Guardar Cambios' : 'Añadir Residente'}
                </button>
                {editingId && (
                  <button 
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full py-3 rounded-full border border-outline-variant text-outline font-bold text-sm hover:bg-surface-container-high transition-all"
                  >
                    Cancelar Edición
                  </button>
                )}
              </div>
            </form>
          </div>
        </aside>

        {/* Residents Management Table Module */}
        <section className="lg:col-span-8">
          <div className="bg-surface-container-lowest rounded-[2rem] shadow-sm overflow-hidden border border-outline-variant/10">
            <div className="px-8 py-6 flex justify-between items-center bg-white/50">
              <h2 className="text-xl font-bold text-primary font-headline">Listado de Residentes</h2>
              <div className="flex items-center gap-4">
                <div className="flex bg-surface-container-low rounded-lg p-1">
                  <button className="px-3 py-1 text-xs font-bold bg-white text-primary rounded-md shadow-sm">Activos</button>
                  <button className="px-3 py-1 text-xs font-medium text-outline">Egresados</button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left border-b border-surface-container">
                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Residente</th>
                    <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">Fecha de Ingreso</th>
                    <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">Nivel</th>
                    <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Progreso Académico</th>
                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-right">Letra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {residents.map(resident => (
                    <tr key={resident.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                            resident.level === 'R4' ? 'bg-primary-fixed text-primary' : 
                            resident.level === 'R3' ? 'bg-tertiary-fixed text-tertiary' : 
                            resident.level === 'R2' ? 'bg-secondary-fixed text-on-secondary-container' : 
                            'bg-surface-container-highest text-outline'
                          }`}>
                            {resident.name.split(' ').pop()?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-on-surface">{resident.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-center">
                        <span className="text-xs font-medium text-on-surface-variant">{resident.entryYear}</span>
                      </td>
                      <td className="px-4 py-5 text-center">
                        <span className="px-2 py-1 bg-primary-fixed text-primary font-bold text-[10px] rounded-md">{resident.level}</span>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden flex">
                            <div className="h-full bg-primary" style={{ width: `${resident.progress}%` }}></div>
                          </div>
                          {resident.progress === 100 && <Verified size={16} className="text-primary" />}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                          <div className="relative flex items-center justify-end gap-2">
                            {deleteConfirmId === resident.id ? (
                              <div className="flex items-center gap-2 bg-error-container p-1 rounded-lg animate-in fade-in zoom-in duration-200">
                                <span className="text-[10px] font-bold text-error px-2">¿Borrar?</span>
                                <button 
                                  onClick={() => handleDeleteResident(resident.id)}
                                  className="bg-error text-white px-2 py-1 rounded-md text-[10px] font-bold hover:bg-error/90 transition-colors"
                                >
                                  Sí
                                </button>
                                <button 
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="bg-surface-container-highest text-on-surface-variant px-2 py-1 rounded-md text-[10px] font-bold hover:bg-surface-container-highest/80 transition-colors"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs ${
                                  resident.subLevel === 'A' ? 'bg-secondary-fixed text-on-secondary-container' : 'border border-outline-variant text-outline group-hover:bg-white transition-all'
                                }`}>
                                  {resident.subLevel}
                                </span>
                                <button 
                                  onClick={() => handleEditClick(resident)}
                                  className="p-1 hover:text-primary transition-colors" 
                                  title="Editar"
                                >
                                  <Edit size={18} />
                                </button>
                                <button 
                                  onClick={() => setDeleteConfirmId(resident.id)}
                                  className="p-1 hover:text-error transition-colors" 
                                  title="Eliminar"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-8 py-4 bg-surface-container-low flex items-center justify-between">
              <p className="text-[10px] text-outline font-medium tracking-wide">MOSTRANDO {residents.length} DE 24 RESIDENTES</p>
              <div className="flex gap-2">
                <button className="p-1 hover:bg-white rounded-md text-outline active:scale-90 transition-all">
                  <ChevronLeft size={18} />
                </button>
                <button className="p-1 hover:bg-white rounded-md text-outline active:scale-90 transition-all">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
