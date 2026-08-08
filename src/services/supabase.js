import { createClient } from '@supabase/supabase-js';
import * as localDb from './db';

// Direct production fallbacks to guarantee cloud synchronization across all mobile & desktop devices
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

// UNIFIED HYBRID CLOUD SERVICE: Syncs seamlessly with Supabase Cloud across all devices

export async function getRecord(contract, date) {
  if (isSupabaseConfigured && supabase) {
    try {
      const id = `${contract}_${date}`;
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        return {
          id: data.id,
          contract: data.contract,
          date: data.date,
          supervisor: data.supervisor,
          photos: data.photos || {},
          slotMeta: data.slot_meta || {},
          auditLog: data.audit_log || []
        };
      }
    } catch (err) {
      console.warn('Error fetching record from Supabase Cloud, checking local DB:', err);
    }
  }
  return localDb.getRecord(contract, date);
}

export async function saveRecord(record) {
  // Always save to local IndexedDB first for instant safety
  await localDb.saveRecord(record);

  if (isSupabaseConfigured && supabase) {
    try {
      const id = `${record.contract}_${record.date}`;
      const payload = {
        id,
        contract: record.contract,
        date: record.date,
        supervisor: record.supervisor || 'Supervisor sin especificar',
        photos: record.photos || {},
        slot_meta: record.slotMeta || {},
        audit_log: record.auditLog || [],
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('records').upsert(payload);
      if (error) {
        console.warn('Supabase save warning:', error.message);
      }
    } catch (err) {
      console.warn('Error saving record to Supabase Cloud:', err);
    }
  }
}

export async function getAllRecords() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      if (data) {
        return data.map(d => ({
          id: d.id,
          contract: d.contract,
          date: d.date,
          supervisor: d.supervisor,
          photos: d.photos || {},
          slotMeta: d.slot_meta || {},
          auditLog: d.audit_log || []
        }));
      }
    } catch (err) {
      console.warn('Error fetching all records from Supabase Cloud:', err);
    }
  }
  return localDb.getAllRecords();
}

export async function getSupervisors() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('supervisors').select('name');
      if (error) throw error;
      if (data && data.length > 0) {
        return data.map(s => s.name);
      }
    } catch (err) {
      console.warn('Error fetching supervisors from Supabase Cloud:', err);
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
      console.warn('Error adding supervisor to Supabase Cloud:', err);
    }
  }
  return localDb.addSupervisor(cleanName);
}

export async function getConfig() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('config')
        .eq('id', 'app_config')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      if (data && data.config) {
        return { ...localDb.DEFAULT_CONFIG, ...data.config };
      }
    } catch (err) {
      console.warn('Error fetching config from Supabase Cloud:', err);
    }
  }
  return localDb.getConfig();
}

export async function saveConfig(configData) {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('settings').upsert({
        id: 'app_config',
        config: configData,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Error saving config to Supabase Cloud:', err);
    }
  }
  return localDb.saveConfig(configData);
}

// Auto Sync helper: Uploads any local IndexedDB records to Supabase Cloud
export async function syncLocalToCloud() {
  if (!isSupabaseConfigured || !supabase) return 0;
  try {
    const allLocal = await localDb.getAllRecords();
    let count = 0;
    for (const record of allLocal) {
      if (record.contract && record.date && record.photos && Object.keys(record.photos).length > 0) {
        await saveRecord(record);
        count++;
      }
    }
    return count;
  } catch (err) {
    console.error('Error syncing local records to cloud:', err);
    return 0;
  }
}
