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
    <div className="step-init-wrapper" style={{ paddingBottom: 'calc(180px + env(safe-area-inset-bottom))', overflowY: 'auto', minHeight: '100dvh' }}>
      <div className="step-init-card" style={{ marginBottom: '60px' }}>
        <div className="step-card-header">
          <div className="badge-step">Paso 1 de 2</div>
          <h2>Registro Fotográfico Diario</h2>
          <p>Ingrese su nombre completo de supervisor y seleccione la fecha para comenzar</p>
        </div>

        <form onSubmit={handleSubmit} className="step-form" style={{ gap: '1rem' }}>
          
          {/* Supervisor */}
          <div className="form-group">
            <label><User size={16} /> Nombre del Supervisor</label>
            <input
              type="text"
              className="form-input"
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
              list="supervisorsDatalist"
              placeholder="Escriba su nombre completo aquí"
              required
              onFocus={(e) => {
                setTimeout(() => {
                  e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
              }}
            />
            <datalist id="supervisorsDatalist">
              {supervisorsList.map((sup, idx) => (
                <option key={idx} value={sup} />
              ))}
            </datalist>
          </div>

          {/* Fecha */}
          <div className="form-group">
            <label><CalendarIcon size={16} /> Fecha a Registrar</label>
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
            <label><FileText size={16} /> Contrato / Pabellón</label>
            <select
              className="form-input"
              value={contract}
              onChange={(e) => setContract(e.target.value)}
            >
              <option value="PRINCIPAL">Contrato Principal (Pabellones A-D, Zonas, Alfalfa, Saneo)</option>
              <option value="B2">Contrato Pabellón B2</option>
            </select>
          </div>

          {/* Existing record notice */}
          {isExistingRecord && (
            <div className="notice-banner" style={{ padding: '0.65rem 0.85rem' }}>
              <ShieldCheck size={16} className="notice-icon" />
              <div>
                <strong>📌 Registro existente</strong>
                <p>Puedes continuar para agregar las fotografías pendientes ({existingPhotosCount} subida(s)).</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-proceed"
            style={{
              marginTop: '1rem',
              marginBottom: '40px',
              whiteSpace: 'nowrap',
              width: '100%',
              minHeight: '48px',
              position: 'relative',
              zIndex: 10
            }}
          >
            <span>Continuar a Registro</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
