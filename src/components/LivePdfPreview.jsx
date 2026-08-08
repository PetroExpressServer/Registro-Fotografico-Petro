import React, { useState, useEffect, useRef } from 'react';
import { Printer, ChevronLeft, ChevronRight, FileText, ZoomIn, ZoomOut } from 'lucide-react';
import { SHIFT_SLOTS } from '../constants/structure';

export default function LivePdfPreview({ record, date, contract, supervisor, onPrint, config = {} }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(0.85);
  const viewportRef = useRef(null);

  const totalPages = 5;
  const dParts = (date || '').split('-');
  const formattedDate = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}/${dParts[0]}` : date;

  // Auto-fit A4 sheet scale on mobile resize (794px width x 1123px height standard A4 at 96dpi)
  useEffect(() => {
    const handleResize = () => {
      if (viewportRef.current) {
        const width = viewportRef.current.clientWidth;
        if (width < 500) {
          const calculatedZoom = (width - 20) / 794;
          setZoom(Math.max(0.35, Math.min(0.9, calculatedZoom)));
        } else if (width < 900) {
          setZoom(0.62);
        } else {
          setZoom(0.82);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Custom helper for resolving slot title with custom overrides
  const resolveSlotTitle = (slotId, defaultTitle) => {
    if (config.customSlotTitles && config.customSlotTitles[slotId]) {
      return config.customSlotTitles[slotId];
    }
    return defaultTitle;
  };

  const getPageSlots = (page) => {
    if (page === 1) return SHIFT_SLOTS.turno1.map(s => ({ ...s, title: resolveSlotTitle(s.id, s.title) }));
    if (page === 2) return SHIFT_SLOTS.turno2.map(s => ({ ...s, title: resolveSlotTitle(s.id, s.title) }));
    if (page === 3) return SHIFT_SLOTS.turno3.map(s => ({ ...s, title: resolveSlotTitle(s.id, s.title) }));
    if (page === 4) return SHIFT_SLOTS.otras.slice(0, 9).map(s => ({ ...s, title: resolveSlotTitle(s.id, s.title) }));
    if (page === 5) return SHIFT_SLOTS.otras.slice(9, 15).map(s => ({ ...s, title: resolveSlotTitle(s.id, s.title) }));
    return [];
  };

  const currentSlots = getPageSlots(currentPage);

  // Fill up to 9 items per page so the 3x3 grid always renders 3 full rows (Row 1, Row 2, Row 3)
  const fullPageSlots = [...currentSlots];
  while (fullPageSlots.length < 9) {
    fullPageSlots.push({
      id: `empty_${currentPage}_${fullPageSlots.length}`,
      title: '',
      isEmptyPlaceholder: true
    });
  }

  const photos = record?.photos || {};

  // Shift label and hours per page
  let shiftLabel = 'TURNO 1 :';
  let shiftHours = '06:00 hasta 14:00 horas';

  if (currentPage === 2) {
    shiftLabel = 'TURNO 2 :';
    shiftHours = '14:00 hasta 22:00 horas';
  } else if (currentPage === 3) {
    shiftLabel = 'TURNO 3 :';
    shiftHours = '22:00 hasta 06:00 horas';
  } else if (currentPage === 4) {
    shiftLabel = 'OTRAS ACTIVIDADES :';
    shiftHours = 'Servicios Especiales y Complementarios de Limpieza - Parte 1';
  } else if (currentPage === 5) {
    shiftLabel = 'OTRAS ACTIVIDADES :';
    shiftHours = 'Servicios Especiales y Complementarios de Limpieza - Parte 2';
  }

  // Activity description text per contract
  const activityText = contract === 'B2'
    ? (config.activityB2 || 'BARRIDO MANUAL AREAS DE CIRCULACIÓN, AREAS DE CIRCULACIÓN Y MANIOBRA INTERNA, ANDEN DE CARGA Y DESCARGA PABELLON B2, PISTAS, VEREDAS, CALLES, AVENIDAS Y ESTACIONAMIENTOS, AREA DE INFLUENCIA, PUESTOS NO UTILIZADOS.')
    : (config.activityPrincipal || 'BARRIDO MANUAL Y MECANIZADO EN PABELLONES Y PISTAS, BALDEO Y DESINFECCION GENERAL, RECOLECCION Y TRANSPORTE DE RESIDUOS SOLIDOS EN EL GRAN MERCADO MAYORISTA DE LIMA.');

  return (
    <div className="live-pdf-container">
      
      {/* PDF Controls Toolbar */}
      <div className="live-pdf-toolbar">
        <div className="toolbar-title">
          <FileText size={16} />
          <span>Pág {currentPage}/{totalPages}</span>
        </div>

        <div className="page-pagination">
          <button
            className="btn-page-nav"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} /> <span className="btn-nav-text">Ant</span>
          </button>

          <span className="page-indicator">{currentPage}/{totalPages}</span>

          <button
            className="btn-page-nav"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            <span className="btn-nav-text">Sig</span> <ChevronRight size={16} />
          </button>
        </div>

        <div className="toolbar-actions">
          <button className="btn-zoom-icon" onClick={() => setZoom(z => Math.max(0.3, z - 0.08))} title="Alejar">
            <ZoomOut size={15} />
          </button>
          <span className="zoom-text">{Math.round(zoom * 100)}%</span>
          <button className="btn-zoom-icon" onClick={() => setZoom(z => Math.min(1.2, z + 0.08))} title="Acercar">
            <ZoomIn size={15} />
          </button>

          <button className="btn-live-print" onClick={onPrint}>
            <Printer size={15} /> <span className="btn-print-text">PDF</span>
          </button>
        </div>
      </div>

      {/* Page Tabs */}
      <div className="live-page-selector">
        {[1, 2, 3, 4, 5].map(pNum => (
          <button
            key={pNum}
            className={`page-tab-btn ${currentPage === pNum ? 'active' : ''}`}
            onClick={() => setCurrentPage(pNum)}
          >
            {pNum === 1 && 'Pág 1: Turno 1'}
            {pNum === 2 && 'Pág 2: Turno 2'}
            {pNum === 3 && 'Pág 3: Turno 3'}
            {pNum === 4 && 'Pág 4: Servicios 1'}
            {pNum === 5 && 'Pág 5: Servicios 2'}
          </button>
        ))}
      </div>

      {/* Viewport View (Standard A4 Dimensions: 794px x 1123px) */}
      <div className="live-pdf-viewport" ref={viewportRef}>
        <div
          className="live-a4-sheet-wrapper"
          style={{
            width: `${794 * zoom}px`,
            height: `${1123 * zoom}px`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            className="live-a4-sheet"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '794px',
              height: '1123px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* EXACT TABLE HEADER MATCHING USER REFERENCE */}
            <table className="live-header-table">
              <colgroup>
                <col style={{ width: '18%' }} />
                <col style={{ width: '52%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '18%' }} />
              </colgroup>
              <tbody>
                {/* Row 1: Logo + Title */}
                <tr>
                  <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '4px', borderRight: '1px solid #000' }}>
                    {config.logoUrl ? (
                      <img src={config.logoUrl} alt="Logo" style={{ maxHeight: '48px', maxWidth: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div className="live-brand-logo">{config.companyName || 'CONSORCIO PETRO LIMPIO'}</div>
                    )}
                  </td>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '5px 4px', verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      INFORME FOTOGRÁFICO
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '9.5pt', marginTop: '2px' }}>
                      Elaborado por: {config.companyName || 'CONSORCIO PETRO LIMPIO'}
                    </div>
                  </td>
                </tr>

                {/* Row 2: ACTIVIDAD */}
                <tr>
                  <td style={{ fontWeight: 'bold', fontSize: '8.8pt', padding: '4px 6px', verticalAlign: 'middle', borderRight: '1px solid #000' }}>
                    ACTIVIDAD:
                  </td>
                  <td colSpan={3} style={{ fontSize: '7.8pt', padding: '4px 6px', lineHeight: '1.25', fontWeight: '500', verticalAlign: 'middle' }}>
                    {activityText}
                  </td>
                </tr>

                {/* Row 3: CLIENTE */}
                <tr>
                  <td style={{ fontWeight: 'bold', fontSize: '8.5pt', padding: '3px 6px', borderRight: '1px solid #000' }}>
                    CLIENTE:
                  </td>
                  <td colSpan={3} style={{ fontSize: '8.5pt', padding: '3px 6px', fontWeight: 'bold' }}>
                    {config.clientName || 'EMPRESA MUNICIPAL DE MERCADOS S.A'}
                  </td>
                </tr>

                {/* Row 4: UBICACIÓN + FECHA */}
                <tr>
                  <td style={{ fontWeight: 'bold', fontSize: '8.5pt', padding: '3px 6px', borderRight: '1px solid #000' }}>
                    UBICACIÓN:
                  </td>
                  <td style={{ fontSize: '8.5pt', padding: '3px 6px', fontWeight: 'bold', borderRight: '1px solid #000' }}>
                    {config.locationName || 'GRAN MERCADO MAYORISTA DE LIMA'}
                  </td>
                  <td style={{ fontWeight: 'bold', fontSize: '8.5pt', padding: '3px 6px', textAlign: 'center', borderRight: '1px solid #000' }}>
                    FECHA:
                  </td>
                  <td style={{ fontSize: '8.5pt', padding: '3px 6px', textAlign: 'center', fontWeight: 'bold' }}>
                    {formattedDate}
                  </td>
                </tr>

                {/* Row 5: TURNO */}
                <tr>
                  <td style={{ fontWeight: 'bold', fontSize: '8.5pt', padding: '3px 6px', borderRight: '1px solid #000' }}>
                    {shiftLabel}
                  </td>
                  <td colSpan={3} style={{ fontSize: '8.5pt', fontWeight: 'bold', padding: '3px 6px' }}>
                    {shiftHours}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 3x3 Photo Grid - Always 9 slots filling 100% of remaining sheet height */}
            <div className="live-3x3-grid">
              {fullPageSlots.map((slot) => {
                const photoData = slot.isEmptyPlaceholder ? null : photos[slot.id];
                return (
                  <div key={slot.id} className="live-pdf-slot">
                    {photoData ? (
                      <img src={photoData} alt={slot.title} />
                    ) : (
                      <div className="live-slot-placeholder">
                        <span>{slot.title}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
