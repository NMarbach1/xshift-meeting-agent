const { google } = require('googleapis');
const fs = require('fs');
const http = require('http');
const url = require('url');
const { exec } = require('child_process');

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

const CREDENTIALS_PATH = 'credentials.json';
const TOKEN_PATH = 'token.json';

async function authorize() {
  let credentials;

  try {
    credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  } catch (err) {
    console.error(`Error loading credentials file: ${CREDENTIALS_PATH}`);
    console.error('Please download the OAuth2 credentials from Google Cloud Console');
    console.error('and save it as:', CREDENTIALS_PATH);
    process.exit(1);
  }

  const { client_secret, client_id, redirect_uris } = credentials.web || credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:3000/oauth2callback'
  );

  // Check if we have previously stored a token
  try {
    const token = fs.readFileSync(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    console.log('✅ Token already exists - you are already authenticated!');
    return;
  } catch (err) {
    return getNewToken(oAuth2Client);
  }
}

function getNewToken(oAuth2Client) {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    console.log('\n===========================================');
    console.log('📅 Google Calendar Authorization');
    console.log('===========================================');
    console.log('\nOpening browser for authorization...\n');

    // Create a local server to receive the OAuth callback
    const server = http.createServer(async (req, res) => {
      if (req.url.indexOf('/oauth2callback') > -1) {
        const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
        const code = qs.get('code');

        res.end('✅ Authentication successful! You can close this window and return to the terminal.');
        server.close();

        try {
          const { tokens } = await oAuth2Client.getToken(code);
          oAuth2Client.setCredentials(tokens);

          fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
          console.log('✅ Token stored to', TOKEN_PATH);
          console.log('✅ Setup complete! You can now use the meeting invite agent.');
          resolve();
        } catch (err) {
          console.error('❌ Error retrieving access token', err);
          reject(err);
        }
      }
    }).listen(3000, () => {
      // Open browser
      exec(`start ${authUrl}`);
      console.log('If browser did not open, visit this URL:');
      console.log(authUrl);
    });
  });
}

authorize().catch(console.error);
