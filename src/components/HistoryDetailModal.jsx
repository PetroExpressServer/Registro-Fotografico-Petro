import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, Calendar, User, ArrowRight, Printer, History, RefreshCw, Trash2, Camera, UserCheck } from 'lucide-react';
import { SHIFT_SLOTS } from '../constants/structure';

export default function HistoryDetailModal({ record, isOpen, onClose, onLoadRecord, onPrintRecord }) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'audit'

  if (!isOpen || !record) return null;

  const photos = record.photos || {};
  const slotMeta = record.slotMeta || {};
  const auditLog = record.auditLog || [];

  const totalSlots = 29;
  const dParts = (record.date || '').split('-');
  const formattedDate = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}/${dParts[0]}` : record.date;

  // Calculate detailed stats per shift
  const calculateShiftStats = (category, slotsList) => {
    const total = slotsList.length;
    const uploaded = slotsList.filter(s => !!photos[s.id]);
    const missing = slotsList.filter(s => !photos[s.id]);
    return {
      total,
      uploadedCount: uploaded.length,
      missingCount: missing.length,
      isComplete: uploaded.length === total,
      missingSlots: missing
    };
  };

  const t1Stats = calculateShiftStats('turno1', SHIFT_SLOTS.turno1);
  const t2Stats = calculateShiftStats('turno2', SHIFT_SLOTS.turno2);
  const t3Stats = calculateShiftStats('turno3', SHIFT_SLOTS.turno3);
  const otrasStats = calculateShiftStats('otras', SHIFT_SLOTS.otras);

  const totalUploaded = t1Stats.uploadedCount + t2Stats.uploadedCount + t3Stats.uploadedCount + otrasStats.uploadedCount;
  const totalMissing = totalSlots - totalUploaded;
  const isGlobalComplete = totalUploaded === totalSlots;

  // Extract unique supervisors who participated on this day
  const uniqueSupervisors = Array.from(new Set([
    record.supervisor,
    ...Object.values(slotMeta).map(m => m.lastSupervisor),
    ...auditLog.map(a => a.supervisor)
  ])).filter(Boolean);

  const shiftsList = [
    { title: '🌅 Turno 1 (06:00 - 14:00)', stats: t1Stats },
    { title: '☀️ Turno 2 (14:00 - 22:00)', stats: t2Stats },
    { title: '🌙 Turno 3 (22:00 - 06:00)', stats: t3Stats },
    { title: '🚜 Otras Actividades', stats: otrasStats },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="history-detail-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div className="detail-header-title">
            <Calendar size={20} className="header-icon" />
            <div>
              <h3>Informe del {formattedDate}</h3>
              <p>Contrato: <strong>{record.contract === 'PRINCIPAL' ? 'Contrato Principal' : 'Pabellón B2'}</strong></p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Navigation Tabs in Modal: Resumen vs Auditoría */}
        <div className="modal-tabs-header">
          <button
            className={`modal-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            📊 Resumen y Fotos Faltantes
          </button>

          <button
            className={`modal-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            📜 Trazabilidad / Auditoría de Cambios ({auditLog.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="modal-body history-detail-body">
          
          {activeTab === 'summary' && (
            <>
              {/* Top Metrics Cards */}
              <div className="metrics-row">
                
                <div className={`metric-box ${isGlobalComplete ? 'complete' : 'incomplete'}`}>
                  <span className="metric-label">Estado del Día</span>
                  <div className="metric-value-row">
                    {isGlobalComplete ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    <span className="metric-value">
                      {isGlobalComplete ? 'COMPLETO' : 'INCOMPLETO'}
                    </span>
                  </div>
                  <span className="metric-sub">{totalUploaded} de 29 fotos subidas</span>
                </div>

                <div className="metric-box warning">
                  <span className="metric-label">Fotos Faltantes</span>
                  <span className="metric-value text-amber">{totalMissing} pendientes</span>
                  <span className="metric-sub">{isGlobalComplete ? 'Cero faltantes' : `Faltan ${totalMissing} foto(s)`}</span>
                </div>

                <div className="metric-box info">
                  <span className="metric-label">Supervisores Participantes</span>
                  <span className="metric-value text-blue">{uniqueSupervisors.length} supervisor(es)</span>
                  <span className="metric-sub">{uniqueSupervisors.join(', ')}</span>
                </div>

              </div>

              {/* Breakdown per Shift */}
              <div className="shifts-breakdown-section">
                <h4>Desglose por Turno y Fotos Faltantes</h4>

                <div className="shifts-grid">
                  {shiftsList.map((shift, idx) => (
                    <div key={idx} className={`shift-status-card ${shift.stats.isComplete ? 'complete' : 'incomplete'}`}>
                      <div className="shift-card-header">
                        <span className="shift-title">{shift.title}</span>
                        <span className={`shift-badge ${shift.stats.isComplete ? 'ok' : 'pending'}`}>
                          {shift.stats.isComplete ? `✓ Completo (${shift.stats.uploadedCount}/${shift.stats.total})` : `⚠️ Faltan ${shift.stats.missingCount} (${shift.stats.uploadedCount}/${shift.stats.total})`}
                        </span>
                      </div>

                      {shift.stats.missingSlots.length > 0 ? (
                        <div className="missing-slots-list">
                          <span className="missing-label">❌ Fotos pendientes por subir:</span>
                          <ul className="missing-items">
                            {shift.stats.missingSlots.map(slot => (
                              <li key={slot.id}>• {slot.title}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="complete-msg">
                          <span>✓ Todas las fotos del turno fueron registradas</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'audit' && (
            <div className="audit-timeline-section">
              <h4>📜 Registro de Auditoría (Quién hizo qué cambio)</h4>
              <p className="audit-subtitle">Historial de subidas, cambios y eliminaciones por supervisor:</p>

              {auditLog.length === 0 ? (
                <div className="empty-audit-box">
                  <History size={36} />
                  <p>No hay registro de eventos detallados para esta fecha antigua.</p>
                </div>
              ) : (
                <div className="audit-timeline">
                  {[...auditLog].reverse().map((entry) => {
                    const timeObj = new Date(entry.timestamp);
                    const formattedTime = timeObj.toLocaleString('es-PE');

                    let icon = <Camera size={16} />;
                    let actionClass = 'action-upload';
                    let actionTag = '📸 SUBIDA';

                    if (entry.action === 'REPLACE') {
                      icon = <RefreshCw size={16} />;
                      actionClass = 'action-replace';
                      actionTag = '🔄 REEMPLAZO';
                    } else if (entry.action === 'DELETE') {
                      icon = <Trash2 size={16} />;
                      actionClass = 'action-delete';
                      actionTag = '🗑️ ELIMINACIÓN';
                    } else if (entry.action === 'CLEAR') {
                      icon = <Trash2 size={16} />;
                      actionClass = 'action-clear';
                      actionTag = '🧹 VACIADO';
                    }

                    return (
                      <div key={entry.id} className={`audit-item ${actionClass}`}>
                        <div className="audit-icon-box">{icon}</div>
                        <div className="audit-details">
                          <div className="audit-title-row">
                            <span className="audit-sup"><UserCheck size={14} /> <strong>{entry.supervisor}</strong></span>
                            <span className={`audit-tag ${actionClass}`}>{actionTag}</span>
                            <span className="audit-time">{formattedTime}</span>
                          </div>
                          <p className="audit-text">{entry.details}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={() => onPrintRecord(record)}>
            <Printer size={16} /> Ver / Imprimir PDF
          </button>
          
          <button className="btn-primary" onClick={() => onLoadRecord(record)}>
            <span>Cargar y Completar Registro</span>
            <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
