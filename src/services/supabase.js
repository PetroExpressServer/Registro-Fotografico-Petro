import { createClient } from '@supabase/supabase-js';
import * as localDb from './db';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// UNIFIED HYBRID SERVICE: Uses Supabase Cloud when credentials exist, else falls back to Local IndexedDB

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
      console.warn('Error fetching record from Supabase, falling back to local DB:', err);
    }
  }
  return localDb.getRecord(contract, date);
}

export async function saveRecord(record) {
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
      if (error) throw error;
    } catch (err) {
      console.warn('Error saving record to Supabase, saving to local DB:', err);
    }
  }
  return localDb.saveRecord(record);
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
      console.warn('Error fetching all records from Supabase, falling back to local DB:', err);
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
      console.warn('Error fetching supervisors from Supabase:', err);
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
      console.warn('Error adding supervisor to Supabase:', err);
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
      console.warn('Error fetching config from Supabase:', err);
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
      console.warn('Error saving config to Supabase:', err);
    }
  }
  return localDb.saveConfig(configData);
}
