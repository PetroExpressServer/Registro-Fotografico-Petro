import React from 'react';
import { Camera, Calendar, Settings, ArrowLeft, RefreshCw, X, ShieldAlert } from 'lucide-react';

export default function Sidebar({ currentNav, setCurrentNav, currentStep, onResetStep, isOpen, onClose }) {
  const handleNavClick = (navId) => {
    setCurrentNav(navId);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`app-sidebar ${isOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">PL</div>
          <div className="sidebar-brand-text">
            <h3>PetroLimpio</h3>
            <p>Registro Fotografico</p>
          </div>
          {isOpen && (
            <button className="btn-close-sidebar" onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Menu Items */}
        <nav className="sidebar-menu">
          <button
            className={`menu-item ${currentNav === 'register' ? 'active' : ''}`}
            onClick={() => handleNavClick('register')}
          >
            <Camera size={18} />
            <span>Registrar Fotos</span>
          </button>

          <button
            className={`menu-item ${currentNav === 'history' ? 'active' : ''}`}
            onClick={() => handleNavClick('history')}
          >
            <Calendar size={18} />
            <span>Historial de Días</span>
          </button>

          <button
            className={`menu-item ${currentNav === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavClick('settings')}
          >
            <Settings size={18} />
            <span>Configuración</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {currentStep === 2 && currentNav === 'register' && (
            <button className="btn-sidebar-reset" onClick={onResetStep}>
              <RefreshCw size={14} /> Cambiar Día / Supervisor
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
