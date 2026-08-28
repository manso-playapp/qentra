-- ============================================================================
-- Propiedad del evento como primitiva de autorizacion.
--
-- Modelo:
--   dueno   -> events.owner_user_id. Es de quien es la fiesta (la madre / el
--              responsable). Se puede transferir: el planner puede crear y
--              configurar, y despues entregar la propiedad a la responsable,
--              que es la unica que puede conectar Mercado Pago y recibir el
--              dinero de las entradas.
--   equipo  -> event_admin_assignments. Personas que el dueno invita
--              (recepcion, puerta, planner). NO requiere ser operador de
--              Alista.
--   soporte -> is_alista_staff(). Equipo interno de Alista.
--
-- DECISION TOMADA (28/08/2026): is_alista_staff() da acceso total, permanente
-- y sin registro a todos los eventos. Es deliberado, no un descuido: el
-- soporte de Alista tiene que poder entrar a resolver un problema la noche
-- anterior a la fiesta. Si alguna vez hace falta acotarlo (registro de
-- accesos, o sesiones de soporte con vencimiento visibles para el dueno),
-- esta funcion es el unico lugar a tocar.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Dueno del evento
-- ---------------------------------------------------------------------------
alter table public.events
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

-- Backfill desde la columna informativa que ya existia. En la base actual los
-- dos eventos tienen created_by_user_id nulo, asi que quedan sin dueno y
-- siguen siendo administrables por el staff hasta que se les asigne uno.
update public.events
  set owner_user_id = created_by_user_id
  where owner_user_id is null and created_by_user_id is not null;

create index if not exists events_owner_user_id_idx on public.events(owner_user_id);

-- ---------------------------------------------------------------------------
-- 2. Equipo invitado por el dueno
--
-- La FK apunta a auth.users y NO a operator_profiles: un colaborador invitado
-- por la duena no tiene por que ser un operador dado de alta por Alista.
-- ---------------------------------------------------------------------------
create table if not exists public.event_admin_assignments (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by_user_id uuid references auth.users(id) on delete set null,
  primary key (user_id, event_id)
);

create index if not exists event_admin_assignments_event_id_idx
  on public.event_admin_assignments(event_id);

alter table public.event_admin_assignments enable row level security;
revoke all on table public.event_admin_assignments from anon, authenticated;
grant select, insert, delete on table public.event_admin_assignments to authenticated;

drop policy if exists "Users can view their own event assignments" on public.event_admin_assignments;
create policy "Users can view their own event assignments"
  on public.event_admin_assignments for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 3. Funciones de autorizacion
--
-- SECURITY DEFINER a proposito: can_manage_event() ahora lee public.events
-- para resolver la propiedad. Con SECURITY INVOKER, evaluar la policy de
-- events llamaria a una funcion que vuelve a consultar events -> recursion
-- infinita. DEFINER corta ese ciclo y ademas mantiene rapida la puerta, que no
-- puede pagar una evaluacion de policy anidada por cada fila.
--
-- Es seguro: ambas funciones resuelven siempre contra auth.uid() y solo
-- devuelven un booleano sobre el acceso de quien llama. No sirven para
-- inspeccionar los permisos de otra persona.
-- ---------------------------------------------------------------------------
drop function if exists public.is_global_operator_admin();

create or replace function public.is_alista_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (
    select 1
    from public.operator_profiles profile
    where profile.user_id = (select auth.uid())
      and profile.active
      and 'admin' = any(profile.roles)
  );
$fn$;

