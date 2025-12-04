# Meeting Invite Agent

Automated meeting invite system that sends personalized emails with Google Meet links from multiple email domains.

## Features

- Web interface for easy use
- AI-generated personalized emails using Claude
- Automatic Google Calendar event creation
- Google Meet links included automatically
- Supports 3 email accounts:
  - contact@chatbotlabs.ai
  - contact@voiceagentlabsai.com
  - contact@xshift.ai

## Setup Instructions

### Step 1: Install Dependencies

```bash
cd meeting-invite-agent
npm install
```

### Step 2: Get Claude API Key

1. Go to https://console.anthropic.com/
2. Create an API key
3. Copy the `.env.example` file to `.env`:
   ```bash
   copy .env.example .env
   ```
4. Add your API key to `.env`:
   ```
   ANTHROPIC_API_KEY=your_actual_api_key_here
   ```

### Step 3: Set Up Google Cloud Console (For Each Email Domain)

You need to do this **3 times** - once for each email account.

#### 3.1 Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Name it (e.g., "ChatBot Labs Meetings")
4. Click "Create"

#### 3.2 Enable APIs

1. In your project, go to "APIs & Services" → "Library"
2. Search for and enable:
   - **Google Calendar API**
   - Click "Enable" for each

#### 3.3 Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" → Click "Create"
3. Fill in:
   - App name: "Meeting Invite Agent"
   - User support email: (your email)
   - Developer contact: (your email)
4. Click "Save and Continue"
5. Click "Add or Remove Scopes"
6. Add these scopes:
   - `.../auth/calendar`
   - `.../auth/calendar.events`
7. Click "Save and Continue"
8. Add test users (add the Gmail account email)
9. Click "Save and Continue"

#### 3.4 Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Desktop app"
4. Name: "Meeting Agent - [Account Name]"
5. Click "Create"
6. Click "Download JSON"
7. Save the file as:
   - `credentials-chatbotlabs.json` (for chatbotlabs account)
   - `credentials-voiceagentlabs.json` (for voiceagentlabs account)
   - `credentials-xshift.json` (for xshift account)

**Important:** Place these files in the `meeting-invite-agent` folder.

### Step 4: Authorize Each Email Account

Run this command for each account (you must be logged into the corresponding Gmail):

```bash
node setup-oauth.js chatbotlabs
```

This will:
1. Open a URL in your browser
2. Ask you to sign in with the Google account
3. Grant permissions
4. Give you a code to paste back

Repeat for the other accounts:

```bash
node setup-oauth.js voiceagentlabs
node setup-oauth.js xshift
```

## Usage

### Start the Server

```bash
node server.js
```

### Open the Web Interface

Open your browser and go to: **http://localhost:3000**

### Send a Meeting Invite

1. Enter the recipient's first and last name
2. Enter their email address
3. Select which email account to send from
4. Add details about the meeting context
5. Click "Send Meeting Invite"

The system will:
- Generate a personalized email using AI
- Create a Google Calendar event
- Generate a Google Meet link
- Send the invite to the recipient
- Show you a preview of what was sent

## File Structure

```
meeting-invite-agent/
├── server.js                    # Main server
├── setup-oauth.js              # OAuth setup script
├── package.json                # Dependencies
├── .env                        # API keys (create from .env.example)
├── .env.example               # Template for environment variables
├── credentials-chatbotlabs.json      # Google OAuth credentials
├── credentials-voiceagentlabs.json   # (download from Google Cloud Console)
├── credentials-xshift.json           #
├── token-chatbotlabs.json           # Generated after OAuth setup
├── token-voiceagentlabs.json        #
├── token-xshift.json                #
└── public/
    └── index.html              # Web interface
```

## Troubleshooting

### "Token not found" error
- Run `node setup-oauth.js <account-type>` to authorize the account

### "Credentials not found" error
- Make sure you downloaded the OAuth credentials from Google Cloud Console
- Name them correctly: `credentials-chatbotlabs.json`, etc.

### Calendar event not creating
- Make sure you enabled the Google Calendar API
- Check that the OAuth scopes include calendar permissions

### Email not personalized
- Check that your `ANTHROPIC_API_KEY` is set correctly in `.env`

## Need Help?

Check that:
1. All 3 `credentials-*.json` files exist
2. All 3 `token-*.json` files were generated (after running setup-oauth.js)
3. `.env` file has your Claude API key
4. You're logged into the correct Google account when authorizing
