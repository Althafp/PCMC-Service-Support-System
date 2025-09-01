# Setup Edge Function for Automated User Creation

## Prerequisites

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

## Deploy the Edge Function

1. Deploy the create-user function:
   ```bash
   supabase functions deploy create-user
   ```

2. Set environment variables (if needed):
   ```bash
   supabase secrets set SUPABASE_URL=https://your-project-ref.supabase.co
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## Test the Function

You can test the function directly:

```bash
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/create-user' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "full_name": "Test User",
    "employee_id": "EMP-TEST-001",
    "role": "technician",
    "created_by": "admin-user-id"
  }'
```

## How It Works

1. **User Creation**: Admin fills form and clicks "Create User"
2. **Edge Function**: Automatically creates both Auth user and profile
3. **Atomic Operation**: If any step fails, everything is rolled back
4. **Success**: User can immediately log in with email/password

## Benefits

- ✅ **Automatic**: No manual Supabase dashboard steps
- ✅ **Secure**: Uses service role key on server-side
- ✅ **Atomic**: All-or-nothing operation
- ✅ **Consistent**: UUIDs automatically match
- ✅ **User-friendly**: Simple one-click user creation

## Troubleshooting

If the function fails to deploy:

1. Check your Supabase project is linked
2. Verify you have the correct permissions
3. Ensure the function code is valid TypeScript

If user creation fails:
1. Check the function logs in Supabase Dashboard
2. Verify environment variables are set correctly
3. Ensure the user doesn't already exist
