drop extension if exists "pg_net";

drop policy "Admins can manage users" on "public"."users";

drop policy "Admins can read all users" on "public"."users";

drop policy "Managers can read team users" on "public"."users";

drop policy "Users can read own profile" on "public"."users";

alter table "public"."users" drop constraint "users_manager_id_fkey";

alter table "public"."users" drop constraint "users_team_leader_id_fkey";


  create table "public"."image_uploads" (
    "id" uuid not null default gen_random_uuid(),
    "file_path" text not null,
    "bucket_name" text not null default 'images'::text,
    "file_name" text not null,
    "file_size" bigint,
    "mime_type" text,
    "uploaded_by" uuid,
    "uploaded_at" timestamp with time zone default now()
      );


alter table "public"."service_reports" add column "approval_notes" text;

alter table "public"."service_reports" add column "approved_at" timestamp with time zone;

alter table "public"."service_reports" add column "approved_by" uuid;

alter table "public"."service_reports" add column "equipment_remarks" jsonb;

alter table "public"."service_reports" add column "jb_temperature" numeric(5,2);

alter table "public"."users" disable row level security;

CREATE INDEX idx_image_uploads_bucket_name ON public.image_uploads USING btree (bucket_name);

CREATE INDEX idx_image_uploads_uploaded_at ON public.image_uploads USING btree (uploaded_at);

CREATE INDEX idx_image_uploads_uploaded_by ON public.image_uploads USING btree (uploaded_by);

CREATE UNIQUE INDEX image_uploads_pkey ON public.image_uploads USING btree (id);

alter table "public"."image_uploads" add constraint "image_uploads_pkey" PRIMARY KEY using index "image_uploads_pkey";

alter table "public"."image_uploads" add constraint "image_uploads_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) not valid;

alter table "public"."image_uploads" validate constraint "image_uploads_uploaded_by_fkey";

alter table "public"."service_reports" add constraint "service_reports_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES users(id) not valid;

alter table "public"."service_reports" validate constraint "service_reports_approved_by_fkey";

alter table "public"."users" add constraint "users_manager_id_fkey" FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."users" validate constraint "users_manager_id_fkey";

