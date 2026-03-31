-- Qentra Database Schema
-- Ejecutar en Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE totem_sessions ENABLE ROW LEVEL SECURITY;

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
