create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'doctor', 'receptionist');
create type public.gender_type as enum ('female', 'male', 'other');
create type public.appointment_status as enum ('scheduled', 'completed', 'cancelled');
create type public.invoice_status as enum ('unpaid', 'partially_paid', 'paid');
create type public.payment_method as enum ('cash', 'card', 'upi');

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  logo_url text,
  tax_rate numeric(6, 2) not null default 0,
  default_fee numeric(12, 2) not null default 500,
  timezone text not null default 'Asia/Kolkata',
  email_notifications boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null,
  phone text,
  avatar_url text,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  specialty text,
  active boolean not null default true,
  availability jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_code text not null,
  full_name text not null,
  dob date not null,
  gender public.gender_type not null,
  blood_group text,
  phone text not null,
  email text,
  address text,
  allergies text,
  emergency_contact text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, patient_code)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.profiles(id) on delete restrict,
  scheduled_at timestamptz not null,
  duration_mins integer not null default 30 check (duration_mins between 10 and 240),
  reason text not null,
  status public.appointment_status not null default 'scheduled',
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.profiles(id) on delete restrict,
  diagnosis text not null,
  notes text,
  follow_up_date date,
  created_at timestamptz not null default now()
);

create table public.prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  medicine_name text not null,
  dosage text not null,
  frequency text not null,
  duration_days integer not null check (duration_days > 0),
  instructions text
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  invoice_number text not null,
  subtotal numeric(12, 2) not null default 0,
  tax_amount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  paid_amount numeric(12, 2) not null default 0,
  status public.invoice_status not null default 'unpaid',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (clinic_id, invoice_number)
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10, 2) not null default 1,
  unit_price numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  method public.payment_method not null,
  paid_at timestamptz not null default now(),
  recorded_by uuid references public.profiles(id) on delete set null
);

