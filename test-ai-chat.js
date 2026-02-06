// Quick test script for AI chat function
// Run with: node test-ai-chat.js

const SUPABASE_URL = "https://vuffzfuklzzcnfnubtzx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZmZ6ZnVrbHp6Y25mbnVidHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTQ1NjAsImV4cCI6MjA4NDI3MDU2MH0.qHjJYOrNi1cBYPYapmHMJgDxsI50sHAKUAvv0VnPQFM";

async function testAIChat() {
    console.log("🧪 Testing AI Chat Function...\n");

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                message: "What products do you have?",
                history: []
            })
        });

        console.log("Status:", response.status);
        console.log("Status Text:", response.statusText);

        const data = await response.json();
        console.log("\n✅ Response:");
        console.log(JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

testAIChat();
