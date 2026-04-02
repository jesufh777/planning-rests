import React from 'react';
import { ArrowLeft, CircleAlert, TriangleAlert, Info, ShieldAlert, Filter, Search, X, Calendar, Clock, User, MapPin } from 'lucide-react';
import { Alert } from '../types';
import { MOCK_ALERTS } from '../constants';

interface AlertsViewProps {
  onBack: () => void;
}

export default function AlertsView({ onBack }: AlertsViewProps) {
  const [alerts, setAlerts] = React.useState<Alert[]>(MOCK_ALERTS);
  const [filter, setFilter] = React.useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [selectedAlert, setSelectedAlert] = React.useState<Alert | null>(null);

  const filteredAlerts = alerts.filter(alert => 
    filter === 'all' ? true : alert.type === filter
  );

  const handleDismiss = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    if (selectedAlert?.id === id) {
      setSelectedAlert(null);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-24">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl flex items-center justify-between px-6 h-16 border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <ArrowLeft className="text-slate-500" size={20} />
          </button>
          <h1 className="font-headline font-bold text-xl tracking-tight text-blue-900 dark:text-blue-100">Centro de Alertas</h1>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-4xl mx-auto">
        {/* Hero Section */}
        <section className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-error-container flex items-center justify-center text-error">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-headline font-extrabold text-blue-900 tracking-tight">Alertas del Sistema</h2>
              <p className="text-on-surface-variant font-body text-sm">Supervise las inconsistencias y conflictos en la planificación clínica.</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mt-6">
            <FilterButton active={filter === 'all'} label="Todas" count={alerts.length} onClick={() => setFilter('all')} />
            <FilterButton active={filter === 'error'} label="Errores" count={alerts.filter(a => a.type === 'error').length} color="bg-error" onClick={() => setFilter('error')} />
            <FilterButton active={filter === 'warning'} label="Advertencias" count={alerts.filter(a => a.type === 'warning').length} color="bg-tertiary" onClick={() => setFilter('warning')} />
            <FilterButton active={filter === 'info'} label="Info" count={alerts.filter(a => a.type === 'info').length} color="bg-secondary" onClick={() => setFilter('info')} />
          </div>
        </section>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map(alert => (
              <AlertItem 
                key={alert.id} 
                alert={alert} 
                onViewDetails={() => setSelectedAlert(alert)}
                onDismiss={() => handleDismiss(alert.id)}
              />
            ))
          ) : (
            <div className="text-center py-20 bg-surface-container-low rounded-[2rem] border border-dashed border-outline-variant/30">
              <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-4 text-outline">
                <Search size={32} />
              </div>
              <p className="text-on-surface-variant font-medium">No se encontraron alertas con este filtro</p>
            </div>
          )}
        </div>
      </main>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  selectedAlert.type === 'error' ? 'bg-error-container text-error' :
                  selectedAlert.type === 'warning' ? 'bg-tertiary-fixed text-on-tertiary-fixed' :
                  'bg-secondary-fixed text-on-secondary-fixed'
                }`}>
                  {selectedAlert.type === 'error' ? <CircleAlert size={32} /> :
                   selectedAlert.type === 'warning' ? <TriangleAlert size={32} /> :
                   <Info size={32} />}
                </div>
                <button 
                  onClick={() => setSelectedAlert(null)}
                  className="p-2 hover:bg-surface-container-high rounded-full transition-colors"
                >
                  <X size={24} className="text-outline" />
                </button>
              </div>

              <h3 className="text-2xl font-headline font-extrabold text-on-surface mb-2">{selectedAlert.title}</h3>
              <p className="text-on-surface-variant leading-relaxed mb-8">{selectedAlert.description}</p>

              <div className="space-y-4 bg-surface-container-low p-6 rounded-3xl mb-8">
                <DetailRow icon={<Calendar size={18} />} label="Fecha" value="26 de Marzo, 2026" />
                <DetailRow icon={<Clock size={18} />} label="Hora" value="14:30" />
                <DetailRow icon={<User size={18} />} label="Afectado" value="Dr. Julián García (R2)" />
                <DetailRow icon={<MapPin size={18} />} label="Ubicación" value="Servicio de Urgencias" />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedAlert(null)}
                  className="flex-1 py-4 bg-primary text-on-primary font-bold rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                >
                  Entendido
                </button>
                <button 
                  onClick={() => handleDismiss(selectedAlert.id)}
                  className="flex-1 py-4 border border-outline-variant text-error font-bold rounded-2xl hover:bg-error-container/10 transition-colors"
                >
                  Descartar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-primary">{icon}</div>
      <div className="flex-1 flex justify-between items-center">
        <span className="text-xs font-bold text-outline uppercase tracking-wider">{label}</span>
        <span className="text-sm font-bold text-on-surface">{value}</span>
      </div>
    </div>
  );
}

function FilterButton({ label, count, active, color = 'bg-primary', onClick }: { label: string, count: number, active: boolean, color?: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${
        active 
          ? `${color} text-white shadow-md scale-105` 
          : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
      }`}
    >
      {label}
      <span className={`px-2 py-0.5 rounded-full text-[10px] ${active ? 'bg-white/20' : 'bg-surface-container-highest'}`}>
        {count}
      </span>
    </button>
  );
}

function AlertItem({ alert, onViewDetails, onDismiss }: { alert: Alert; key?: string; onViewDetails?: () => void; onDismiss?: () => void }) {
  const isError = alert.type === 'error';
  const isWarning = alert.type === 'warning';

  const getIcon = () => {
    if (isError) return <CircleAlert className="text-error" size={24} />;
    if (isWarning) return <TriangleAlert className="text-tertiary" size={24} />;
    return <Info className="text-secondary" size={24} />;
  };

  const getStyles = () => {
    if (isError) return 'border-error bg-error-container/5';
    if (isWarning) return 'border-tertiary bg-tertiary-fixed/5';
    return 'border-secondary bg-secondary-fixed/5';
  };

  return (
    <div className={`p-6 rounded-[1.5rem] border-l-8 shadow-sm bg-white dark:bg-slate-800 flex items-start gap-4 transition-transform hover:scale-[1.01] ${getStyles()}`}>
      <div className="mt-1">{getIcon()}</div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h3 className="font-headline font-bold text-on-surface">{alert.title}</h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Hace 2 horas</span>
        </div>
        <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{alert.description}</p>
        <div className="mt-4 flex gap-3">
          <button 
            onClick={onViewDetails}
            className="text-xs font-bold text-primary hover:underline"
          >
            Ver detalles
          </button>
          <button 
            onClick={onDismiss}
            className="text-xs font-bold text-outline hover:text-error transition-colors"
          >
            Descartar
          </button>
        </div>
      </div>
    </div>
  );
}
