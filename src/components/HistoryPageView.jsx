import React, { useState, useEffect } from 'react';
import { Calendar, FileText, CheckCircle, AlertTriangle, ChevronRight, Search, Printer, Eye, Users, ChevronLeft } from 'lucide-react';
import { TOTAL_SLOTS } from '../constants/structure';

export default function HistoryPageView({ records, onSelectRecord, onPrintRecord }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Sort records from newest to oldest
  const sortedRecords = [...records].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // Filter records by search term
  const filteredRecords = sortedRecords.filter(rec => {
    const term = searchTerm.toLowerCase();
    const formattedDate = (rec.date || '').toLowerCase();
    const supervisor = (rec.supervisor || '').toLowerCase();
    const contract = (rec.contract || '').toLowerCase();
    const auditSups = (rec.auditLog || []).map(a => a.supervisor.toLowerCase()).join(' ');
    return formattedDate.includes(term) || supervisor.includes(term) || contract.includes(term) || auditSups.includes(term);
  });

  // Calculate pagination 20 items per page
  const totalItems = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validPage = Math.min(currentPage, totalPages);
  
  const startIndex = (validPage - 1) * itemsPerPage;
  const pageRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="history-page-wrapper">
      
      {/* Page Header */}
      <div className="history-page-header">
        <div>
          <h2>📅 Historial de Registros Fotográficos</h2>
          <p>Lista de informes diarios guardados en el sistema, ordenados de 20 en 20 del más reciente al más antiguo</p>
        </div>

        {/* Search input */}
        <div className="history-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por fecha, supervisor o contrato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main List Body */}
      <div className="history-page-content">
        {filteredRecords.length === 0 ? (
          <div className="empty-history-state">
            <FileText size={52} className="empty-icon" />
            <h3>No se encontraron registros fotográficos</h3>
            <p>Los días que vaya registrando aparecerán listados aquí de 20 en 20.</p>
          </div>
        ) : (
          <div className="history-list-cards">
            {pageRecords.map((rec) => {
              const photosCount = Object.keys(rec.photos || {}).length;
              const totalSlots = TOTAL_SLOTS;
              const isComplete = photosCount === totalSlots;
              const missingCount = totalSlots - photosCount;

              const dParts = (rec.date || '').split('-');
              const formattedDate = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}/${dParts[0]}` : rec.date;

              // Collect unique supervisors who touched this record
              const slotMeta = rec.slotMeta || {};
              const auditLog = rec.auditLog || [];
              const supervisorsList = Array.from(new Set([
                rec.supervisor,
                ...Object.values(slotMeta).map(m => m.lastSupervisor),
                ...auditLog.map(a => a.supervisor)
              ])).filter(Boolean);

              return (
                <div
                  key={rec.id}
                  className={`history-card-row ${isComplete ? 'complete' : 'incomplete'}`}
                  onClick={() => onSelectRecord(rec)}
                >
                  {/* Left Column: Date & Status */}
                  <div className="history-card-main">
                    <div className="history-card-date-row">
                      <span className="history-card-date">{formattedDate}</span>
                      <span className={`status-pill-badge ${isComplete ? 'ok' : 'pending'}`}>
                        {isComplete ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
                        <span>{isComplete ? 'COMPLETO' : `INCOMPLETO (Faltan ${missingCount})`}</span>
                      </span>
                    </div>

                    <div className="history-card-meta">
                      <span>Contrato: <strong>{rec.contract === 'PRINCIPAL' ? 'Contrato Principal' : 'Pabellón B2'}</strong></span>
                      <span className="dot-sep">&bull;</span>
                      <span title="Supervisores participantes">
                        <Users size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        Supervisores: <strong>{supervisorsList.join(', ') || 'Sin especificar'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Counter & Actions */}
                  <div className="history-card-actions">
                    <div className="count-chip">
                      <span className="count-num">{photosCount}/29</span>
                      <span className="count-label">fotos</span>
                    </div>

                    <button
                      className="btn-history-view"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRecord(rec);
                      }}
                    >
                      <Eye size={15} />
                      <span>Ver Detalle / Auditoría</span>
                    </button>

                    <button
                      className="btn-history-pdf"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPrintRecord(rec);
                      }}
                      title="Imprimir / Exportar PDF"
                    >
                      <Printer size={15} />
                    </button>

                    <ChevronRight size={18} className="row-arrow" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 20-Item Pagination Controls Bar */}
        {filteredRecords.length > 0 && (
          <div className="history-pagination-bar">
            <div className="pagination-info">
              Mostrando <strong>{startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)}</strong> de <strong>{totalItems}</strong> informes
            </div>

            <div className="pagination-controls">
              <button
                className="btn-pagi-nav"
                disabled={validPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} /> <span>Anterior</span>
              </button>

              <div className="pagi-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => (
                  <button
                    key={pNum}
                    className={`btn-pagi-num ${validPage === pNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pNum)}
                  >
                    {pNum}
                  </button>
                ))}
              </div>

              <button
                className="btn-pagi-nav"
                disabled={validPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                <span>Siguiente</span> <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
