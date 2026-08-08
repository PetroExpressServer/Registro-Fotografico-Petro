import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, Calendar, Users, ArrowRight, Printer, History, RefreshCw, Trash2, Camera, UserCheck, FileText, Layers } from 'lucide-react';
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
        
        {/* Modal Top Header */}
        <div className="modal-header-bar">
          <div className="modal-header-info">
            <div className="modal-header-icon-box">
              <Calendar size={22} />
            </div>
            <div>
              <h3 className="modal-title">Informe del {formattedDate}</h3>
              <div className="modal-sub-row">
                <span className="modal-contract-tag">
                  <Layers size={13} /> {record.contract === 'PRINCIPAL' ? 'Contrato Principal' : 'Pabellón B2'}
                </span>
                <span className="modal-date-tag">{formattedDate}</span>
              </div>
            </div>
          </div>
          
          <button className="btn-modal-close" onClick={onClose} title="Cerrar ventana">
            <X size={20} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="modal-tabs-header">
          <button
            className={`modal-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            <span>📊 Resumen y Fotos Faltantes</span>
          </button>

          <button
            className={`modal-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <span>📜 Auditoría de Cambios ({auditLog.length})</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="modal-body history-detail-body">
          
          {activeTab === 'summary' && (
            <>
              {/* Executive Metrics Cards Grid */}
              <div className="modal-metrics-grid">
                
                {/* Metric 1: Global Status */}
                <div className={`modal-metric-card ${isGlobalComplete ? 'ok' : 'pending'}`}>
                  <div className="metric-header-row">
                    <span className="metric-card-label">Estado del Día</span>
                    {isGlobalComplete ? <CheckCircle size={20} className="text-ok" /> : <AlertTriangle size={20} className="text-warn" />}
                  </div>
                  <div className="metric-card-value">
                    {isGlobalComplete ? 'COMPLETO' : 'INCOMPLETO'}
                  </div>
                  <span className="metric-card-sub">{totalUploaded} de 29 fotos subidas</span>
                </div>

                {/* Metric 2: Missing Photos */}
                <div className="modal-metric-card warn">
                  <div className="metric-header-row">
                    <span className="metric-card-label">Fotos Faltantes</span>
                    <AlertTriangle size={20} className="text-warn" />
                  </div>
                  <div className="metric-card-value text-warn">
                    {totalMissing} pendientes
                  </div>
                  <span className="metric-card-sub">{isGlobalComplete ? 'Cero faltantes' : `Faltan ${totalMissing} foto(s)`}</span>
                </div>

                {/* Metric 3: Participating Supervisors */}
                <div className="modal-metric-card info">
                  <div className="metric-header-row">
                    <span className="metric-card-label">Supervisores</span>
                    <Users size={20} className="text-blue" />
                  </div>
                  <div className="metric-card-value text-blue">
                    {uniqueSupervisors.length} registrado(s)
                  </div>
                  <span className="metric-card-sub" title={uniqueSupervisors.join(', ')}>
                    {uniqueSupervisors.join(', ') || 'Sin especificar'}
                  </span>
                </div>

              </div>

              {/* Shift Breakdown Section */}
              <div className="modal-breakdown-section">
                <h4 className="section-title">Desglose por Turno y Fotos Faltantes</h4>

                <div className="shifts-grid-layout">
                  {shiftsList.map((shift, idx) => (
                    <div key={idx} className={`shift-breakdown-card ${shift.stats.isComplete ? 'ok' : 'pending'}`}>
                      <div className="shift-card-head">
                        <span className="shift-head-title">{shift.title}</span>
                        <span className={`shift-status-pill ${shift.stats.isComplete ? 'ok' : 'pending'}`}>
                          {shift.stats.isComplete ? `✓ Completo (${shift.stats.uploadedCount}/${shift.stats.total})` : `⚠️ Faltan ${shift.stats.missingCount} (${shift.stats.uploadedCount}/${shift.stats.total})`}
                        </span>
                      </div>

                      {shift.stats.missingSlots.length > 0 ? (
                        <div className="missing-photos-container">
                          <span className="missing-section-label">Fotos pendientes por subir:</span>
                          <div className="missing-tags-grid">
                            {shift.stats.missingSlots.map(slot => (
                              <span key={slot.id} className="missing-photo-tag">
                                ❌ {slot.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="complete-photos-box">
                          <span>✓ Todas las fotos de este turno fueron registradas correctamente.</span>
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
              <h4 className="section-title">📜 Registro de Auditoría (Trazabilidad de Cambios)</h4>
              <p className="audit-subtitle">Historial cronológico de subidas, modificaciones y eliminaciones por supervisor:</p>

              {auditLog.length === 0 ? (
                <div className="empty-audit-box">
                  <History size={40} className="empty-audit-icon" />
                  <p>No hay registros de auditoría detallados para esta fecha antigua.</p>
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

        {/* Modal Bottom Footer Actions */}
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
