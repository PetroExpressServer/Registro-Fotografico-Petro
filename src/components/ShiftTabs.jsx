import React from 'react';
import { Sun, SunMoon, Moon, Truck, Globe } from 'lucide-react';
import { TOTAL_SLOTS } from '../constants/structure';

export default function ShiftTabs({ activeTab, setActiveTab, counts }) {
  const tabs = [
    { id: 'all', label: 'Todos', tooltip: `Todos los Slots (${TOTAL_SLOTS} fotos)`, icon: Globe, count: `${counts.all}/${TOTAL_SLOTS}` },
    { id: 'turno1', label: 'Turno 1', tooltip: 'Turno 1 (06:00 - 14:00 hrs)', icon: Sun, count: `${counts.t1}/8` },
    { id: 'turno2', label: 'Turno 2', tooltip: 'Turno 2 (14:00 - 22:00 hrs)', icon: SunMoon, count: `${counts.t2}/8` },
    { id: 'turno3', label: 'Turno 3', tooltip: 'Turno 3 (22:00 - 06:00 hrs)', icon: Moon, count: `${counts.t3}/8` },
    { id: 'otras', label: 'Otras', tooltip: 'Otras Actividades y Servicios (15 fotos)', icon: Truck, count: `${counts.otras}/15` },
  ];

  return (
    <div className="compact-tabs-bar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`compact-tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.tooltip}
          >
            <Icon size={14} className="tab-icon" />
            <span className="compact-label">{tab.label}</span>
            <span className="compact-badge">{tab.count}</span>
          </button>
        );
      })}
    </div>
  );
}
