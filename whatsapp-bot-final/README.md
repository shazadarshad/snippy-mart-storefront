# Snippy Mart WhatsApp Auto-Reply Bot v4.0.0

Simple business hours enforcement bot - sends one auto-reply per offline window.

## Features

### 🕓 Business Hours Auto-Reply ONLY
- **Active Hours**: 4:00 PM – 6:00 PM and 8:00 PM – 10:00 PM
- **Auto-Reply**: One professional offline message per window
- **Anti-Spam**: No repeated messages if user spams
- **Auto-Reset**: Clears when business hours start
- **Manual Handling**: During business hours, all messages pass through (no bot interference)

### 👨‍💼 Admin Commands
- `/stats` - View business hours status and auto-reply count
- `/info {phone}` - Check if user was auto-replied
- `/block {phone}` - Block user from receiving auto-replies
- `/unblock {phone}` - Unblock user
- `/clear` - Manually clear all auto-reply tracking
- `/help` - Show all commands

## What This Bot Does

### Outside Business Hours (OFFLINE)
1. User sends message → Bot sends auto-reply **once**
2. User sends more messages → Bot stays **silent**
3. Business hours start → Auto-reply tracking resets

### During Business Hours (ONLINE)
- Bot does **nothing** - you handle all messages manually
- No AI, no menu, no automation

## Environment Variables

```env
WASENDER_SESSION_KEY=your_wasender_api_key
ADMIN_NUMBERS=94787767869,94XXXXXXXXX
PORT=8080
```

**Note**: No OpenAI key needed - this bot has no AI features.

## Installation

```bash
npm install
```

## Running

```bash
npm start
```

## Auto-Reply Message

```
Hi 👋

Thanks for reaching out.

We're currently offline and operate strictly during fixed support hours to ensure quality service.

🕓 Support Hours:
• 4:00 PM – 6:00 PM
• 8:00 PM – 10:00 PM

Messages sent outside these hours will be reviewed during the next available slot.
Repeated messages won't speed up responses.

🛒 To place new orders, please visit:
https://snippymart.com

🤖 For service details, FAQs, and instant answers, please use the AI Chat on our website — it's available 24/7 and explains everything clearly.

Thank you for your patience.
```

## API Endpoints

- `GET /` - Health check and status
- `POST /webhook` - WhatsApp webhook handler

## Deployment

Works on Railway, Heroku, or any Node.js hosting.

## License

ISC
