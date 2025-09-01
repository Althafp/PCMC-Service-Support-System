#!/bin/bash

echo "🚀 Deploying Supabase Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if user is logged in
if ! supabase status &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please login first:"
    echo "supabase login"
    exit 1
fi

# Deploy the create-user function
echo "📦 Deploying create-user function..."
supabase functions deploy create-user

if [ $? -eq 0 ]; then
    echo "✅ create-user function deployed successfully!"
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Now you can:"
    echo "1. Go to your admin panel"
    echo "2. Click 'Add User'"
    echo "3. Fill the form and click 'Create User'"
    echo "4. The user will be created automatically!"
    echo ""
    echo "📝 The function will:"
    echo "   • Create Supabase Auth user"
    echo "   • Create user profile"
    echo "   • Send welcome notification"
    echo "   • Log the action in audit logs"
else
    echo "❌ Failed to deploy function. Please check the errors above."
    exit 1
fi
