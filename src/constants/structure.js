export const SHIFT_SLOTS = {
  turno1: [
    { id: "t1_06", title: "Foto 06:00:00" },
    { id: "t1_07", title: "Foto 07:00:00" },
    { id: "t1_08", title: "Foto 08:00:00" },
    { id: "t1_09", title: "Foto 09:00:00" },
    { id: "t1_10", title: "Foto 10:00:00" },
    { id: "t1_11", title: "Foto 11:00:00" },
    { id: "t1_12", title: "Foto 12:00:00" },
    { id: "t1_13", title: "Foto 13:00:00" }
  ],
  turno2: [
    { id: "t2_14", title: "Foto 14:00:00" },
    { id: "t2_15", title: "Foto 15:00:00" },
    { id: "t2_16", title: "Foto 16:00:00" },
    { id: "t2_17", title: "Foto 17:00:00" },
    { id: "t2_18", title: "Foto 18:00:00" },
    { id: "t2_19", title: "Foto 19:00:00" },
    { id: "t2_20", title: "Foto 20:00:00" },
    { id: "t2_21", title: "Foto 21:00:00" }
  ],
  turno3: [
    { id: "t3_22", title: "Foto 22:00:00" },
    { id: "t3_23", title: "Foto 23:00:00" },
    { id: "t3_00", title: "Foto 00:00:00" },
    { id: "t3_01", title: "Foto 01:00:00" },
    { id: "t3_02", title: "Foto 02:00:00" },
    { id: "t3_03", title: "Foto 03:00:00" },
    { id: "t3_04", title: "Foto 04:00:00" },
    { id: "t3_05", title: "Foto 05:00:00" }
  ],
  otras: [
    { id: "o_comp_1", title: "Foto de compactadora 1er Turno" },
    { id: "o_comp_2", title: "Foto de compactadora 2do Turno" },
    { id: "o_comp_3", title: "Foto de compactadora 3er Turno" },
    { id: "o_barr_1", title: "Foto Barredora 1er Turno" },
    { id: "o_barr_2", title: "Foto Barredora 2er Turno" },
    { id: "o_freg_2", title: "Foto Fregadora 2do Turno" },
    { id: "o_cana_1", title: "Foto de canaletas 1er turno" },
    { id: "o_cana_2", title: "Limpieza de canaletas 2do turno" },
    { id: "o_pers_2", title: "Foto del personal servicio de lavado 2do turno" },
    { id: "o_lava_1", title: "Foto de lavamanos 1er turno" },
    { id: "o_lava_2", title: "Foto de lavamanos 2do turno" },
    { id: "o_lava_3", title: "Foto de lavamanos 3er turno" },
    { id: "o_segr_1", title: "foto de segregacion 1er turno" },
    { id: "o_segr_2", title: "foto de segregacion 2do turno" },
    { id: "o_segr_3", title: "foto de segregacion 3er turno" }
  ]
};

export const TOTAL_SLOTS = 39;

export const CONTRACT_SPECS = {
  PRINCIPAL: {
    name: "Contrato Principal",
    activityMain: "BARRIDO MANUAL AREAS DE CIRCULACIÓN, AREAS DE CIRCULACIÓN Y MANIOBRA INTERNA, ANDEN DE CARGA Y DESCARGA PABELLONES A, B, C, D. A1, A2, A3, A4, A5, A6, D1, D2, D3, B1, B3, ZONA DE ALFALFA, ZONA DE SANEO, PLATAFORMA A, PISTAS Y VEREDAS, CALLES, AVENIDAS Y ESTACIONAMIENTOS, MAESTRANZA, NUEVA PLATAFORMA, PUERTAS DE ACCESO (1, 2, 3, 4, 5, 6, 7), AREA DE INFLUENCIA, PUESTOS NO UTILIZADOS Y AREAS NO CONSTRUIDAS, HAMBRE CERO.",
    activityOtras: "OTRAS ACTIVIDADES LAVADO, RECOLECCION DE RESIDUOS Y SEGREGACION DE RESIDUOS SOLIDOS"
  },
  B2: {
    name: "Contrato Pabellón B2",
    activityMain: "BARRIDO MANUAL AREAS DE CIRCULACIÓN, AREAS DE CIRCULACIÓN Y MANIOBRA INTERNA, ANDEN DE CARGA Y DESCARGA PABELLON B2, PISTAS, VEREDAS, CALLES, AVENIDAS Y ESTACIONAMIENTOS, AREA DE INFLUENCIA, PUESTOS NO UTILIZADOS.",
    activityOtras: "OTRAS ACTIVIDADES LAVADO Y RECOLECCION DE RESIDUOS SOLIDOS"
  }
};
