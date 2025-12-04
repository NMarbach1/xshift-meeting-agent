# Quick Start Guide

## What You Just Got

A web app that lets you send personalized meeting invites with Google Meet links from 3 different email accounts!

## Setup (Do This Once)

### 1. Get Your Claude API Key (5 minutes)

1. Go to: https://console.anthropic.com/
2. Sign up or log in
3. Go to "API Keys"
4. Click "Create Key"
5. Copy the key
6. Create a `.env` file in this folder:
   ```
   ANTHROPIC_API_KEY=your_key_here
   ```

### 2. Set Up Google Cloud (15 minutes per email account)

You need to do this for each of your 3 email addresses:
- contact@chatbotlabs.ai
- contact@voiceagentlabsai.com
- contact@xshift.ai

**For EACH email account:**

#### A. Create Google Cloud Project
1. Go to: https://console.cloud.google.com/
2. Click "New Project"
3. Name it (e.g., "ChatBot Labs Meetings")
4. Click "Create"

#### B. Enable Google Calendar API
1. Go to "APIs & Services" → "Library"
2. Search "Google Calendar API"
3. Click "Enable"

#### C. Set Up OAuth
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" → "Create"
3. Fill in:
   - App name: "Meeting Invite Agent"
   - Your email for support
4. Click "Save and Continue"
5. Click "Add or Remove Scopes"
6. Search for and add:
   - Google Calendar API (all scopes)
7. Click "Save and Continue"
8. Add the Gmail address as a test user
9. Click "Save and Continue"

#### D. Get Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "+ Create Credentials" → "OAuth client ID"
3. Choose "Desktop app"
4. Name it: "Meeting Agent - ChatBotLabs" (or whichever account)
5. Click "Create"
6. Click "Download JSON"
7. Save the file in this folder as:
   - `credentials-chatbotlabs.json` OR
   - `credentials-voiceagentlabs.json` OR
   - `credentials-xshift.json`

#### E. Authorize the Account
```bash
node setup-oauth.js chatbotlabs
```

This will give you a URL. Open it, sign in with that Gmail account, approve, and paste the code back.

**Repeat steps A-E for all 3 email accounts!**

## How to Use It

### Start the Server
```bash
npm start
```

### Open Your Browser
Go to: http://localhost:3000

### Fill Out the Form
1. First Name: John
2. Last Name: Smith
3. Recipient Email: john.smith@example.com
4. Send From: Choose one of your 3 accounts
5. Meeting Details: "Interested in AI chatbot for customer service"
6. Click "Send Meeting Invite"

**Done!** The person will get:
- A personalized email (written by AI)
- A Google Calendar invite
- A Google Meet link

## Files You Need

Make sure you have these files before starting the server:

✅ `.env` (with your Claude API key)
✅ `credentials-chatbotlabs.json`
✅ `credentials-voiceagentlabs.json`
✅ `credentials-xshift.json`
✅ `token-chatbotlabs.json` (created by setup-oauth.js)
✅ `token-voiceagentlabs.json` (created by setup-oauth.js)
✅ `token-xshift.json` (created by setup-oauth.js)

## Troubleshooting

**"Cannot find module 'dotenv'"**
→ Run: `npm install`

**"Token not found"**
→ Run: `node setup-oauth.js <account-name>`

**"Credentials not found"**
→ Download the JSON from Google Cloud Console
→ Name it correctly (credentials-chatbotlabs.json, etc.)

**Need to re-authorize?**
→ Delete the token-*.json file and run setup-oauth.js again

## Support

Check the full README.md for detailed instructions!
