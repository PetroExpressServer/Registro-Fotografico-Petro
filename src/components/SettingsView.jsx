import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Upload, Image as ImageIcon, FileText, CheckCircle, Trash2, Edit3, Type, CloudCheck, CloudOff } from 'lucide-react';
import { getConfig, saveConfig, isSupabaseConfigured } from '../services/supabase';
import { DEFAULT_CONFIG } from '../services/db';
import { SHIFT_SLOTS } from '../constants/structure';

export default function SettingsView({ onConfigUpdated, supervisorsList, onSupervisorsUpdated }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState('branding'); // 'branding' | 'titles' | 'slots' | 'cloud'
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
    notify('💾 Formato guardado en ' + (isSupabaseConfigured ? 'la Nube (Supabase)' : 'memoria local'));
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
          <h2>⚙️ Configuración del Formato y Nube</h2>
          <p>Personalice el logo, textos de actividad, encabezados y conexión con Supabase / Vercel</p>
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

          <button
            className={`settings-tab-btn ${activeTab === 'cloud' ? 'active' : ''}`}
            onClick={() => setActiveTab('cloud')}
          >
            {isSupabaseConfigured ? <CloudCheck size={16} style={{ color: '#10b981' }} /> : <CloudOff size={16} />}
            <span>Nube Supabase</span>
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

        {/* Tab 4: Supabase Cloud Integration Status */}
        {activeTab === 'cloud' && (
          <div className="settings-section-content">
            <h3>☁️ Conexión con Supabase y Vercel</h3>
            <p className="section-desc">Estado de sincronización en tiempo real para todos los supervisores en la nube.</p>

            <div className={`cloud-status-box ${isSupabaseConfigured ? 'connected' : 'disconnected'}`}>
              <div className="cloud-status-header">
                {isSupabaseConfigured ? <CloudCheck size={24} /> : <CloudOff size={24} />}
                <div>
                  <h4>{isSupabaseConfigured ? '🟢 Conectado a Supabase Cloud' : '🟡 Modo Local (IndexedDB)'}</h4>
                  <p>
                    {isSupabaseConfigured
                      ? 'Todos los supervisores sincronizan y leen las fotos guardadas en tiempo real desde la nube.'
                      : 'La aplicación guarda los datos en la memoria local de este navegador. Configure las variables en Vercel para activar Supabase.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="cloud-instructions-box margin-top">
              <h4>📋 Pasos para desplegar en Vercel + Supabase:</h4>
              <ol className="cloud-steps-list">
                <li>Cree un proyecto en Supabase (Gratuito).</li>
                <li>Ejecute la sentencia SQL guardada en <code>supabase_schema.sql</code> en el Editor SQL de Supabase.</li>
                <li>Conecte su repositorio en Vercel y agregue las variables de entorno:
                  <ul>
                    <li><code>VITE_SUPABASE_URL</code></li>
                    <li><code>VITE_SUPABASE_ANON_KEY</code></li>
                  </ul>
                </li>
              </ol>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
