-- Alista Database Schema
-- Ejecutar en Supabase SQL Editor. Idempotente: es seguro correrlo varias veces.

-- ============================================================================
-- TABLAS NUCLEO
--
-- CREATE TABLE IF NOT EXISTS: en una base que ya tiene estas tablas no hace
-- nada; solo aplica al montar el proyecto de cero. La estructura (columnas,
-- tipos, PK y FK) se reconstruyo desde la base real via la API de PostgREST.
-- Lo marcado con [inferido] (algunos DEFAULT y UNIQUE) proviene de la logica de
-- la app y conviene verificarlo contra un dump real antes de un deploy productivo.
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,                       -- [inferido] unique
  event_type text not null,
  event_date date not null,
  start_time time,
  venue_name text,
  venue_address text,
  max_capacity integer,
  status text not null default 'draft',            -- [inferido] default
  description text,
  created_by_user_id uuid,
  contact_phone text,
  delivery_profile_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists guest_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  name text not null,
  description text,
  color_label text,
  access_policy_label text,
  access_start_time time,
  access_end_time time,
  access_start_day_offset integer,
  access_end_day_offset integer,
  uses_event_capacity boolean not null default true,   -- [inferido] default
  is_active boolean not null default true,             -- [inferido] default
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists event_branding (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  logo_url text,
  cover_image_url text,
  primary_color text,
  secondary_color text,
  background_image_url text,
  totem_idle_video_url text,
  welcome_message text,
  approved_message text,
  assistance_message text,
  invalid_message text,
  return_to_idle_seconds integer not null default 8,   -- [inferido] default
  config jsonb,                                        -- config rica de la invitacion (widgets, dresscode, campos)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Base existente: agrega la columna config sin romper si ya existe.
ALTER TABLE event_branding ADD COLUMN IF NOT EXISTS config jsonb;

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  guest_type_id uuid references guest_types (id) on delete set null,
  first_name text not null,
  last_name text,
  full_name text not null,
  phone text,
  email text,
  document_number text,
  photo_url text,
  status text not null default 'preinvited',           -- [inferido] default
  notes text,
  created_manually boolean not null default true,      -- [inferido] default
  created_by_user_id uuid,
  payment_status text not null default 'not_required'
    check (payment_status in ('not_required', 'pending', 'approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists invitation_tokens (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests (id) on delete cascade,
  token text not null unique,                          -- [inferido] unique
  expires_at timestamptz,
  max_uses integer not null default 1,                 -- [inferido] default
  used_count integer not null default 0,               -- [inferido] default
  is_active boolean not null default true,             -- [inferido] default
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists guest_qr_codes (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests (id) on delete cascade,
  qr_value text not null unique,                       -- [inferido] unique
  qr_image_url text,
  is_active boolean not null default true,             -- [inferido] default
  generated_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  guest_id uuid references guests (id) on delete set null,
  qr_code_id uuid references guest_qr_codes (id) on delete set null,
  operator_user_id uuid,
  device_name text,
  result text not null,
  reason text,
  checked_in_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists totem_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  triggered_by_checkin_id uuid references checkins (id) on delete set null,
  screen_state text not null default 'idle',           -- [inferido] default
  guest_display_name text,
  guest_photo_url text,
  message_text text,
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

-- paymentStatus migrado de notes (texto serializado) a columna propia.
-- Migration: add_payment_status_to_guests (2026-06-01)
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'not_required'
  CHECK (payment_status IN ('not_required','pending','approved'));

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE totem_sessions ENABLE ROW LEVEL SECURITY;

-- Realtime: el totem escucha INSERTs en checkins para el spotlight instantaneo.
-- Sin esto el spotlight igual funciona, pero con la demora del polling de respaldo.
-- Migration: enable_realtime_on_checkins (2026-07-12)
-- Idempotente: no falla si la tabla ya es miembro de la publicacion.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'checkins'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE checkins;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS delivery_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel_mode text NOT NULL DEFAULT 'hybrid',
  provider_email text,
  provider_whatsapp text,
  from_email text,
  from_phone text,
  reply_to_phone text,
  whatsapp_content_sid text,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operator_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  roles text[] NOT NULL DEFAULT ARRAY[]::text[],
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  guest_id uuid NOT NULL,
  invitation_token_id uuid,
  delivery_profile_id text,
  channel text NOT NULL,
  provider text,
  recipient text NOT NULL,
  status text NOT NULL,
  external_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Future event templates (editable presets reusable across events)
CREATE TABLE IF NOT EXISTS event_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  event_type text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_template_guest_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES event_templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  access_policy_label text,
  access_start_time time,
  access_end_time time,
  access_start_day_offset integer NOT NULL DEFAULT 0,
  access_end_day_offset integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Guest type access windows
ALTER TABLE guest_types ADD COLUMN IF NOT EXISTS access_policy_label text;
ALTER TABLE guest_types ADD COLUMN IF NOT EXISTS access_start_time time;
ALTER TABLE guest_types ADD COLUMN IF NOT EXISTS access_end_time time;
ALTER TABLE guest_types ADD COLUMN IF NOT EXISTS access_start_day_offset integer DEFAULT 0;
ALTER TABLE guest_types ADD COLUMN IF NOT EXISTS access_end_day_offset integer DEFAULT 0;

-- Event communication and delivery profile
ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS delivery_profile_id text;

-- Events policies (public read for active events, admin write)
CREATE POLICY "Public can view active events" ON events
  FOR SELECT USING (status = 'active');

CREATE POLICY "Authenticated users can manage events" ON events
  FOR ALL USING (auth.role() = 'authenticated');

-- Event branding policies
CREATE POLICY "Public can view branding for active events" ON event_branding
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_branding.event_id
      AND events.status = 'active'
    )
  );

CREATE POLICY "Authenticated users can manage branding" ON event_branding
  FOR ALL USING (auth.role() = 'authenticated');

-- Delivery profiles policies
ALTER TABLE delivery_profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE operator_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage delivery profiles" ON delivery_profiles
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own operator profile" ON operator_profiles
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage delivery logs" ON delivery_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- Guest types policies
CREATE POLICY "Public can view guest types for active events" ON guest_types
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guest_types.event_id
      AND events.status = 'active'
    )
  );

