-- ==========================================================
-- SCRIPT SQL PARA CREAR LAS TABLAS EN SUPABASE (SQL EDITOR)
-- ==========================================================

-- 1. Tabla de Registros Fotográficos Diarios
CREATE TABLE IF NOT EXISTS public.records (
    id TEXT PRIMARY KEY,                       -- Formato: 'PRINCIPAL_2026-08-07' o 'B2_2026-08-07'
    contract TEXT NOT NULL,                    -- 'PRINCIPAL' o 'B2'
    date DATE NOT NULL,                        -- Fecha del informe
    supervisor TEXT NOT NULL,                  -- Último supervisor a cargo
    photos JSONB DEFAULT '{}'::jsonb,          -- Diccionario { slotId: base64 }
    slot_meta JSONB DEFAULT '{}'::jsonb,       -- Metadatos { slotId: { lastSupervisor, lastUpdated } }
    audit_log JSONB DEFAULT '[]'::jsonb,       -- Lista de eventos de auditoría
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Supervisores (Autocompletado)
CREATE TABLE IF NOT EXISTS public.supervisors (
    name TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Configuración de Formato (Logos y Títulos)
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'app_config',
    config JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar seguridad RLS y Políticas de Acceso Público Libre (para supervisores sin login estricto)
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura y escritura en records" ON public.records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir lectura y escritura en supervisors" ON public.supervisors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir lectura y escritura en settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
