import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import StepInit from './components/StepInit';
import ShiftTabs from './components/ShiftTabs';
import PhotoCard from './components/PhotoCard';
import LivePdfPreview from './components/LivePdfPreview';
import HistoryPageView from './components/HistoryPageView';
import HistoryDetailModal from './components/HistoryDetailModal';
import SettingsView from './components/SettingsView';
import PdfReportTemplate from './components/PdfReportTemplate';

import { SHIFT_SLOTS, CONTRACT_SPECS } from './constants/structure';
import { DEFAULT_CONFIG } from './services/db';
import { getRecord, saveRecord, getAllRecords, getSupervisors, addSupervisor, getConfig, syncLocalToCloud } from './services/supabase';
import { applyWatermark } from './services/watermark';
import { Save, Trash2, Printer, CheckCircle, X, ArrowLeft, History, Menu, Camera, Eye, Calendar, Settings } from 'lucide-react';

export default function App() {
  // Navigation & Flow State
  const [currentNav, setCurrentNav] = useState('register'); // 'register' | 'history' | 'settings'
  const [currentStep, setCurrentStep] = useState(1); // 1 = StepInit (Supervisor & Date), 2 = Split View (Photos + Live PDF)

  // Mobile Drawer & Mobile View Switcher State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [mobilePaneView, setMobilePaneView] = useState('photos'); // 'photos' | 'pdf'

  // App Configuration / Custom Document Format Template State
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  // Record Data State (Supervisor starts empty)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [contract, setContract] = useState('PRINCIPAL');
  const [supervisor, setSupervisor] = useState('');
  const [supervisorsList, setSupervisorsList] = useState([]);

  const [record, setRecord] = useState({ photos: {}, slotMeta: {}, auditLog: [] });
  const [isExistingRecord, setIsExistingRecord] = useState(false);
  const [activeTab, setActiveTab] = useState('turno1');

  // History State
  const [historyRecords, setHistoryRecords] = useState([]);
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState(null);
  const [isHistoryDetailOpen, setIsHistoryDetailOpen] = useState(false);

  const [modalPreviewImg, setModalPreviewImg] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const notify = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Load Config, Supervisors & Auto-sync local photos to cloud on Mount
  useEffect(() => {
    getConfig().then(setConfig);
    getSupervisors().then(setSupervisorsList);
    syncLocalToCloud().then(count => {
      if (count > 0) notify(`☁️ Sincronizados ${count} registros a la Nube`);
    });
  }, []);

  // Fetch Record when contract or date changes
  useEffect(() => {
    async function fetchData() {
      const data = await getRecord(contract, date);
      if (data) {
        setRecord({
          photos: data.photos || {},
          slotMeta: data.slotMeta || {},
          auditLog: data.auditLog || [],
          ...data
        });
        if (data.supervisor) setSupervisor(data.supervisor);
        setIsExistingRecord(true);
      } else {
        setRecord({ photos: {}, slotMeta: {}, auditLog: [] });
        setIsExistingRecord(false);
      }
    }
    fetchData();
  }, [contract, date]);

  // Fetch all history records when navigating to history page
  useEffect(() => {
    if (currentNav === 'history') {
      getAllRecords().then(setHistoryRecords);
    }
  }, [currentNav]);

  const allSlots = useMemo(() => {
    const list = [];
    Object.keys(SHIFT_SLOTS).forEach(cat => {
      SHIFT_SLOTS[cat].forEach(s => {
        const customTitle = config.customSlotTitles && config.customSlotTitles[s.id]
          ? config.customSlotTitles[s.id]
          : s.title;
        list.push({ ...s, title: customTitle, category: cat });
      });
    });
    return list;
  }, [config]);

  const counts = useMemo(() => {
    const photos = record?.photos || {};
    const getCount = (cat) => SHIFT_SLOTS[cat].filter(s => !!photos[s.id]).length;
    const t1 = getCount('turno1');
    const t2 = getCount('turno2');
    const t3 = getCount('turno3');
    const otras = getCount('otras');
    return { t1, t2, t3, otras, all: t1 + t2 + t3 + otras };
  }, [record]);

  const displayedSlots = useMemo(() => {
    if (activeTab === 'all') return allSlots;
    return allSlots.filter(s => s.category === activeTab);
  }, [activeTab, allSlots]);

  // Save Record Action with optional new audit log entry
  const handleSave = async (updatedPhotos = record.photos, updatedSlotMeta = record.slotMeta, newAuditEntry = null) => {
    const supName = (supervisor && supervisor.trim()) ? supervisor.trim() : 'Supervisor sin especificar';
    if (supName !== 'Supervisor sin especificar') {
      await addSupervisor(supName);
      const updatedList = await getSupervisors();
      setSupervisorsList(updatedList);
    }

    const currentAudit = record.auditLog || [];
    const updatedAuditLog = newAuditEntry ? [...currentAudit, newAuditEntry] : currentAudit;

    const payload = {
      contract,
      date,
      supervisor: supName,
      photos: updatedPhotos,
      slotMeta: updatedSlotMeta,
      auditLog: updatedAuditLog
    };

    await saveRecord(payload);
    setRecord(payload);
    setIsExistingRecord(true);
    notify('💾 Registro guardado correctamente');
  };

  // Upload photo handler with Audit Logging
  const handlePhotoUpload = async (slotId, slotTitle, file) => {
    const supName = supervisor && supervisor.trim() ? supervisor.trim() : 'Supervisor de Turno';
    const isReplacement = !!record.photos[slotId];
    const timestamp = new Date().toISOString();

    try {
      notify('⌛ Procesando imagen...');
      const compressedBase64 = await applyWatermark(file, slotTitle, supName);
      const newPhotos = { ...record.photos, [slotId]: compressedBase64 };

      // Update Slot Metadata (Who last touched this photo)
      const newSlotMeta = {
        ...(record.slotMeta || {}),
        [slotId]: {
          lastSupervisor: supName,
          lastUpdated: timestamp,
          action: isReplacement ? 'REPLACED' : 'UPLOADED'
        }
      };

      // Create Audit Log Entry
      const auditEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        timestamp,
        supervisor: supName,
        action: isReplacement ? 'REPLACE' : 'UPLOAD',
        slotId,
        slotTitle,
        details: isReplacement
          ? `${supName} REEMPLAZÓ la foto de "${slotTitle}"`
          : `${supName} SUBIÓ la foto de "${slotTitle}"`
      };

      await handleSave(newPhotos, newSlotMeta, auditEntry);
      notify(isReplacement ? '🔄 Foto reemplazada' : '📸 Foto agregada');
    } catch (err) {
      console.error(err);
      notify('❌ Error al procesar imagen');
    }
  };

  // Delete photo handler with Audit Logging
  const handlePhotoDelete = async (slotId, slotTitle) => {
    const supName = supervisor && supervisor.trim() ? supervisor.trim() : 'Supervisor de Turno';
    const timestamp = new Date().toISOString();

    const newPhotos = { ...record.photos };
    delete newPhotos[slotId];

    const newSlotMeta = { ...(record.slotMeta || {}) };
    delete newSlotMeta[slotId];

    // Create Audit Log Entry for Deletion
    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp,
      supervisor: supName,
      action: 'DELETE',
      slotId,
      slotTitle,
      details: `${supName} ELIMINÓ la foto de "${slotTitle}"`
    };

    await handleSave(newPhotos, newSlotMeta, auditEntry);
    notify('🗑️ Foto eliminada');
  };

  const handleClearRecord = async () => {
    const supName = supervisor && supervisor.trim() ? supervisor.trim() : 'Supervisor de Turno';
    if (confirm(`¿Desea borrar todas las fotos del ${date} (${contract})? esta acción se registrará en la auditoría.`)) {
      const timestamp = new Date().toISOString();
      const auditEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        timestamp,
        supervisor: supName,
        action: 'CLEAR',
        slotId: 'all',
        slotTitle: 'Todos los slots',
        details: `${supName} VACIAÓ TODAS las fotos de este registro`
      };

      await handleSave({}, {}, auditEntry);
      notify('🧹 Registro limpiado');
    }
  };

  const handleOpenDayDetail = (rec) => {
    setSelectedHistoryRecord(rec);
    setIsHistoryDetailOpen(true);
  };

  const handleLoadRecordFromDetail = (rec) => {
    setContract(rec.contract);
    setDate(rec.date);
    if (rec.supervisor) setSupervisor(rec.supervisor);
    setRecord(rec);
    setIsHistoryDetailOpen(false);
    setCurrentNav('register');
    setCurrentStep(2);
  };

  const handlePrintPDF = async () => {
    await handleSave();
    window.print();
  };

  return (
    <div className="app-shell">
      {/* Toast */}
      {toastMessage && (
        <div className="toast-notification">
          <CheckCircle size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Top Header Bar */}
      <header className="mobile-top-header">
        <button className="btn-mobile-menu" onClick={() => setIsMobileSidebarOpen(true)}>
          <Menu size={22} />
        </button>

        <div className="mobile-brand">
          <img src="/petroaseo-logo.png" alt="PetroAseo" className="mobile-brand-img" />
        </div>

        {supervisor ? (
          <span className="mobile-sup-chip" title={supervisor}>
            👤 {supervisor.split(' ')[0]}
          </span>
        ) : (
          <span className="mobile-sup-chip alert">
            👤 Supervisor
          </span>
        )}
      </header>

      {/* Responsive Sidebar */}
      <Sidebar
        currentNav={currentNav}
        setCurrentNav={setCurrentNav}
        currentStep={currentStep}
        supervisor={supervisor}
        onResetStep={() => setCurrentStep(1)}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <main className="app-workspace">
        {/* VIEW 1: REGISTRAR FOTOS (STEP 1: INIT FORM) */}
        {currentNav === 'register' && currentStep === 1 && (
          <StepInit
            supervisor={supervisor}
            setSupervisor={setSupervisor}
            supervisorsList={supervisorsList}
            date={date}
            setDate={setDate}
            contract={contract}
            setContract={setContract}
            isExistingRecord={isExistingRecord}
            existingPhotosCount={counts.all}
            onProceed={() => {
              handleSave();
              setCurrentStep(2);
            }}
          />
        )}

        {/* VIEW 1: REGISTRAR FOTOS (STEP 2: CAPTURE & LIVE PDF SPLIT VIEW) */}
        {currentNav === 'register' && currentStep === 2 && (
          <div className="step-capture-layout">
            
            {/* Top Info Bar */}
            <div className="capture-header-bar">
              <div className="capture-info">
                <button className="btn-back-step" onClick={() => setCurrentStep(1)} title="Cambiar datos">
                  <ArrowLeft size={16} /> Volver
                </button>
                <div className="info-chips">
                  <span className="chip">👤 <strong>{supervisor || 'Sin especificar'}</strong></span>
                  <span className="chip">📅 <strong>{date}</strong></span>
                  <span className="chip">📋 <strong>{contract === 'PRINCIPAL' ? 'Principal' : 'B2'}</strong></span>
                </div>
              </div>

              {/* Mobile View Switcher Pill Bar */}
              <div className="mobile-view-switcher">
                <button
                  className={`switcher-btn ${mobilePaneView === 'photos' ? 'active' : ''}`}
                  onClick={() => setMobilePaneView('photos')}
                >
                  <Camera size={14} /> <span>Capturar ({counts.all}/29)</span>
                </button>

                <button
                  className={`switcher-btn ${mobilePaneView === 'pdf' ? 'active' : ''}`}
                  onClick={() => setMobilePaneView('pdf')}
                >
                  <Eye size={14} /> <span>Ver PDF</span>
                </button>
              </div>

              <div className="header-actions-group">
                <button
                  className="btn-subtle"
                  onClick={() => handleOpenDayDetail(record)}
                  title="Ver auditoría de cambios"
                >
                  <History size={15} /> Auditoría ({record.auditLog ? record.auditLog.length : 0})
                </button>
              </div>
            </div>

            {/* Split Screen / Mobile Single Screen Workspace */}
            <div className={`split-view ${mobilePaneView === 'pdf' ? 'show-mobile-pdf' : 'show-mobile-photos'}`}>
              
              {/* LEFT PANE: Photo Upload & Horizontal Cards */}
              <div className="left-pane-capture">
                <ShiftTabs
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  counts={counts}
                />

                <div className="photo-cards-scroll">
                  <div className="cards-grid">
                    {displayedSlots.map((slot) => (
                      <PhotoCard
                        key={slot.id}
                        slot={slot}
                        photoData={record.photos ? record.photos[slot.id] : null}
                        slotMeta={record.slotMeta ? record.slotMeta[slot.id] : null}
                        onUpload={handlePhotoUpload}
                        onDelete={(slotId) => handlePhotoDelete(slotId, slot.title)}
                        onPreview={(img) => setModalPreviewImg(img)}
                      />
                    ))}
                  </div>
                </div>

                <div className="pane-footer-bar">
                  <span>Fotos subidas: <strong>{counts.all} de 29</strong></span>
                  <div className="footer-btns">
                    <button className="btn-secondary" onClick={() => handleSave()}>
                      <Save size={15} /> Guardar
                    </button>
                    <button className="btn-secondary danger" onClick={handleClearRecord}>
                      <Trash2 size={15} /> Vaciar
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT PANE: Real-time Live PDF Preview */}
              <div className="right-pane-preview">
                <LivePdfPreview
                  record={record}
                  date={date}
                  contract={contract}
                  supervisor={supervisor}
                  onPrint={handlePrintPDF}
                  config={config}
                />
              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: HISTORIAL DE DÍAS (FULL PAGE LIST VIEW) */}
        {currentNav === 'history' && (
          <HistoryPageView
            records={historyRecords}
            onSelectRecord={handleOpenDayDetail}
            onPrintRecord={(rec) => {
              setContract(rec.contract);
              setDate(rec.date);
              if (rec.supervisor) setSupervisor(rec.supervisor);
              setRecord(rec);
              window.print();
            }}
          />
        )}

        {/* VIEW 3: CONFIGURACIÓN Y EDICIÓN DEL FORMATO */}
        {currentNav === 'settings' && (
          <SettingsView
            onConfigUpdated={(newConfig) => setConfig(newConfig)}
            supervisorsList={supervisorsList}
            onSupervisorsUpdated={setSupervisorsList}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button
          className={`bottom-nav-item ${currentNav === 'register' && mobilePaneView === 'photos' ? 'active' : ''}`}
          onClick={() => {
            setCurrentNav('register');
            setMobilePaneView('photos');
          }}
        >
          <Camera size={20} />
          <span>Fotos</span>
        </button>

        <button
          className={`bottom-nav-item ${currentNav === 'register' && mobilePaneView === 'pdf' ? 'active' : ''}`}
          onClick={() => {
            setCurrentNav('register');
            setMobilePaneView('pdf');
            if (currentStep === 1) setCurrentStep(2);
          }}
        >
          <Eye size={20} />
          <span>PDF</span>
        </button>

        <button
          className={`bottom-nav-item ${currentNav === 'history' ? 'active' : ''}`}
          onClick={() => setCurrentNav('history')}
        >
          <Calendar size={20} />
          <span>Historial</span>
        </button>

        <button
          className={`bottom-nav-item ${currentNav === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentNav('settings')}
        >
          <Settings size={20} />
          <span>Ajustes</span>
        </button>
      </nav>

      {/* Detail Inspection & Audit Modal */}
      <HistoryDetailModal
        record={selectedHistoryRecord}
        isOpen={isHistoryDetailOpen}
        onClose={() => setIsHistoryDetailOpen(false)}
        onLoadRecord={handleLoadRecordFromDetail}
        onPrintRecord={(rec) => {
          setContract(rec.contract);
          setDate(rec.date);
          if (rec.supervisor) setSupervisor(rec.supervisor);
          setRecord(rec);
          setIsHistoryDetailOpen(false);
          window.print();
        }}
      />

      {/* Modal Zoom Preview */}
      {modalPreviewImg && (
        <div className="modal-backdrop" onClick={() => setModalPreviewImg(null)}>
          <div className="preview-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-abs" onClick={() => setModalPreviewImg(null)}>
              <X size={20} />
            </button>
            <img src={modalPreviewImg} alt="Ampliación" />
          </div>
        </div>
      )}

      {/* Hidden PDF Component for Native Print Window */}
      <PdfReportTemplate
        record={record}
        date={date}
        contract={contract}
        supervisor={supervisor}
        config={config}
      />
    </div>
  );
}