CREATE POLICY "Authenticated users can manage guest types" ON guest_types
  FOR ALL USING (auth.role() = 'authenticated');

-- Guests policies (guests can only see their own data)
CREATE POLICY "Guests can view their own data" ON guests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can manage guests" ON guests
  FOR ALL USING (auth.role() = 'authenticated');

-- Invitation tokens policies
CREATE POLICY "Public can read invitation tokens" ON invitation_tokens
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage invitation tokens" ON invitation_tokens
  FOR ALL USING (auth.role() = 'authenticated');

-- Guest QR codes policies
CREATE POLICY "Guests can view their own QR codes" ON guest_qr_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM guests
      WHERE guests.id = guest_qr_codes.guest_id
      AND guests.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can manage QR codes" ON guest_qr_codes
  FOR ALL USING (auth.role() = 'authenticated');

-- Checkins policies
CREATE POLICY "Guests can view their own checkins" ON checkins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM guests
      WHERE guests.id = checkins.guest_id
      AND guests.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can manage checkins" ON checkins
  FOR ALL USING (auth.role() = 'authenticated');

-- Totem sessions policies
CREATE POLICY "Authenticated users can manage totem sessions" ON totem_sessions
  FOR ALL USING (auth.role() = 'authenticated');

-- Storage policies for buckets
-- event-assets bucket
CREATE POLICY "Public can view event assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-assets');

CREATE POLICY "Authenticated users can manage event assets" ON storage.objects
  FOR ALL USING (bucket_id = 'event-assets' AND auth.role() = 'authenticated');

-- guest-photos bucket
CREATE POLICY "Guests can view their own photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'guest-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Guests can upload their own photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'guest-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Authenticated users can manage guest photos" ON storage.objects
  FOR ALL USING (bucket_id = 'guest-photos' AND auth.role() = 'authenticated');

-- qr-codes bucket
CREATE POLICY "Public can view QR codes" ON storage.objects
  FOR SELECT USING (bucket_id = 'qr-codes');

CREATE POLICY "Authenticated users can manage QR codes" ON storage.objects
  FOR ALL USING (bucket_id = 'qr-codes' AND auth.role() = 'authenticated');
