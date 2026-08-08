import React from 'react';
import { User, Calendar as CalendarIcon, FileText, Stamp, PenTool } from 'lucide-react';

export default function ControlPanel({
  supervisor,
  setSupervisor,
  supervisorsList,
  date,
  setDate,
  contract,
  setContract,
  applyWatermark,
  setApplyWatermark,
  totalUploaded,
  totalSlots,
  onOpenSignature
}) {
  const pct = Math.round((totalUploaded / totalSlots) * 100);

  return (
    <div className="panel-container">
      <div className="panel-grid">
        
        {/* Supervisor */}
        <div className="input-group">
          <label><User size={14} /> Supervisor Responsable</label>
          <input
            type="text"
            className="input-field"
            value={supervisor}
            onChange={(e) => setSupervisor(e.target.value)}
            list="supList"
            placeholder="Ingrese o seleccione supervisor"
          />
          <datalist id="supList">
            {supervisorsList.map((sup, idx) => (
              <option key={idx} value={sup} />
            ))}
          </datalist>
        </div>

        {/* Date */}
        <div className="input-group">
          <label><CalendarIcon size={14} /> Fecha del Registro</label>
          <input
            type="date"
            className="input-field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Contract */}
        <div className="input-group">
          <label><FileText size={14} /> Contrato / Pabellón</label>
          <select
            className="input-field"
            value={contract}
            onChange={(e) => setContract(e.target.value)}
          >
            <option value="PRINCIPAL">Contrato Principal (Pabellones A-D, Zonas, Alfalfa)</option>
            <option value="B2">Contrato Pabellón B2</option>
          </select>
        </div>

        {/* Options */}
        <div className="input-group">
          <label><Stamp size={14} /> Marca de Agua</label>
          <div className="checkbox-row">
            <input
              type="checkbox"
              id="chkWatermark"
              checked={applyWatermark}
              onChange={(e) => setApplyWatermark(e.target.checked)}
            />
            <label htmlFor="chkWatermark" className="chk-label">
              Estampar fecha, hora y datos
            </label>
          </div>
        </div>

        {/* Signature Action */}
        <div className="input-group" style={{ flex: '0 0 auto' }}>
          <label><PenTool size={14} /> Firma Digital</label>
          <button className="btn-secondary" onClick={onOpenSignature}>
            ✍️ Firma Supervisor
          </button>
        </div>

      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-info">
          <span>Avance General del Registro ({contract === 'PRINCIPAL' ? 'Principal' : 'Pabellón B2'})</span>
          <span className="pct-text">{pct}% ({totalUploaded} / {totalSlots} fotos)</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }}></div>
        </div>
      </div>
    </div>
  );
}
