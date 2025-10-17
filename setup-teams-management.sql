-- ========================================
-- TEAMS MANAGEMENT SETUP
-- ========================================

-- 1. Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  manager_id UUID NOT NULL,
  team_leader_id UUID NULL,
  zone TEXT NULL,
  is_active BOOLEAN NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT teams_unique_name UNIQUE (team_name, manager_id),
  CONSTRAINT teams_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES users (id),
  CONSTRAINT teams_team_leader_id_fkey FOREIGN KEY (team_leader_id) REFERENCES users (id)
) TABLESPACE pg_default;

-- 2. Create indexes for teams table
CREATE INDEX IF NOT EXISTS idx_teams_manager_id ON public.teams USING btree (manager_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_teams_team_leader_id ON public.teams USING btree (team_leader_id) TABLESPACE pg_default;

-- 3. Add team_id column to users table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Add team_name column to users table if not exists (for quick reference)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'team_name'
  ) THEN
    ALTER TABLE public.users ADD COLUMN team_name TEXT;
  END IF;
END $$;

-- 5. Create index for users.team_id
CREATE INDEX IF NOT EXISTS idx_users_team_id ON public.users USING btree (team_id) TABLESPACE pg_default;

-- 6. Enable RLS on teams table
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for teams

-- Managers can manage their own teams
CREATE POLICY "Managers can manage their own teams" ON public.teams
  FOR ALL USING (
    manager_id = auth.uid()
  );

-- Team leaders can view their teams
CREATE POLICY "Team leaders can view their teams" ON public.teams
  FOR SELECT USING (
    team_leader_id = auth.uid()
  );

-- Technicians can view their teams
CREATE POLICY "Technicians can view their assigned teams" ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.team_id = teams.id
    )
  );

-- Admins can view all teams
CREATE POLICY "Admins can view all teams" ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- Done!