create or replace function public.can_manage_event(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select
    public.is_alista_staff()
    or exists (
      select 1 from public.events event
      where event.id = target_event_id
        and event.owner_user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.event_admin_assignments assignment
      where assignment.user_id = (select auth.uid())
        and assignment.event_id = target_event_id
    );
$fn$;

revoke all on function public.is_alista_staff() from public, anon;
revoke all on function public.can_manage_event(uuid) from public, anon;
grant execute on function public.is_alista_staff() to authenticated;
grant execute on function public.can_manage_event(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Eventos
--
-- Reemplaza las politicas permisivas que daban acceso total a cualquier cuenta
-- autenticada. Las politicas publicas de eventos activos se conservan.
--
-- La policy de INSERT es la unica linea que habilita el self-serve: cualquier
-- persona autenticada puede crear un evento, siempre que se ponga a si misma
-- como duena.
--
-- Las policies de events NO llaman a can_manage_event(): sobre la propia fila
-- owner_user_id ya esta disponible, y evitarlo mantiene el grafo de policies
-- sin ciclos.
-- ---------------------------------------------------------------------------
drop policy if exists "Authenticated users can manage events" on public.events;
drop policy if exists "Event operators can view assigned events" on public.events;
drop policy if exists "Global admins can create events" on public.events;
drop policy if exists "Event operators can update assigned events" on public.events;
drop policy if exists "Event operators can delete assigned events" on public.events;

create policy "Owners and team can view their events"
  on public.events for select to authenticated
  using (
    owner_user_id = (select auth.uid())
    or public.is_alista_staff()
    or exists (
      select 1 from public.event_admin_assignments assignment
      where assignment.event_id = events.id
        and assignment.user_id = (select auth.uid())
    )
  );

create policy "Anyone authenticated can create their own event"
  on public.events for insert to authenticated
  with check (owner_user_id = (select auth.uid()));

create policy "Owners and team can update their events"
  on public.events for update to authenticated
  using (
    owner_user_id = (select auth.uid())
    or public.is_alista_staff()
    or exists (
      select 1 from public.event_admin_assignments assignment
      where assignment.event_id = events.id
        and assignment.user_id = (select auth.uid())
    )
  )
  with check (
    owner_user_id = (select auth.uid())
    or public.is_alista_staff()
    or exists (
      select 1 from public.event_admin_assignments assignment
      where assignment.event_id = events.id
        and assignment.user_id = (select auth.uid())
    )
  );

-- Borrar el evento es del dueno (o del staff). Un colaborador invitado no
-- puede borrar la fiesta de otra persona.
create policy "Only the owner can delete their event"
  on public.events for delete to authenticated
  using (owner_user_id = (select auth.uid()) or public.is_alista_staff());

-- ---------------------------------------------------------------------------
-- 5. Quien invita al equipo es el dueno
-- ---------------------------------------------------------------------------
drop policy if exists "Owners can grant access to their events" on public.event_admin_assignments;
create policy "Owners can grant access to their events"
  on public.event_admin_assignments for insert to authenticated
  with check (
    public.is_alista_staff()
    or exists (
      select 1 from public.events event
      where event.id = event_admin_assignments.event_id
        and event.owner_user_id = (select auth.uid())
    )
  );

drop policy if exists "Owners can revoke access to their events" on public.event_admin_assignments;
create policy "Owners can revoke access to their events"
  on public.event_admin_assignments for delete to authenticated
  using (
    public.is_alista_staff()
    or exists (
      select 1 from public.events event
      where event.id = event_admin_assignments.event_id
        and event.owner_user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- 6. Tablas dependientes del evento
-- ---------------------------------------------------------------------------
drop policy if exists "Authenticated users can manage branding" on public.event_branding;
create policy "Event operators can manage branding"
  on public.event_branding for all to authenticated
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));

drop policy if exists "Authenticated users can manage guest types" on public.guest_types;
create policy "Event operators can manage guest types"
  on public.guest_types for all to authenticated
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));

drop policy if exists "Authenticated users can manage guests" on public.guests;
create policy "Event operators can manage guests"
  on public.guests for all to authenticated
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));

drop policy if exists "Authenticated users can manage invitation tokens" on public.invitation_tokens;
create policy "Event operators can manage invitation tokens"
  on public.invitation_tokens for all to authenticated
  using (exists (
    select 1 from public.guests guest
    where guest.id = invitation_tokens.guest_id
      and public.can_manage_event(guest.event_id)
  ))
  with check (exists (
    select 1 from public.guests guest
    where guest.id = invitation_tokens.guest_id
      and public.can_manage_event(guest.event_id)
  ));

drop policy if exists "Authenticated users can manage QR codes" on public.guest_qr_codes;
create policy "Event operators can manage QR codes"
  on public.guest_qr_codes for all to authenticated
  using (exists (
    select 1 from public.guests guest
    where guest.id = guest_qr_codes.guest_id
      and public.can_manage_event(guest.event_id)
  ))
  with check (exists (
    select 1 from public.guests guest
    where guest.id = guest_qr_codes.guest_id
      and public.can_manage_event(guest.event_id)
  ));

drop policy if exists "Authenticated users can manage checkins" on public.checkins;
create policy "Event operators can manage checkins"
  on public.checkins for all to authenticated
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));

drop policy if exists "Authenticated users can manage totem sessions" on public.totem_sessions;
create policy "Event operators can manage totem sessions"
  on public.totem_sessions for all to authenticated
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));

drop policy if exists "Authenticated users can manage delivery logs" on public.delivery_logs;
create policy "Event operators can manage delivery logs"
  on public.delivery_logs for all to authenticated
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));

-- Los perfiles de envio son infraestructura de Alista, no del evento.
drop policy if exists "Authenticated users can manage delivery profiles" on public.delivery_profiles;
create policy "Alista staff can manage delivery profiles"
  on public.delivery_profiles for all to authenticated
  using (public.is_alista_staff())
  with check (public.is_alista_staff());

-- ---------------------------------------------------------------------------
-- 7. Storage
--
-- Los uploads administrativos pasan por /api/uploads con service_role. Se
-- elimina el bypass directo que antes permitia escribir cualquier carpeta.
-- ---------------------------------------------------------------------------
drop policy if exists "Authenticated users can manage event assets" on storage.objects;
drop policy if exists "Authenticated users can manage guest photos" on storage.objects;
drop policy if exists "Authenticated users can manage QR codes" on storage.objects;
