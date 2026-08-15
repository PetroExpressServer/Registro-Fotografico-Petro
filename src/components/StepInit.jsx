import React from 'react';
import { User, Calendar as CalendarIcon, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

export default function StepInit({
  supervisor,
  setSupervisor,
  supervisorsList,
  date,
  setDate,
  contract,
  setContract,
  isExistingRecord,
  existingPhotosCount,
  onProceed
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!supervisor || !supervisor.trim()) {
      alert('Por favor ingrese su nombre completo como supervisor.');
      return;
    }
    onProceed();
  };

  return (
    <div className="step-init-wrapper">
      <div className="step-init-card">
        <div className="step-card-header">
          <div className="badge-step">Paso 1 de 2</div>
          <h2>Registro Fotográfico Diario</h2>
          
          {/* Existing record notice badge inside header */}
          {isExistingRecord && (
            <div className="notice-banner">
              <ShieldCheck size={14} className="notice-icon" />
              <span>📌 <strong>Registro existente:</strong> {existingPhotosCount} foto(s) registrada(s)</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="step-form">
          
          {/* Supervisor */}
          <div className="form-group">
            <label><User size={15} /> Nombre del Supervisor</label>
            <input
              type="text"
              className="form-input"
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
              list="supervisorsDatalist"
              placeholder="Escriba su nombre completo aquí"
              required
            />
            <datalist id="supervisorsDatalist">
              {supervisorsList.map((sup, idx) => (
                <option key={idx} value={sup} />
              ))}
            </datalist>
          </div>

          {/* Fecha */}
          <div className="form-group">
            <label><CalendarIcon size={15} /> Fecha a Registrar</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Contrato */}
          <div className="form-group">
            <label><FileText size={15} /> Contrato / Pabellón</label>
            <select
              className="form-input"
              value={contract}
              onChange={(e) => setContract(e.target.value)}
            >
              <option value="PRINCIPAL">Contrato Principal (Pabellones A-D, Zonas, Alfalfa, Saneo)</option>
              <option value="B2">Contrato Pabellón B2</option>
            </select>
          </div>

          <div className="step-actions-footer">
            <button type="submit" className="btn-proceed">
              <span>Continuar a Registro</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
