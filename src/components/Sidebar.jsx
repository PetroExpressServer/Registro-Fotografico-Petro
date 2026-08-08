import React from 'react';
import { Camera, Calendar, Settings, RefreshCw, X, User } from 'lucide-react';

export default function Sidebar({ currentNav, setCurrentNav, currentStep, supervisor, onResetStep, isOpen, onClose }) {
  const handleNavClick = (navId) => {
    setCurrentNav(navId);
    if (onClose) onClose();
  };

  // Get supervisor initials
  const initials = supervisor
    ? supervisor.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'AD';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`app-sidebar ${isOpen ? 'mobile-open' : ''}`}>
        
        {/* Brand Header with PetroAseo Logo */}
        <div className="sidebar-brand-box">
          <img src="/petroaseo-logo.png" alt="PetroAseo" className="sidebar-logo-img" />
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

          {/* Supervisor Avatar Badge at Bottom */}
          <div className="sidebar-user-chip">
            <div className="user-avatar-badge">{initials}</div>
            <div className="user-info-text">
              <span className="user-name">{supervisor || 'Supervisor'}</span>
              <span className="user-role">Administrador</span>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
}
