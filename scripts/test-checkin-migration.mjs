// Runs PostgreSQL/PLpgSQL in PGlite with synthetic data only. No Supabase URL.
// PGLITE_MODULE_PATH=/path/to/pglite/dist/index.js node scripts/test-checkin-migration.mjs
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const { PGlite } = await import(process.env.PGLITE_MODULE_PATH || '@electric-sql/pglite')
const db = new PGlite()
let assertions = 0
const equal = (actual, expected, label) => { assert.deepEqual(actual, expected, label); assertions++ }
const scalar = async (sql, args = []) => (await db.query(sql, args)).rows[0].value
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`
const event = id(1), otherEvent = id(2), type = id(3)
const checkin = (guest, { token = null, method = 'manual', reason = null, override = null } = {}) =>
  scalar('select public.register_guest_checkin_guarded($1,$2,$3,$4,$5,$6) as value',
    [event, id(guest), token && id(token), method, reason, override])
async function rejects(action, message, label = message) {
  try { await action(); assert.fail(`Expected ${message}: ${label}`) }
  catch (error) { equal(error.message, message, label) }
}
async function guest(n, status = 'enabled', payment = 'not_required', companions = 0) {
  await db.query('insert into guests(id,event_id,status,payment_status,plus_ones_confirmed) values($1,$2,$3,$4,$5)',
    [id(n), event, status, payment, companions])
}
async function reset(capacity = 100) {
  await db.exec('truncate checkins,guests,invitation_tokens,guest_qr_codes,event_activations;')
  await db.query('update events set max_capacity=$1,event_date=(now() at time zone \'America/Argentina/Buenos_Aires\')::date,start_time=\'21:00\' where id=$2', [capacity,event])
  await db.exec('update guest_types set access_start_time=null,access_end_time=null,access_start_day_offset=null,access_end_day_offset=null')
  await db.query('insert into event_activations(event_id) values($1)', [event])
}

try {
  // Small fixture deliberately permits NULL/unknown values to test fail-closed
  // behavior even if current production CHECK/NOT NULL constraints prevent them.
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create table events(id uuid primary key,event_date date,start_time time,max_capacity integer);
    create table guest_types(id uuid primary key,event_id uuid,access_start_time time,access_end_time time,access_start_day_offset integer,access_end_day_offset integer);
    create table guests(id uuid primary key,event_id uuid,guest_type_id uuid,status text,payment_status text,plus_ones_confirmed integer,companion_names text[],updated_at timestamptz);
    create table invitation_tokens(id uuid primary key,guest_id uuid,token text,expires_at timestamptz,max_uses integer,used_count integer,is_active boolean,last_used_at timestamptz,created_at timestamptz default now());
    create table guest_qr_codes(id uuid primary key,guest_id uuid,qr_value text,is_active boolean,revoked_at timestamptz);
    create table checkins(id uuid primary key default gen_random_uuid(),event_id uuid,guest_id uuid,checked_in_at timestamptz,result text,device_name text,reason text);
    create table event_activations(event_id uuid primary key,consumed_at timestamptz,consumed_for_date date);
    grant select,insert,update,delete,truncate on all tables in schema public to anon,authenticated;
  `)
  await db.query('insert into events values($1,current_date,\'21:00\',100),($2,current_date,\'21:00\',100)', [event,otherEvent])
  await db.query('insert into guest_types(id,event_id) values($1,$2)',[type,event])
  await guest(10,'checked_in','approved',2)
  await db.query(`insert into checkins(event_id,guest_id,checked_in_at,result) values
    ($1,$2,now()-interval '1 hour','approved'),($1,$2,now(),'approved')`, [event,id(10)])
  const migration = new URL('../supabase/migrations/20260905162449_guard_guest_checkin_integrity.sql', import.meta.url)
  await db.exec(await readFile(migration,'utf8'))
  equal(await scalar('select sum(admitted_people)::int as value from checkins'),3,'backfill counts historical group once')
  equal(await scalar('select count(*)::int as value from checkins where admitted_people=0'),1,'historical reentry snapshot is zero')

  for (const role of ['anon','authenticated']) {
    for (const table of ['guests','checkins','invitation_tokens','guest_qr_codes']) {
      equal(await scalar(`select has_table_privilege('${role}','public.${table}','SELECT') as value`),true,`${role} can still read ${table}`)
      for (const permission of ['INSERT','UPDATE','DELETE','TRUNCATE'])
        equal(await scalar(`select has_table_privilege('${role}','public.${table}','${permission}') as value`),false,`${role} cannot ${permission} ${table}`)
    }
    for (const fn of ['register_guest_checkin_guarded(uuid,uuid,uuid,text,text,text)','register_guest_checkin(uuid,uuid,uuid,text,text,boolean)','revert_guest_checkin(uuid,text)']) {
      equal(await scalar(`select has_function_privilege('${role}','public.${fn}','EXECUTE') as value`),false,`${role} cannot call ${fn}`)
      equal(await scalar(`select has_function_privilege('service_role','public.${fn}','EXECUTE') as value`),true,`service_role can call ${fn}`)
    }
  }

  for (const payment of [null,'pending','unknown','rejected']) {
    await reset(); await guest(10,'enabled',payment)
    await rejects(()=>checkin(10),'payment_required',`payment ${payment} denied`)
    await rejects(()=>checkin(10,{override:'outside_window',reason:'supervisor'}),'payment_required','PIN cannot bypass payment')
    equal(await scalar('select count(*)::int as value from checkins'),0,'denied payment creates no checkin')
    equal(await scalar('select consumed_at as value from event_activations'),null,'denied payment does not consume activation')
  }
  for (const [status,code] of [[null,'not_ready'],['unknown','not_ready'],['registered','not_ready'],['preinvited','not_ready'],['cancelled','cancelled'],['rejected','cancelled'],['duplicate','duplicate']]) {
    await reset(); await guest(10,status)
    await rejects(()=>checkin(10),code,`status ${status} denied`)
  }
  for (const payment of ['not_required','approved']) {
    await reset(); await guest(10,'confirmed',payment)
    equal((await checkin(10)).admitted_people,1,`confirmed ${payment} allowed`)
    equal(await scalar('select consumed_at is not null as value from event_activations'),true,'successful checkin consumes activation')
  }

  await reset(10); await guest(10,'enabled','not_required',8); await guest(11,'enabled','approved',1)
  equal((await checkin(10)).admitted_people,9,'nine people counted')
  await rejects(()=>checkin(11),'event_full','9 + group of 2 exceeds 10')
  await rejects(()=>checkin(11,{override:'outside_window',reason:'PIN approved'}),'event_full','PIN cannot bypass capacity')
  equal(await scalar('select sum(admitted_people)::int as value from checkins where result=\'approved\''),9,'denial preserves occupancy')

  await reset(10); await guest(10,'enabled','not_required',7); await guest(11,'enabled','approved',1)
  await checkin(10); equal((await checkin(11)).admitted_people,2,'8 + group of 2 fits 10')
  await rejects(()=>checkin(11),'already_checked_in')
  equal((await checkin(11,{override:'already_checked_in',reason:'Salida temporal verificada'})).admitted_people,0,'reentry adds zero')
  equal(await scalar('select sum(admitted_people)::int as value from checkins where result=\'approved\''),10,'reentry preserves count')
  await db.query('update guests set plus_ones_confirmed=6 where id=$1',[id(11)])
  equal(await scalar('select sum(admitted_people)::int as value from checkins where result=\'approved\''),10,'editing group cannot change snapshot')
  const consumedAt = await scalar('select consumed_at::text as value from event_activations')
  const reverted = await scalar('select revert_guest_checkin($1) as value',[id(11)])
  equal(reverted.reverted_checkins,2,'revert corrects original and reentry')
  equal(await scalar('select sum(admitted_people)::int as value from checkins where result=\'approved\''),8,'revert releases only original people')
  equal(await scalar('select consumed_at::text as value from event_activations'),consumedAt,'revert does not unconsume activation')
  await db.query('update guests set plus_ones_confirmed=1 where id=$1',[id(11)])
  equal((await checkin(11)).admitted_people,2,'corrected guest can enter again with fresh snapshot')

  await reset(); await guest(10,'enabled','approved',0)
  await db.query("update guests set companion_names=array['A','B'] where id=$1",[id(10)])
  equal((await checkin(10)).admitted_people,1,'canonical zero overrides stale companion names')
  await guest(11,'enabled','approved',null)
  await db.query("update guests set companion_names=array['A','B'] where id=$1",[id(11)])
  equal((await checkin(11)).admitted_people,3,'legacy NULL falls back to companion names')

  async function token({expires="now()+interval '1 day'",active=true,used=0,last='NULL',max=1}={}) {
    await db.query(`insert into invitation_tokens(id,guest_id,token,expires_at,is_active,used_count,last_used_at,max_uses)
      values($1,$2,'synthetic-test-token',${expires},$3,$4,${last},$5)`,[id(20),id(10),active,used,max])
    await db.query("insert into guest_qr_codes(id,guest_id,qr_value,is_active) values($1,$2,'synthetic-test-token',true)",[id(30),id(10)])
  }
  for (const [config,code] of [
    [{expires:'NULL'},'expired'],[{expires:'now()'},'expired'],[{expires:"now()-interval '1 second'"},'expired'],
    [{active:false},'invalid_token'],[{active:null},'invalid_token'],[{used:1},'invalid_token'],[{last:'now()'},'invalid_token']
  ]) {
    await reset(); await guest(10); await token(config)
    await rejects(()=>checkin(10,{token:20,method:'qr'}),code)
    equal(await scalar('select count(*)::int as value from checkins'),0,'invalid token creates no admission')
    equal(await scalar('select is_active as value from guest_qr_codes'),true,'denied token does not mutate legacy QR')
  }
  await reset(); await guest(10); await token()
  equal((await checkin(10,{token:20,method:'qr'})).admitted_people,1,'valid QR admitted')
  equal(await scalar('select is_active as value from invitation_tokens'),false,'QR consumed')
  equal(await scalar('select is_active as value from guest_qr_codes'),false,'legacy QR revoked')
  await rejects(()=>checkin(10,{token:20,method:'qr',override:'already_checked_in',reason:'PIN'}),'invalid_token','PIN does not reactivate consumed QR')
  await scalar('select revert_guest_checkin($1) as value',[id(10)])
  equal(await scalar('select is_active as value from invitation_tokens'),true,'reversion restores token')
  equal(await scalar('select is_active as value from guest_qr_codes'),true,'reversion restores matching legacy QR')

  await reset(); await guest(10)
  await db.query('update guests set guest_type_id=$1 where id=$2',[type,id(10)])
  await db.query("update events set event_date=(now() at time zone 'America/Argentina/Buenos_Aires')::date+1 where id=$1",[event])
  await db.exec("update guest_types set access_start_time='00:00',access_start_day_offset=0")
  await rejects(()=>checkin(10),'outside_window','future Argentina local window blocks')
  equal((await checkin(10,{override:'outside_window',reason:'Responsable autorizo ingreso anticipado'})).admitted_people,1,'verified exception permits early arrival')
  await rejects(()=>checkin(10,{override:'already_checked_in',reason:' '}),'invalid_parameters','blank exception reason denied')
  equal((await checkin(10,{override:'already_checked_in',reason:'Reingreso verificado'})).admitted_people,0,'manual reentry keeps existing admission despite clock window')

  await reset(); await guest(10,'enabled','pending')
  await rejects(()=>scalar('select register_guest_checkin($1,$2,null,\'manual\',\'legacy\',true) as value',[event,id(10)]),'payment_required','legacy wrapper cannot bypass payment')
  await rejects(()=>checkin(10,{method:'qr'}),'invalid_parameters','QR method requires token')
  await rejects(()=>checkin(10,{override:'event_full',reason:'PIN'}),'invalid_parameters','capacity exception code invalid')
  await rejects(()=>scalar('select register_guest_checkin_guarded($1,$2) as value',[otherEvent,id(10)]),'guest_event_mismatch')
  await rejects(()=>checkin(999),'guest_not_found')

  await reset(); await guest(10)
  await db.exec('set role service_role')
  equal((await checkin(10)).admitted_people,1,'service role actually executes the definer function')
  await db.exec('reset role')
  equal(await scalar('select sum(admitted_people)::int as value from checkins'),1,'service role admission persisted')

  await reset(1); await guest(10); await guest(11)
  // PGlite uses one PostgreSQL backend: this proves last-slot behavior for two
  // queued calls, NOT independent-session row-lock contention in Supabase.
  const lastSpot = await Promise.allSettled([checkin(10),checkin(11)])
  equal(lastSpot.filter(x=>x.status==='fulfilled').length,1,'only one queued call gets last place')
  equal(lastSpot.filter(x=>x.status==='rejected').length,1,'other queued call denied')
  equal(await scalar('select sum(admitted_people)::int as value from checkins'),1,'last place not oversold in sequential backend')

  console.log(`PASS: ${assertions} SQL assertions on synthetic PGlite database.`)
  console.log('LIMIT: single backend; independent-session lock contention and production schema/RLS integration require a staging PostgreSQL rehearsal.')
} finally { await db.close() }
