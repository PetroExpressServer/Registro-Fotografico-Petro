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

// 1. Upload Photo to Supabase Storage Bucket ('record-photos')
export async function uploadPhotoToStorage(contract, date, slotId, photoSource) {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase no está configurado');

  let fileBlob;
  if (photoSource instanceof File || photoSource instanceof Blob) {
    fileBlob = photoSource;
  } else if (typeof photoSource === 'string' && photoSource.startsWith('data:')) {
    fileBlob = base64ToBlob(photoSource);
  } else {
    throw new Error('Formato de imagen inválido');
  }

  const filePath = `${contract}/${date}/${slotId}.jpg`;
  
  const { error: uploadError } = await supabase.storage
    .from('record-photos')
    .upload(filePath, fileBlob, {
      contentType: 'image/jpeg',
      upsert: true
    });

  if (uploadError) {
    console.error('Error uploading file to storage bucket:', uploadError);
    throw new Error(`Error en Storage: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('record-photos')
    .getPublicUrl(filePath);

  // Append timestamp query parameter to bust cache when updating
  return `${publicUrlData.publicUrl}?t=${Date.now()}`;
}

// 2. Fetch Single Record with Granular Photos & Independent Audit Log
export async function getRecord(contract, date) {
  const recordId = `${contract}_${date}`;

  if (isSupabaseConfigured && supabase) {
    try {
      // Ensure master record row
      const { data: mainRec } = await supabase
        .from('records')
        .select('*')
        .eq('id', recordId)
        .maybeSingle();

      // Fetch all photos for this day and contract
      const { data: photosRows, error: photosErr } = await supabase
        .from('record_photos')
        .select('*')
        .eq('contract', contract)
        .eq('date', date);

      if (photosErr && photosErr.code !== 'PGRST116' && photosErr.code !== '42P01') {
        throw photosErr;
      }

      // Fetch audit log
      const { data: auditRows } = await supabase
        .from('record_audit')
        .select('*')
        .eq('contract', contract)
        .eq('date', date)
        .order('created_at', { ascending: true });

      const photosMap = {};
      const slotMetaMap = {};

      if (photosRows) {
        photosRows.forEach(row => {
          photosMap[row.slot_id] = row.photo_url;
          slotMetaMap[row.slot_id] = {
            lastSupervisor: row.supervisor,
            updatedAt: row.updated_at
          };
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
        supervisor: mainRec?.supervisor || '',
        photos: photosMap,
        slotMeta: slotMetaMap,
        auditLog: auditList
      };

    } catch (err) {
      console.warn('Error fetching record from Supabase Cloud:', err);
    }
  }

  return localDb.getRecord(contract, date);
}

// 3. Upload & Save Single Photo (Granular Multi-Supervisor Concurrency)
export async function saveSinglePhoto({ contract, date, slotId, slotTitle, supervisor, photoSource }) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Error de conexión a la nube. No se pudo guardar la foto.');
  }

  const recordId = `${contract}_${date}`;
  const photoId = `${contract}_${date}_${slotId}`;

  // Step A: Ensure Master Record Row
  const { error: masterErr } = await supabase
    .from('records')
    .upsert({
      id: recordId,
      contract,
      date,
      supervisor,
      updated_at: new Date().toISOString()
    });

  if (masterErr) {
    throw new Error(`Error en base de datos: ${masterErr.message}`);
  }

  // Step B: Upload File to Supabase Storage Bucket ('record-photos')
  const publicUrl = await uploadPhotoToStorage(contract, date, slotId, photoSource);

  // Step C: Check if slot already has a photo to determine action (UPLOAD vs REPLACE)
  const { data: existingPhoto } = await supabase
    .from('record_photos')
    .select('supervisor')
    .eq('id', photoId)
    .maybeSingle();

  const isReplace = !!existingPhoto;

  // Step D: Insert/Upsert Row in record_photos (Specific to slot, no overwriting of other slots)
  const { error: photoErr } = await supabase
    .from('record_photos')
    .upsert({
      id: photoId,
      record_id: recordId,
      contract,
      date,
      slot_id: slotId,
      slot_title: slotTitle,
      supervisor,
      photo_url: publicUrl,
      updated_at: new Date().toISOString()
    });

  if (photoErr) {
    throw new Error(`Error guardando información de foto: ${photoErr.message}`);
  }

  // Step E: Insert Independent Audit Record
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

// 4. Delete Single Photo (Granular Delete)
export async function deleteSinglePhoto({ contract, date, slotId, slotTitle, supervisor }) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Error de conexión a la nube. No se pudo eliminar la foto.');
  }

  const recordId = `${contract}_${date}`;
  const photoId = `${contract}_${date}_${slotId}`;

  // Delete from record_photos table
  const { error } = await supabase
    .from('record_photos')
    .delete()
    .eq('id', photoId);

  if (error) {
    throw new Error(`Error al eliminar foto: ${error.message}`);
  }

  // Insert Audit Log for Delete Action
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

// 5. Fetch All Records for History View
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

      const photosByRecord = {};
      const slotMetaByRecord = {};

      (photos || []).forEach(p => {
        if (!photosByRecord[p.record_id]) photosByRecord[p.record_id] = {};
        if (!slotMetaByRecord[p.record_id]) slotMetaByRecord[p.record_id] = {};
        photosByRecord[p.record_id][p.slot_id] = p.photo_url;
        slotMetaByRecord[p.record_id][p.slot_id] = {
          lastSupervisor: p.supervisor,
          updatedAt: p.updated_at
        };
      });

      if (recs) {
        return recs.map(r => ({
          id: r.id,
          contract: r.contract,
          date: r.date,
          supervisor: r.supervisor,
          photos: photosByRecord[r.id] || {},
          slotMeta: slotMetaByRecord[r.id] || {},
          auditLog: []
        }));
      }
    } catch (err) {
      console.warn('Error fetching all records from Supabase Cloud:', err);
    }
  }
  return localDb.getAllRecords();
}

// 6. Supabase Realtime Subscription for Instant Multi-Device Sync
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
        // Fetch fresh state on change
        getRecord(contract, date).then(onUpdateCallback);
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
