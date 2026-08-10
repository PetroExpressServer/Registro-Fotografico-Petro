import React from 'react';
import { Camera, Trash2, CheckCircle2, AlertCircle, ZoomIn, UserCheck } from 'lucide-react';

export default function PhotoCard({ slot, photoData, slotMeta, onUpload, onDelete, onPreview }) {
  const isLoaded = !!photoData;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(slot.id, slot.title, e.target.files[0]);
    }
  };

  return (
    <div className={`card-horizontal ${isLoaded ? 'loaded' : ''}`}>
      {/* Title, Status & Supervisor Metadata */}
      <div className="horiz-info">
        <span className="horiz-title">{slot.title}</span>
        
        <div className="horiz-badges">
          <span className={`badge-state ${isLoaded ? 'ok' : 'pending'}`}>
            {isLoaded ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            <span>{isLoaded ? 'Subida' : 'Pendiente'}</span>
          </span>

          {isLoaded && slotMeta && slotMeta.lastSupervisor && (
            <span className="badge-meta-sup" title={`Última edición por ${slotMeta.lastSupervisor}`}>
              <UserCheck size={12} />
              <span>{slotMeta.lastSupervisor}</span>
            </span>
          )}
        </div>
      </div>

      {/* Image Preview Thumbnail / Placeholder */}
      <div className="horiz-preview-box">
        {isLoaded ? (
          <div className="thumb-wrapper" onClick={() => onPreview(photoData)}>
            <img src={photoData} alt={slot.title} className="thumb-image" />
            <div className="thumb-zoom-hint">
              <ZoomIn size={14} />
            </div>
          </div>
        ) : (
          <div
            className="thumb-placeholder"
            onClick={() => document.getElementById(`inp_${slot.id}`).click()}
          >
            <Camera size={22} />
            <span>Subir</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="horiz-actions">
        <input
          type="file"
          id={`inp_${slot.id}`}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        
        <button
          className="btn-action primary"
          onClick={() => document.getElementById(`inp_${slot.id}`).click()}
        >
          <Camera size={15} />
          <span>{isLoaded ? 'Cambiar' : 'Tomar / Subir'}</span>
        </button>

        {isLoaded && (
          <button
            className="btn-action danger"
            onClick={() => onDelete(slot.id)}
            title="Eliminar foto"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
