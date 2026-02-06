# AI Chat - Quick Setup Commands

# 1. Set your OpenAI API Key
supabase secrets set OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE

# 2. Verify the secret was set
supabase secrets list

# 3. Deploy the AI chat function (already done, but if you need to redeploy)
supabase functions deploy ai-chat --no-verify-jwt

# 4. Test the endpoint
# Visit: https://vuffzfuklzzcnfnubtzx.supabase.co/functions/v1/ai-chat

# 5. View logs (if troubleshooting)
supabase functions logs ai-chat --follow
