import { createClient } from '@supabase/supabase-js';
import * as localDb from './db';

// Direct production credentials for Supabase Cloud
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://valxesutqqzzuzinwzqb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_-XBnzEMIMDjWX-VRySXbiQ_Vr67YAIN';

let clientInstance = null;
let isConfigured = false;

if (supabaseUrl && supabaseAnonKey) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    isConfigured = true;
  } catch (err) {
    console.error('Supabase initialization warning:', err);
    clientInstance = null;
    isConfigured = false;
  }
}

export const isSupabaseConfigured = isConfigured;
export const supabase = clientInstance;

// Helper: Convert Base64 or Blob to Blob for Supabase Storage Upload
function base64ToBlob(base64Data, contentType = 'image/jpeg') {
  const byteCharacters = atob(base64Data.split(',')[1] || base64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
}

// 1. Upload Photo File to Supabase Storage Bucket ('record-photos')
// Path Structure: record-photos/{contract}_{date}/{shift}/{slot_id}.jpg
export async function uploadPhotoToStorage(contract, date, shift, slotId, photoSource) {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase no está configurado');

  let fileBlob;
  if (photoSource instanceof File || photoSource instanceof Blob) {
    fileBlob = photoSource;
  } else if (typeof photoSource === 'string' && photoSource.startsWith('data:')) {
    fileBlob = base64ToBlob(photoSource);
  } else {
    throw new Error('Formato de imagen inválido');
  }

  const recordId = `${contract}_${date}`;
  const storagePath = `${recordId}/${shift || 'general'}/${slotId}.jpg`;
  
  const { error: uploadError } = await supabase.storage
    .from('record-photos')
    .upload(storagePath, fileBlob, {
      contentType: 'image/jpeg',
      upsert: true
    });

  if (uploadError) {
    console.error('Error uploading file to storage bucket:', uploadError);
    throw new Error(`Error en Storage: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('record-photos')
    .getPublicUrl(storagePath);

  // Bust browser cache with timestamp query parameter
  const publicUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
  return { publicUrl, storagePath };
}

// 2. Fetch Daily Record & All Photos across ALL shifts and supervisors
// Supabase is the SINGLE SOURCE OF TRUTH.
export async function getRecord(contract, date) {
  const recordId = `${contract}_${date}`;

  if (isSupabaseConfigured && supabase) {
    try {
      // Ensure master record row exists
      const { data: mainRec } = await supabase
        .from('records')
        .select('*')
        .eq('id', recordId)
        .maybeSingle();

      // Fetch all photos for this contract & date (includes Juan, Pedro, Carlos, etc.)
      const { data: photosRows, error: photosErr } = await supabase
        .from('record_photos')
        .select('*')
        .eq('record_id', recordId);

      if (photosErr && photosErr.code !== 'PGRST116' && photosErr.code !== '42P01') {
        throw photosErr;
      }

      // Fetch shift supervisors (Turno 1 -> Juan, Turno 2 -> Pedro, etc.)
      const { data: shiftRows } = await supabase
        .from('record_shifts')
        .select('*')
        .eq('record_id', recordId);

      // Fetch audit log
      const { data: auditRows } = await supabase
        .from('record_audit')
        .select('*')
        .eq('record_id', recordId)
        .order('created_at', { ascending: true });

      const photosMap = {};
      const slotMetaMap = {};
      const shiftSupervisorsMap = {};

      if (photosRows) {
        photosRows.forEach(row => {
          photosMap[row.slot_id] = row.photo_url;
          slotMetaMap[row.slot_id] = {
            lastSupervisor: row.supervisor,
            updatedAt: row.updated_at,
            shift: row.shift
          };
        });
      }

      if (shiftRows) {
        shiftRows.forEach(sRow => {
          shiftSupervisorsMap[sRow.shift] = sRow.supervisor;
        });
      }

      const auditList = (auditRows || []).map(a => ({
        id: a.id,
        supervisor: a.supervisor,
        action: a.action,
        details: a.details,
        timestamp: a.created_at
      }));

      return {
        id: recordId,
        contract,
        date,
        photos: photosMap,
        slotMeta: slotMetaMap,
        shiftSupervisors: shiftSupervisorsMap,
        auditLog: auditList
      };

    } catch (err) {
      console.warn('Error fetching record from Supabase Cloud:', err);
    }
  }

  return localDb.getRecord(contract, date);
}

// 3. Save Single Photo without Overwriting other slots or other supervisors
// Inserts or updates strictly by (record_id, slot_id)
export async function saveSinglePhoto({ contract, date, shift = 'turno1', slotId, slotTitle, supervisor, photoSource }) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Error de conexión a la nube. No se pudo guardar la foto.');
  }

  const recordId = `${contract}_${date}`;
  const photoId = `${recordId}_${slotId}`;
  const shiftId = `${recordId}_${shift}`;

  // Step A: Ensure Master Record Row exists (without locking a single supervisor to the whole day)
  const { error: masterErr } = await supabase
    .from('records')
    .upsert({
      id: recordId,
      contract,
      date,
      updated_at: new Date().toISOString()
    });

  if (masterErr) {
    throw new Error(`Error en base de datos master: ${masterErr.message}`);
  }

  // Step B: Record supervisor responsible for this specific shift
  if (supervisor && supervisor.trim()) {
    await supabase
      .from('record_shifts')
      .upsert({
        id: shiftId,
        record_id: recordId,
        contract,
        date,
        shift,
        supervisor: supervisor.trim(),
        updated_at: new Date().toISOString()
      });
  }

  // Step C: Upload File to Supabase Storage Bucket ('record-photos')
  const { publicUrl, storagePath } = await uploadPhotoToStorage(contract, date, shift, slotId, photoSource);

  // Step D: Check if slot already exists to log UPLOAD vs REPLACE action
  const { data: existingPhoto } = await supabase
    .from('record_photos')
    .select('supervisor')
    .eq('id', photoId)
    .maybeSingle();

  const isReplace = !!existingPhoto;

  // Step E: Upsert row in record_photos ONLY for this slot_id
  const { error: photoErr } = await supabase
    .from('record_photos')
    .upsert({
      id: photoId,
      record_id: recordId,
      contract,
      date,
      shift,
      slot_id: slotId,
      slot_title: slotTitle,
      supervisor,
      photo_url: publicUrl,
      storage_path: storagePath,
      updated_at: new Date().toISOString()
    });

  if (photoErr) {
    throw new Error(`Error guardando foto en base de datos: ${photoErr.message}`);
  }

  // Step F: Insert Audit Log entry
  const auditId = `aud_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const actionText = isReplace ? 'REPLACE' : 'UPLOAD';
  const detailsText = isReplace
    ? `Actualizó la foto para "${slotTitle}"`
    : `Subió la foto para "${slotTitle}"`;

  await supabase
    .from('record_audit')
    .insert({
      id: auditId,
      record_id: recordId,
      contract,
      date,
      slot_id: slotId,
      supervisor,
      action: actionText,
      details: detailsText,
      created_at: new Date().toISOString()
    });

  return publicUrl;
}

// 4. Delete Single Photo (Granular Delete by slot_id)
export async function deleteSinglePhoto({ contract, date, slotId, slotTitle, supervisor }) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Error de conexión a la nube. No se pudo eliminar la foto.');
  }

  const recordId = `${contract}_${date}`;
  const photoId = `${recordId}_${slotId}`;

  // Delete strictly from record_photos table for this slot_id
  const { error } = await supabase
    .from('record_photos')
    .delete()
    .eq('id', photoId);

  if (error) {
    throw new Error(`Error al eliminar foto: ${error.message}`);
  }

  // Insert Audit Log entry
  const auditId = `aud_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  await supabase
    .from('record_audit')
    .insert({
      id: auditId,
      record_id: recordId,
      contract,
      date,
      slot_id: slotId,
      supervisor: supervisor || 'Supervisor',
      action: 'DELETE',
      details: `Eliminó la foto de "${slotTitle}"`,
      created_at: new Date().toISOString()
    });
}

// 5. Fetch All Records for History Page
export async function getAllRecords() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: recs, error: recsErr } = await supabase
        .from('records')
        .select('*')
        .order('date', { ascending: false });

      if (recsErr && recsErr.code !== '42P01') throw recsErr;

      const { data: photos } = await supabase
        .from('record_photos')
        .select('*');

      const { data: shifts } = await supabase
        .from('record_shifts')
        .select('*');

      const photosByRecord = {};
      const slotMetaByRecord = {};
      const supervisorsByRecord = {};

      (photos || []).forEach(p => {
        if (!photosByRecord[p.record_id]) photosByRecord[p.record_id] = {};
        if (!slotMetaByRecord[p.record_id]) slotMetaByRecord[p.record_id] = {};
        if (!supervisorsByRecord[p.record_id]) supervisorsByRecord[p.record_id] = new Set();
        
        photosByRecord[p.record_id][p.slot_id] = p.photo_url;
        slotMetaByRecord[p.record_id][p.slot_id] = {
          lastSupervisor: p.supervisor,
          updatedAt: p.updated_at,
          shift: p.shift
        };
        if (p.supervisor) supervisorsByRecord[p.record_id].add(p.supervisor);
      });

      (shifts || []).forEach(s => {
        if (!supervisorsByRecord[s.record_id]) supervisorsByRecord[s.record_id] = new Set();
        if (s.supervisor) supervisorsByRecord[s.record_id].add(s.supervisor);
      });

      if (recs) {
        return recs.map(r => {
          const supSet = supervisorsByRecord[r.id] || new Set();
          const supervisorListStr = Array.from(supSet).join(', ');

          return {
            id: r.id,
            contract: r.contract,
            date: r.date,
            supervisor: supervisorListStr || 'Sin especificar',
            photos: photosByRecord[r.id] || {},
            slotMeta: slotMetaByRecord[r.id] || {},
            auditLog: []
          };
        });
      }
    } catch (err) {
      console.warn('Error fetching all records from Supabase Cloud:', err);
    }
  }
  return localDb.getAllRecords();
}

// 6. Supabase Realtime Subscription
// Updates local state incrementally without wiping existing photos
export function subscribeToRecordChanges(contract, date, onUpdateCallback) {
  if (!isSupabaseConfigured || !supabase) return () => {};

  const recordId = `${contract}_${date}`;
  const channelName = `realtime_${recordId}_${Date.now()}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'record_photos',
        filter: `record_id=eq.${recordId}`
      },
      () => {
        // Fetch fresh state for this record without modifying active supervisor session
        getRecord(contract, date).then(freshRecord => {
          if (freshRecord) onUpdateCallback(freshRecord);
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Supervisors Datalist Service
export async function getSupervisors() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('supervisors').select('name');
      if (error && error.code !== '42P01') throw error;
      if (data && data.length > 0) {
        return data.map(s => s.name);
      }
    } catch (err) {
      console.warn('Error fetching supervisors:', err);
    }
  }
  return localDb.getSupervisors();
}

export async function addSupervisor(name) {
  if (!name || !name.trim()) return;
  const cleanName = name.trim();
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('supervisors').upsert({ name: cleanName });
    } catch (err) {
      console.warn('Error adding supervisor:', err);
    }
  }
  return localDb.addSupervisor(cleanName);
}

// Settings & Document Template Config Service
export async function getConfig() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('config')
        .eq('id', 'app_config')
        .maybeSingle();

      if (error && error.code !== 'PGRST116' && error.code !== '42P01') throw error;
      if (data && data.config) {
        return { ...localDb.DEFAULT_CONFIG, ...data.config };
      }
    } catch (err) {
      console.warn('Error fetching config:', err);
    }
  }
  return localDb.getConfig();
}

export async function saveConfig(configData) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('settings').upsert({
        id: 'app_config',
        config: configData,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
    } catch (err) {
      console.warn('Error saving config to Supabase Cloud:', err);
      throw new Error(`Error en configuración: ${err.message}`);
    }
  }
  return localDb.saveConfig(configData);
}
