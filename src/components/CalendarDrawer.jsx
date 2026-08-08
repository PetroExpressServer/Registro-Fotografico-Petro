import React from 'react';
import { X, Calendar, FileText, CheckCircle, AlertTriangle, ChevronRight, Eye } from 'lucide-react';

export default function CalendarDrawer({ isOpen, onClose, records, onSelectDayDetail }) {
  if (!isOpen) return null;

  // Sort records by date descending (newest first)
  const sortedRecords = [...records].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="drawer-card history-drawer-card" onClick={(e) => e.stopPropagation()}>
        
        <div className="drawer-header">
          <div className="drawer-title">
            <Calendar size={20} className="title-icon" />
            <div>
              <h3>Historial de Registros Fotográficos</h3>
              <p>Seleccione un día para ver su estado y fotos faltantes</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="drawer-body">
          {sortedRecords.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} className="empty-icon" />
              <h4>No hay registros guardados</h4>
              <p>Inicie un nuevo registro diario desde la opción "Registrar Fotos".</p>
            </div>
          ) : (
            <div className="records-list">
              {sortedRecords.map((rec) => {
                const photosCount = Object.keys(rec.photos || {}).length;
                const totalSlots = 29;
                const isComplete = photosCount === totalSlots;
                const missingCount = totalSlots - photosCount;

                const dParts = (rec.date || '').split('-');
                const formattedDate = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}/${dParts[0]}` : rec.date;

                return (
                  <div
                    key={rec.id}
                    className={`record-card-item ${isComplete ? 'complete' : 'incomplete'}`}
                    onClick={() => onSelectDayDetail(rec)}
                  >
                    <div className="record-card-left">
                      <div className="record-card-date-row">
                        <span className="record-card-date">{formattedDate}</span>
                        <span className={`status-badge-pill ${isComplete ? 'ok' : 'pending'}`}>
                          {isComplete ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                          <span>{isComplete ? 'COMPLETO' : `INCOMPLETO (Faltan ${missingCount})`}</span>
                        </span>
                      </div>

                      <div className="record-card-sub">
                        <span>Contrato: <strong>{rec.contract === 'PRINCIPAL' ? 'Principal' : 'Pabellón B2'}</strong></span>
                        <span> &bull; </span>
                        <span>Supervisor: <strong>{rec.supervisor || 'Sin especificar'}</strong></span>
                      </div>
                    </div>

                    <div className="record-card-right">
                      <div className="photos-count-badge">
                        <span>{photosCount}/29</span>
                        <small>fotos</small>
                      </div>
                      <ChevronRight size={18} className="arrow-icon" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
