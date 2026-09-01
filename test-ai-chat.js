// Quick test script for AI chat function
// Run with: node test-ai-chat.js

const SUPABASE_URL = "https://aioyoxnjukfibsogegdb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpb3lveG5qdWtmaWJzb2dlZ2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA0ODAsImV4cCI6MjEwMzgyNjQ4MH0.4XrFwZgyTQ00HSyUVlxpluKL9XFBs15hmMzOrIEtepc";

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
