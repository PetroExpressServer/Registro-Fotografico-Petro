import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Upload, Image as ImageIcon, FileText, CheckCircle, Trash2, Edit3, Type } from 'lucide-react';
import { getConfig, saveConfig } from '../services/supabase';
import { DEFAULT_CONFIG } from '../services/db';
import { SHIFT_SLOTS } from '../constants/structure';

export default function SettingsView({ onConfigUpdated, supervisorsList, onSupervisorsUpdated }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState('branding'); // 'branding' | 'titles' | 'slots'
  const [activeShiftTab, setActiveShiftTab] = useState('turno1');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getConfig().then(setConfig);
  }, []);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSaveConfig = async () => {
    await saveConfig(config);
    if (onConfigUpdated) onConfigUpdated(config);
    notify('💾 Formato guardado correctamente');
  };

  const handleResetConfig = async () => {
    if (confirm('¿Desea restaurar todos los textos, títulos y logos a los valores por defecto del sistema?')) {
      await saveConfig(DEFAULT_CONFIG);
      setConfig(DEFAULT_CONFIG);
      if (onConfigUpdated) onConfigUpdated(DEFAULT_CONFIG);
      notify('🔄 Formato restaurado a valores por defecto');
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setConfig(prev => ({ ...prev, logoUrl: event.target.result }));
        notify('🖼️ Logo actualizado');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setConfig(prev => ({ ...prev, logoUrl: '' }));
    notify('🗑️ Logo personalizado eliminado');
  };

  const handleSlotTitleChange = (slotId, newTitle) => {
    setConfig(prev => ({
      ...prev,
      customSlotTitles: {
        ...(prev.customSlotTitles || {}),
        [slotId]: newTitle
      }
    }));
  };

  return (
    <div className="settings-page-wrapper">
      
      {/* Toast Notification */}
      {toast && (
        <div className="toast-notification">
          <CheckCircle size={16} />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="settings-page-header">
        <div>
          <h2>⚙️ Configuración del Formato</h2>
          <p>Personalice el logo, textos de actividad y encabezados del PDF</p>
        </div>

        <div className="settings-header-btns">
          <button className="btn-secondary danger" onClick={handleResetConfig}>
            <RefreshCw size={15} /> Restaurar Por Defecto
          </button>

          <button className="btn-primary" onClick={handleSaveConfig}>
            <Save size={15} /> Guardar Cambios
          </button>
        </div>
      </div>

      {/* Main Settings Panel */}
      <div className="settings-main-card">
        
        {/* Navigation Tabs */}
        <div className="settings-tabs-bar">
          <button
            className={`settings-tab-btn ${activeTab === 'branding' ? 'active' : ''}`}
            onClick={() => setActiveTab('branding')}
          >
            <ImageIcon size={16} /> <span>Logo y Marca</span>
          </button>

          <button
            className={`settings-tab-btn ${activeTab === 'titles' ? 'active' : ''}`}
            onClick={() => setActiveTab('titles')}
          >
            <FileText size={16} /> <span>Actividades PDF</span>
          </button>

          <button
            className={`settings-tab-btn ${activeTab === 'slots' ? 'active' : ''}`}
            onClick={() => setActiveTab('slots')}
          >
            <Type size={16} /> <span>Textos Fotos (29)</span>
          </button>
        </div>

        {/* Tab 1: Logo & Branding */}
        {activeTab === 'branding' && (
          <div className="settings-section-content">
            <h3>🏢 Identidad Institucional y Logo</h3>
            <p className="section-desc">Personalice el logo de la empresa y la información de membrete en el PDF.</p>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Nombre de la Empresa Contratista</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.companyName || ''}
                  onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                  placeholder="Ej: CONSORCIO PETRO LIMPIO"
                />
              </div>

              <div className="form-group">
                <label>Cliente / Entidad</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.clientName || ''}
                  onChange={(e) => setConfig({ ...config, clientName: e.target.value })}
                  placeholder="Ej: EMPRESA MUNICIPAL DE MERCADOS S.A"
                />
              </div>
            </div>

            <div className="form-group margin-top">
              <label>Ubicación / Proyecto</label>
              <input
                type="text"
                className="form-input"
                value={config.locationName || ''}
                onChange={(e) => setConfig({ ...config, locationName: e.target.value })}
                placeholder="Ej: GRAN MERCADO MAYORISTA DE LIMA"
              />
            </div>

            {/* Logo Upload Box */}
            <div className="logo-upload-box margin-top">
              <label>Logo Institucional (Esquina superior izquierda del PDF)</label>
              
              <div className="logo-preview-area">
                {config.logoUrl ? (
                  <div className="custom-logo-display">
                    <img src={config.logoUrl} alt="Logo de la empresa" />
                    <button className="btn-action danger" onClick={handleRemoveLogo}>
                      <Trash2 size={14} /> Eliminar Logo
                    </button>
                  </div>
                ) : (
                  <div className="default-logo-placeholder">
                    <div className="placeholder-brand">PETRO LIMPIO</div>
                    <span>(Logo por defecto)</span>
                  </div>
                )}

                <div className="upload-btn-wrapper">
                  <input
                    type="file"
                    id="logo_file_input"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleLogoUpload}
                  />
                  <button
                    className="btn-secondary"
                    onClick={() => document.getElementById('logo_file_input').click()}
                  >
                    <Upload size={15} /> Subir Imagen de Logo
                  </button>
                  <small>Formato PNG o JPG recomendado</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Document Titles & Activities */}
        {activeTab === 'titles' && (
          <div className="settings-section-content">
            <h3>📄 Textos de Encabezado y Descripción de Actividad</h3>
            <p className="section-desc">Modifique las descripciones exactas de la sección "ACTIVIDAD:" que aparecen en la tabla de cabecera.</p>

            {/* Contrato Pabellón B2 Section */}
            <div className="contract-title-box">
              <h4>📦 Formato: Pabellón B2</h4>
              
              <div className="form-group">
                <label>Descripción de la ACTIVIDAD: (Pabellón B2)</label>
                <textarea
                  rows={3}
                  className="form-input"
                  value={config.activityB2 || ''}
                  onChange={(e) => setConfig({ ...config, activityB2: e.target.value })}
                />
              </div>
            </div>

            {/* Contrato Principal Section */}
            <div className="contract-title-box margin-top">
              <h4>📋 Formato: Contrato Principal</h4>
              
              <div className="form-group">
                <label>Descripción de la ACTIVIDAD: (Contrato Principal)</label>
                <textarea
                  rows={3}
                  className="form-input"
                  value={config.activityPrincipal || ''}
                  onChange={(e) => setConfig({ ...config, activityPrincipal: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Photo Slot Titles (29 casillas) */}
        {activeTab === 'slots' && (
          <div className="settings-section-content">
            <h3>📸 Personalización de Textos de Fotos (29 Casillas)</h3>
            <p className="section-desc">Edite el texto descriptivo u horario que aparece en cada recuadro del reporte.</p>

            {/* Sub-tabs for shifts */}
            <div className="subtabs-bar">
              <button
                className={`subtab-btn ${activeShiftTab === 'turno1' ? 'active' : ''}`}
                onClick={() => setActiveShiftTab('turno1')}
              >
                Turno 1 (8)
              </button>
              <button
                className={`subtab-btn ${activeShiftTab === 'turno2' ? 'active' : ''}`}
                onClick={() => setActiveShiftTab('turno2')}
              >
                Turno 2 (8)
              </button>
              <button
                className={`subtab-btn ${activeShiftTab === 'turno3' ? 'active' : ''}`}
                onClick={() => setActiveShiftTab('turno3')}
              >
                Turno 3 (8)
              </button>
              <button
                className={`subtab-btn ${activeShiftTab === 'otras' ? 'active' : ''}`}
                onClick={() => setActiveShiftTab('otras')}
              >
                Otras (15)
              </button>
            </div>

            <div className="slots-editor-grid">
              {SHIFT_SLOTS[activeShiftTab].map((slot) => {
                const currentVal = (config.customSlotTitles && config.customSlotTitles[slot.id]) || slot.title;
                return (
                  <div key={slot.id} className="slot-edit-item">
                    <label className="slot-orig-label">
                      <Edit3 size={13} /> {slot.title}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={currentVal}
                      onChange={(e) => handleSlotTitleChange(slot.id, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