create table public.lab_reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  title text not null,
  file_url text not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.doctor_availability (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  unique (doctor_id, weekday)
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create index profiles_clinic_role_idx on public.profiles (clinic_id, role, active);
create index patients_clinic_name_idx on public.patients (clinic_id, lower(full_name));
create index patients_clinic_code_idx on public.patients (clinic_id, patient_code);
create index appointments_clinic_scheduled_idx on public.appointments (clinic_id, scheduled_at desc);
create index appointments_doctor_scheduled_idx on public.appointments (doctor_id, scheduled_at desc);
create index appointments_conflict_lookup_idx on public.appointments (clinic_id, doctor_id, status, scheduled_at);
create index prescriptions_patient_idx on public.prescriptions (patient_id, created_at desc);
create index invoices_clinic_created_idx on public.invoices (clinic_id, created_at desc);
create index invoices_patient_idx on public.invoices (patient_id, created_at desc);
create index lab_reports_patient_idx on public.lab_reports (patient_id, created_at desc);
create index activity_events_clinic_created_idx on public.activity_events (clinic_id, created_at desc);
create index appointments_patient_id_idx on public.appointments (patient_id);
create index appointments_created_by_idx on public.appointments (created_by);
create index prescriptions_appointment_id_idx on public.prescriptions (appointment_id);
create index prescriptions_doctor_id_idx on public.prescriptions (doctor_id);
create index prescription_items_prescription_id_idx on public.prescription_items (prescription_id);
create index invoices_created_by_idx on public.invoices (created_by);
create index invoice_items_invoice_id_idx on public.invoice_items (invoice_id);
create index payments_invoice_id_idx on public.payments (invoice_id);
create index payments_recorded_by_idx on public.payments (recorded_by);
create index lab_reports_uploaded_by_idx on public.lab_reports (uploaded_by);
create index doctor_availability_doctor_id_idx on public.doctor_availability (doctor_id);
create index activity_events_actor_id_idx on public.activity_events (actor_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger clinics_set_updated_at
before update on public.clinics
for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger patients_set_updated_at
before update on public.patients
for each row execute function public.set_updated_at();

create or replace function public.prevent_appointment_overlap()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'scheduled' and exists (
    select 1
    from public.appointments existing
    where existing.id <> new.id
      and existing.clinic_id = new.clinic_id
      and existing.doctor_id = new.doctor_id
      and existing.status = 'scheduled'
      and tstzrange(existing.scheduled_at, existing.scheduled_at + existing.duration_mins * interval '1 minute', '[)')
        && tstzrange(new.scheduled_at, new.scheduled_at + new.duration_mins * interval '1 minute', '[)')
  ) then
    raise exception 'Doctor already has an appointment in this time slot'
      using errcode = '23P01';
  end if;

  return new;
end;
$$;

create trigger appointments_prevent_overlap
before insert or update of doctor_id, scheduled_at, duration_mins, status
on public.appointments
for each row execute function public.prevent_appointment_overlap();

create schema if not exists private;

create or replace function private.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.profiles
  where user_id = auth.uid()
    and active = true
  limit 1
$$;

create or replace function private.current_clinic_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select clinic_id
  from public.profiles
  where user_id = auth.uid()
    and active = true
  limit 1
$$;

create or replace function private.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where user_id = auth.uid()
    and active = true
  limit 1
$$;

create or replace function public.set_invoice_payment_status()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  next_paid numeric(12, 2);
  next_total numeric(12, 2);
begin
  select coalesce(sum(amount), 0)
    into next_paid
    from public.payments
    where invoice_id = coalesce(new.invoice_id, old.invoice_id);

  select total
    into next_total
    from public.invoices
    where id = coalesce(new.invoice_id, old.invoice_id);

  update public.invoices
  set paid_amount = next_paid,
      status = case
        when next_paid <= 0 then 'unpaid'::public.invoice_status
        when next_paid >= next_total then 'paid'::public.invoice_status
        else 'partially_paid'::public.invoice_status
      end
  where id = coalesce(new.invoice_id, old.invoice_id);

  return coalesce(new, old);
end;
$$;

create trigger payments_update_invoice_status
after insert or update or delete on public.payments
for each row execute function public.set_invoice_payment_status();

alter table public.clinics enable row level security;
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.prescriptions enable row level security;
alter table public.prescription_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.lab_reports enable row level security;
alter table public.doctor_availability enable row level security;
alter table public.activity_events enable row level security;

create policy "Clinic members can read clinic"
on public.clinics for select to authenticated
using (id = private.current_clinic_id());

create policy "Admins can update clinic"
on public.clinics for update to authenticated
using (id = private.current_clinic_id() and private.current_role() = 'admin')
with check (id = private.current_clinic_id());

create policy "Authenticated users can create first clinic"
on public.clinics for insert to authenticated
with check (not exists (select 1 from public.profiles where profiles.user_id = (select auth.uid())));

create policy "Clinic members can read profiles"
on public.profiles for select to authenticated
using (clinic_id = private.current_clinic_id() or user_id = (select auth.uid()));

create policy "Admins can create profiles in clinic"
on public.profiles for insert to authenticated
with check (clinic_id = private.current_clinic_id() and private.current_role() = 'admin');

create policy "Admins and owners can update profiles"
on public.profiles for update to authenticated
using (
  (clinic_id = private.current_clinic_id() and private.current_role() = 'admin')
  or user_id = (select auth.uid())
)
with check (clinic_id = private.current_clinic_id());

create policy "Clinic members can read patients"
on public.patients for select to authenticated
using (clinic_id = private.current_clinic_id());

create policy "Clinic reception and admins can write patients"
on public.patients for insert to authenticated
with check (
  clinic_id = private.current_clinic_id()
  and private.current_role() in ('admin', 'receptionist')
);

create policy "Clinic reception and admins can update patients"
on public.patients for update to authenticated
using (
  clinic_id = private.current_clinic_id()
  and private.current_role() in ('admin', 'receptionist')
)
with check (clinic_id = private.current_clinic_id());

create policy "Clinic members can read appointments"
on public.appointments for select to authenticated
using (clinic_id = private.current_clinic_id());

create policy "Clinic members can create appointments"
on public.appointments for insert to authenticated
with check (
  clinic_id = private.current_clinic_id()
  and private.current_role() in ('admin', 'doctor', 'receptionist')
);

create policy "Clinic members can update appointments"
on public.appointments for update to authenticated
using (
  clinic_id = private.current_clinic_id()
  and private.current_role() in ('admin', 'doctor', 'receptionist')
)
with check (clinic_id = private.current_clinic_id());

create policy "Clinic members can read prescriptions"
on public.prescriptions for select to authenticated
using (
  exists (
    select 1 from public.patients
    where patients.id = prescriptions.patient_id
      and patients.clinic_id = private.current_clinic_id()
  )
);

create policy "Doctors and admins can create prescriptions"
on public.prescriptions for insert to authenticated
with check (
  private.current_role() in ('admin', 'doctor')
  and exists (
    select 1 from public.patients
    where patients.id = prescriptions.patient_id
      and patients.clinic_id = private.current_clinic_id()
  )
);

create policy "Prescription items inherit prescription read"
on public.prescription_items for select to authenticated
using (
  exists (
    select 1
    from public.prescriptions
    join public.patients on patients.id = prescriptions.patient_id
    where prescriptions.id = prescription_items.prescription_id
      and patients.clinic_id = private.current_clinic_id()
  )
);

create policy "Doctors and admins can create prescription items"
on public.prescription_items for insert to authenticated
with check (
  private.current_role() in ('admin', 'doctor')
  and exists (
    select 1
    from public.prescriptions
    join public.patients on patients.id = prescriptions.patient_id
    where prescriptions.id = prescription_items.prescription_id
      and patients.clinic_id = private.current_clinic_id()
  )
);

create policy "Billing users can read invoices"
on public.invoices for select to authenticated
using (
  clinic_id = private.current_clinic_id()
  and private.current_role() in ('admin', 'receptionist')
);

create policy "Billing users can create invoices"
on public.invoices for insert to authenticated
with check (
  clinic_id = private.current_clinic_id()
  and private.current_role() in ('admin', 'receptionist')
);

create policy "Billing users can update invoices"
on public.invoices for update to authenticated
using (
  clinic_id = private.current_clinic_id()
  and private.current_role() in ('admin', 'receptionist')
)
with check (clinic_id = private.current_clinic_id());

create policy "Billing users can read invoice items"
on public.invoice_items for select to authenticated
using (
  exists (
    select 1 from public.invoices
    where invoices.id = invoice_items.invoice_id
      and invoices.clinic_id = private.current_clinic_id()
      and private.current_role() in ('admin', 'receptionist')
  )
);

create policy "Billing users can create invoice items"
on public.invoice_items for insert to authenticated
with check (
  exists (
    select 1 from public.invoices
    where invoices.id = invoice_items.invoice_id
      and invoices.clinic_id = private.current_clinic_id()
      and private.current_role() in ('admin', 'receptionist')
  )
);

create policy "Billing users can read payments"
on public.payments for select to authenticated
using (
  exists (
    select 1 from public.invoices
    where invoices.id = payments.invoice_id
      and invoices.clinic_id = private.current_clinic_id()
      and private.current_role() in ('admin', 'receptionist')
  )
);

create policy "Billing users can create payments"
on public.payments for insert to authenticated
with check (
  exists (
    select 1 from public.invoices
    where invoices.id = payments.invoice_id
      and invoices.clinic_id = private.current_clinic_id()
      and private.current_role() in ('admin', 'receptionist')
  )
);

create policy "Clinic members can read lab reports"
on public.lab_reports for select to authenticated
using (
  exists (
    select 1 from public.patients
    where patients.id = lab_reports.patient_id
      and patients.clinic_id = private.current_clinic_id()
  )
);

create policy "Clinic members can create lab reports"
on public.lab_reports for insert to authenticated
with check (
  exists (
    select 1 from public.patients
    where patients.id = lab_reports.patient_id
      and patients.clinic_id = private.current_clinic_id()
  )
);

create policy "Clinic members can read doctor availability"
on public.doctor_availability for select to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = doctor_availability.doctor_id
      and profiles.clinic_id = private.current_clinic_id()
  )
);