alter table "public"."users" add constraint "users_team_leader_id_fkey" FOREIGN KEY (team_leader_id) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."users" validate constraint "users_team_leader_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_all_users_admin(admin_id uuid)
 RETURNS TABLE(id uuid, email text, full_name text, employee_id text, username text, mobile text, designation text, department text, zone text, role text, date_of_birth text, is_active boolean, team_leader_id uuid, manager_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  admin_role TEXT;
BEGIN
  -- Check if the user is actually an admin
  SELECT u.role::TEXT INTO admin_role FROM users u WHERE u.id = admin_id;
  
  IF admin_role = 'admin' THEN
    RETURN QUERY 
    SELECT 
      u.id,
      u.email,
      u.full_name,
      u.employee_id,
      u.username,
      u.mobile,
      u.designation,
      u.department,
      u.zone,
      u.role::TEXT,
      COALESCE(u.date_of_birth::TEXT, ''),
      u.is_active,
      u.team_leader_id,
      u.manager_id,
      u.created_at,
      u.updated_at
    FROM users u 
    ORDER BY u.full_name;
  ELSE
    -- Return empty result if not admin
    RETURN;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_manager_team(manager_id uuid)
 RETURNS TABLE(id uuid, email text, full_name text, employee_id text, username text, mobile text, designation text, department text, zone text, role text, date_of_birth text, is_active boolean, team_leader_id uuid, manager_id_ref uuid, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Return team leaders under this manager + technicians under those team leaders
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.employee_id,
    u.username,
    u.mobile,
    u.designation,
    u.department,
    u.zone,
    u.role::TEXT,
    COALESCE(u.date_of_birth::TEXT, ''),
    u.is_active,
    u.team_leader_id,
    u.manager_id as manager_id_ref,
    u.created_at,
    u.updated_at
  FROM users u 
  WHERE u.manager_id = get_manager_team.manager_id 
     OR u.team_leader_id IN (
       SELECT tl.id FROM users tl 
       WHERE tl.manager_id = get_manager_team.manager_id 
       AND tl.role = 'team_leader'
     )
  ORDER BY u.role, u.full_name;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_own_profile(user_id uuid)
 RETURNS TABLE(id uuid, email text, full_name text, employee_id text, username text, mobile text, designation text, department text, zone text, role text, date_of_birth text, is_active boolean, team_leader_id uuid, manager_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.employee_id,
    u.username,
    u.mobile,
    u.designation,
    u.department,
    u.zone,
    u.role::TEXT,  -- Convert enum to text
    COALESCE(u.date_of_birth::TEXT, ''),  -- Convert date to text, handle nulls
    u.is_active,
    u.team_leader_id,
    u.manager_id,
    u.created_at,
    u.updated_at
  FROM users u 
  WHERE u.id = user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_storage_url(bucket_name text, file_path text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Return the standard Supabase storage URL format
  RETURN 'https://' || current_setting('app.settings.supabase_url') || '/storage/v1/object/public/' || bucket_name || '/' || file_path;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_team_leader_team(team_leader_id uuid)
 RETURNS TABLE(id uuid, email text, full_name text, employee_id text, username text, mobile text, designation text, department text, zone text, role text, date_of_birth text, is_active boolean, team_leader_id_ref uuid, manager_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Return technicians and technical executives under this team leader
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.employee_id,
    u.username,
    u.mobile,
    u.designation,
    u.department,
    u.zone,
    u.role::TEXT,
    COALESCE(u.date_of_birth::TEXT, ''),
    u.is_active,
    u.team_leader_id as team_leader_id_ref,
    u.manager_id,
    u.created_at,
    u.updated_at
  FROM users u 
  WHERE u.team_leader_id = get_team_leader_team.team_leader_id
  AND (u.role = 'technician' OR u.role = 'technical_executive')
  ORDER BY u.role, u.full_name;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT role FROM users WHERE id = user_id;
$function$
;

create or replace view "public"."image_uploads_view" as  SELECT iu.id,
    iu.file_path,
    iu.file_name,
    iu.file_size,
    iu.mime_type,
    iu.uploaded_by,
    iu.uploaded_at,
    get_storage_url(iu.bucket_name, iu.file_path) AS public_url,
    u.email AS uploaded_by_email,
    u.full_name AS uploaded_by_name
   FROM (image_uploads iu
     LEFT JOIN users u ON ((iu.uploaded_by = u.id)))
  ORDER BY iu.uploaded_at DESC;


CREATE OR REPLACE FUNCTION public.log_image_upload(p_file_path text, p_file_name text, p_file_size bigint, p_mime_type text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_upload_id UUID;
BEGIN
  INSERT INTO image_uploads (file_path, file_name, file_size, mime_type, uploaded_by)
  VALUES (p_file_path, p_file_name, p_file_size, p_mime_type, auth.uid())
  RETURNING id INTO v_upload_id;
  
  RETURN v_upload_id;
END;
$function$
;

grant delete on table "public"."image_uploads" to "anon";

grant insert on table "public"."image_uploads" to "anon";

grant references on table "public"."image_uploads" to "anon";

grant select on table "public"."image_uploads" to "anon";

grant trigger on table "public"."image_uploads" to "anon";

grant truncate on table "public"."image_uploads" to "anon";

grant update on table "public"."image_uploads" to "anon";

grant delete on table "public"."image_uploads" to "authenticated";

grant insert on table "public"."image_uploads" to "authenticated";

grant references on table "public"."image_uploads" to "authenticated";

grant select on table "public"."image_uploads" to "authenticated";

grant trigger on table "public"."image_uploads" to "authenticated";

grant truncate on table "public"."image_uploads" to "authenticated";

grant update on table "public"."image_uploads" to "authenticated";

grant delete on table "public"."image_uploads" to "service_role";

grant insert on table "public"."image_uploads" to "service_role";

grant references on table "public"."image_uploads" to "service_role";

grant select on table "public"."image_uploads" to "service_role";

grant trigger on table "public"."image_uploads" to "service_role";

grant truncate on table "public"."image_uploads" to "service_role";

grant update on table "public"."image_uploads" to "service_role";


