import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Debug logging
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing!');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'manager' | 'team_leader' | 'technical_executive' | 'technician';
export type ReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface User {
  id: string;
  email: string;
  full_name: string;
  employee_id: string;
  date_of_birth?: string;
  mobile?: string;
  designation?: string;
  role: UserRole;
  department?: string;
  username: string;
  zone?: string;
  team?: string;
  team_leader_id?: string;
  manager_id?: string;
  is_active: boolean;
  profile_picture?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceReport {
  id: string;
  complaint_no: string;
  complaint_type: string;
  project_phase: string;
  system_type: string;
  date: string;
  jb_sl_no?: string;
  zone: string;
  location: string;
  ward_no?: string;
  ps_limits?: string;
  pole_id?: string;
  rfp_no?: string;
  latitude?: number;
  longitude?: number;
  before_image_url?: string;
  after_image_url?: string;
  raw_power_supply_images?: string[];
  ups_input_image_url?: string;
  ups_output_image_url?: string;
  thermistor_image_url?: string;
  thermistor_temperature?: number;
  checklist_data?: any;
  nature_of_complaint?: string;
  field_team_remarks?: string;
  customer_feedback?: string;
  rejection_remarks?: string;
  tl_name?: string;
  tl_signature?: string;
  tl_mobile?: string;
  tech_engineer?: string;
  tech_signature?: string;
  tech_mobile?: string;
  technician_id?: string;
  title?: string;
  approval_status?: string;
  team_leader_id?: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

export interface LocationDetail {
  id: string;
  project_phase: string;
  location_type?: string;
  rfp_no: string;
  zone: string;
  location: string;
  ward_no?: string;
  ps_limits?: string;
  no_of_pole: number;
  pole_id?: string;
  jb_sl_no?: string;
  no_of_cameras: number;
  fix_box: number;
  ptz: number;
  latitude?: number;
  longitude?: number;
  created_at: string;
}