create policy "Admins can create doctor availability"
on public.doctor_availability for insert to authenticated
with check (
  private.current_role() = 'admin'
  and exists (
    select 1 from public.profiles
    where profiles.id = doctor_availability.doctor_id
      and profiles.clinic_id = private.current_clinic_id()
  )
);

create policy "Admins can update doctor availability"
on public.doctor_availability for update to authenticated
using (
  private.current_role() = 'admin'
  and exists (
    select 1 from public.profiles
    where profiles.id = doctor_availability.doctor_id
      and profiles.clinic_id = private.current_clinic_id()
  )
)
with check (
  private.current_role() = 'admin'
  and exists (
    select 1 from public.profiles
    where profiles.id = doctor_availability.doctor_id
      and profiles.clinic_id = private.current_clinic_id()
  )
);

create policy "Admins can delete doctor availability"
on public.doctor_availability for delete to authenticated
using (
  private.current_role() = 'admin'
  and exists (
    select 1 from public.profiles
    where profiles.id = doctor_availability.doctor_id
      and profiles.clinic_id = private.current_clinic_id()
  )
);

create policy "Clinic members can read activity"
on public.activity_events for select to authenticated
using (clinic_id = private.current_clinic_id());

create policy "Clinic members can create activity"
on public.activity_events for insert to authenticated
with check (clinic_id = private.current_clinic_id());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('clinic-assets', 'clinic-assets', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('patient-files', 'patient-files', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
  ('lab-reports', 'lab-reports', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "Clinic bucket read"
on storage.objects for select to authenticated
using (
  bucket_id in ('clinic-assets', 'patient-files', 'lab-reports')
  and (storage.foldername(name))[1] = private.current_clinic_id()::text
);

create policy "Clinic bucket insert"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('clinic-assets', 'patient-files', 'lab-reports')
  and (storage.foldername(name))[1] = private.current_clinic_id()::text
);

create policy "Clinic bucket update"
on storage.objects for update to authenticated
using (
  bucket_id in ('clinic-assets', 'patient-files', 'lab-reports')
  and (storage.foldername(name))[1] = private.current_clinic_id()::text
)
with check (
  bucket_id in ('clinic-assets', 'patient-files', 'lab-reports')
  and (storage.foldername(name))[1] = private.current_clinic_id()::text
);

create policy "Clinic bucket delete"
on storage.objects for delete to authenticated
using (
  bucket_id in ('clinic-assets', 'patient-files', 'lab-reports')
  and (storage.foldername(name))[1] = private.current_clinic_id()::text
);

grant usage on schema public to anon, authenticated;
grant usage on schema private to authenticated;
grant execute on all functions in schema private to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public
grant select, insert, update, delete on tables to authenticated;
