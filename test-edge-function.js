// Test script to verify Edge Function is working
// Run this in your browser console or as a Node.js script

const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your actual URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your actual anon key

async function testEdgeFunction() {
  try {
    console.log('Testing Edge Function...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123',
        full_name: 'Test User',
        employee_id: 'TEST-001',
        role: 'technician',
        team_leader_id: '00000000-0000-0000-0000-000000000000', // Replace with actual team leader ID
        created_by: '00000000-0000-0000-0000-000000000000', // Replace with actual admin user ID
      }),
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', result);
    
    if (response.ok) {
      console.log('✅ Edge Function is working!');
    } else {
      console.log('❌ Edge Function failed:', result);
    }
  } catch (error) {
    console.error('❌ Error testing Edge Function:', error);
  }
}

// Run the test
testEdgeFunction();
