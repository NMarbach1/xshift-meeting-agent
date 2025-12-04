const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');

// If you want to set up a specific account, pass it as argument
// e.g., node setup-oauth.js chatbotlabs
const accountType = process.argv[2];

if (!accountType) {
  console.log('Usage: node setup-oauth.js <account-type>');
  console.log('Available accounts: chatbotlabs, voiceagentlabs, xshift');
  process.exit(1);
}

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

const CREDENTIALS_PATH = `credentials-${accountType}.json`;
const TOKEN_PATH = `token-${accountType}.json`;

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
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token
  try {
    const token = fs.readFileSync(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    console.log('Token already exists for', accountType);
    return;
  } catch (err) {
    return getNewToken(oAuth2Client);
  }
}

function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('\n===========================================');
  console.log('Authorize this app by visiting this URL:');
  console.log('\n' + authUrl + '\n');
  console.log('===========================================\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        console.error('Error retrieving access token', err);
        return;
      }
      oAuth2Client.setCredentials(token);

      // Store the token to disk for later program executions
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
      console.log('Token stored to', TOKEN_PATH);
      console.log('Setup complete for', accountType);
    });
  });
}

authorize();
