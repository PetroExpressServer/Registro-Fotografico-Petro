import React from 'react';
import { Calendar, ShieldCheck, History, Download, RefreshCw } from 'lucide-react';

export default function Header({ isExistingRecord, supervisor, onOpenCalendar, onExportJSON }) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="logo-badge">PL</div>
        <div className="brand-titles">
          <h2>Consorcio Petro Limpio</h2>
          <p>Informe Fotográfico Diario &bull; Gran Mercado Mayorista de Lima</p>
        </div>
      </div>

      <div className="header-actions">
        <div className={`status-pill ${isExistingRecord ? 'status-loaded' : 'status-new'}`}>
          <ShieldCheck size={16} />
          <span>
            {isExistingRecord ? `📌 En curso: ${supervisor || 'Supervisor'}` : '✨ Nuevo Registro Diario'}
          </span>
        </div>

        <button className="btn-icon" onClick={onOpenCalendar} title="Historial de Días">
          <Calendar size={18} />
          <span>Historial</span>
        </button>

        <button className="btn-icon" onClick={onExportJSON} title="Exportar Backup JSON">
          <Download size={18} />
        </button>
      </div>
    </header>
  );
}
