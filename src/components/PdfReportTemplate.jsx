import React from 'react';
import { SHIFT_SLOTS } from '../constants/structure';

export default function PdfReportTemplate({ record, date, contract, supervisor, config = {} }) {
  const dParts = (date || '').split('-');
  const formattedDate = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}/${dParts[0]}` : date;

  const photos = record?.photos || {};

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

  // Activity description text per contract
  const activityText = contract === 'B2'
    ? (config.activityB2 || 'BARRIDO MANUAL AREAS DE CIRCULACIÓN, AREAS DE CIRCULACIÓN Y MANIOBRA INTERNA, ANDEN DE CARGA Y DESCARGA PABELLON B2, PISTAS, VEREDAS, CALLES, AVENIDAS Y ESTACIONAMIENTOS, AREA DE INFLUENCIA, PUESTOS NO UTILIZADOS.')
    : (config.activityPrincipal || 'BARRIDO MANUAL Y MECANIZADO EN PABELLONES Y PISTAS, BALDEO Y DESINFECCION GENERAL, RECOLECCION Y TRANSPORTE DE RESIDUOS SOLIDOS EN EL GRAN MERCADO MAYORISTA DE LIMA.');

  return (
    <div className="printable-pdf-document">
      {[1, 2, 3, 4, 5].map((pageNum) => {
        const slots = getPageSlots(pageNum);

        let shiftLabel = 'TURNO 1 :';
        let shiftHours = '06:00 hasta 14:00 horas';

        if (pageNum === 2) {
          shiftLabel = 'TURNO 2 :';
          shiftHours = '14:00 hasta 22:00 horas';
        } else if (pageNum === 3) {
          shiftLabel = 'TURNO 3 :';
          shiftHours = '22:00 hasta 06:00 horas';
        } else if (pageNum === 4) {
          shiftLabel = 'OTRAS ACTIVIDADES :';
          shiftHours = 'Servicios Especiales y Complementarios de Limpieza - Parte 1';
        } else if (pageNum === 5) {
          shiftLabel = 'OTRAS ACTIVIDADES :';
          shiftHours = 'Servicios Especiales y Complementarios de Limpieza - Parte 2';
        }

        return (
          <div key={pageNum} className="pdf-page-wrapper">
            
            {/* EXACT PDF HEADER MATCHING USER REFERENCE */}
            <table className="pdf-table-header">
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
                      <div style={{ fontWeight: 'bold', fontSize: '11pt', color: '#0284c7' }}>
                        {config.companyName || 'CONSORCIO PETRO LIMPIO'}
                      </div>
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

            {/* 3x3 Photo Grid */}
            <div className="pdf-3x3-grid">
              {slots.map((slot) => {
                const photoData = photos[slot.id];
                return (
                  <div key={slot.id} className="pdf-slot">
                    {photoData ? (
                      <img src={photoData} alt={slot.title} />
                    ) : (
                      <div className="pdf-slot-title">{slot.title}</div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        );
      })}
    </div>
  );
}
