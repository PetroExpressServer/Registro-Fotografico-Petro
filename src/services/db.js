import { openDB } from 'idb';

const DB_NAME = 'petrolimpio_db';
const DB_VERSION = 2; // Incremented for settings store

export const DEFAULT_CONFIG = {
  companyName: 'CONSORCIO PETRO LIMPIO',
  logoUrl: '/petroaseo-logo.png', // Default official logo image URL across all mobile & desktop devices
  clientName: 'EMPRESA MUNICIPAL DE MERCADOS S.A',
  locationName: 'GRAN MERCADO MAYORISTA DE LIMA',
  
  titleMain: 'INFORME FOTOGRÁFICO',
  
  activityPrincipal: 'BARRIDO MANUAL Y MECANIZADO EN PABELLONES Y PISTAS, BALDEO Y DESINFECCION GENERAL, RECOLECCION Y TRANSPORTE DE RESIDUOS SOLIDOS EN EL GRAN MERCADO MAYORISTA DE LIMA.',
  activityB2: 'BARRIDO MANUAL AREAS DE CIRCULACIÓN, AREAS DE CIRCULACIÓN Y MANIOBRA INTERNA, ANDEN DE CARGA Y DESCARGA PABELLON B2, PISTAS, VEREDAS, CALLES, AVENIDAS Y ESTACIONAMIENTOS, AREA DE INFLUENCIA, PUESTOS NO UTILIZADOS.',

  titlePrincipal: 'REGISTRO FOTOGRAFICO SERVICIO DE LIMPIEZA BARREDIDO Y DESINFECCION DE LAS INSTALACIONES Y PISTAS DEL GRAN MERCADO MAYORISTA DE LIMA',
  subTitlePrincipal: 'CONTRATO PRINCIPAL - PABELLONES A-D, PISTAS Y PLATAFORMAS',

  titleB2: 'REGISTRO FOTOGRAFICO SERVICIO DE LIMPIEZA Y DESINFECCION PABELLON B2',
  subTitleB2: 'PABELLON B2 Y RAMPAS DE CARGA/DESCARGA',

  customSlotTitles: {}
};

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('records')) {
        const store = db.createObjectStore('records', { keyPath: 'id' });
        store.createIndex('date', 'date');
        store.createIndex('contract', 'contract');
      }
      if (!db.objectStoreNames.contains('supervisors')) {
        db.createObjectStore('supervisors', { keyPath: 'name' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    },
  });
}

// Get record by contract and date
export async function getRecord(contract, date) {
  const db = await initDB();
  const id = `${contract}_${date}`;
  return db.get('records', id);
}

// Save or update record
export async function saveRecord(record) {
  const db = await initDB();
  const id = `${record.contract}_${record.date}`;
  return db.put('records', { ...record, id, updatedAt: new Date().toISOString() });
}

// Get all saved records
export async function getAllRecords() {
  const db = await initDB();
  return db.getAll('records');
}

// Delete record
export async function deleteRecord(contract, date) {
  const db = await initDB();
  const id = `${contract}_${date}`;
  return db.delete('records', id);
}

// Supervisors Datalist
export async function getSupervisors() {
  const db = await initDB();
  const list = await db.getAll('supervisors');
  return list.map(s => s.name);
}

export async function addSupervisor(name) {
  if (!name || !name.trim()) return;
  const db = await initDB();
  const cleanName = name.trim();
  return db.put('supervisors', { name: cleanName });
}

// CONFIG / TEMPLATE SETTINGS
export async function getConfig() {
  try {
    const db = await initDB();
    const config = await db.get('settings', 'app_config');
    return config ? { ...DEFAULT_CONFIG, ...config } : DEFAULT_CONFIG;
  } catch (err) {
    console.error('Error fetching config:', err);
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(configData) {
  const db = await initDB();
  const payload = { id: 'app_config', ...configData, updatedAt: new Date().toISOString() };
  await db.put('settings', payload);
  return payload;
}
