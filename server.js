const express = require('express');
const path = require('path');
const { google } = require('googleapis');
const Anthropic = require('@anthropic-ai/sdk');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Initialize Claude API
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// OAuth2 client setup for Calendar (uses nmarbach@gmail.com)
function getCalendarAuth() {
  const credentials = require('./credentials.json');
  const { client_secret, client_id, redirect_uris } = credentials.web || credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  try {
    const token = require('./token.json');
    oAuth2Client.setCredentials(token);
  } catch (error) {
    console.error('Token not found. Please run setup-calendar.js');
    throw new Error('Calendar not authorized');
  }

  return oAuth2Client;
}

// Email transporter for XShift
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.XSHIFT_EMAIL,
    pass: process.env.XSHIFT_PASSWORD
  }
});

// Generate personalized email (simple template)
async function generatePersonalizedEmail(recipientData, meetLink, meetingDateTime) {
  const {firstName, company, painPoints} = recipientData;

  // Extract first pain point (up to 100 chars)
  const mainPainPoint = painPoints.substring(0, 100).trim();

  return `
<div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 16px; margin: 20px 0; border-radius: 4px;">
  <p style="margin: 0; font-size: 16px; font-weight: bold;">📅 Meeting Confirmed</p>
  <p style="margin: 8px 0 0 0;"><strong>Time:</strong> ${meetingDateTime}</p>
  <p style="margin: 8px 0 0 0;"><strong>Join:</strong> <a href="${meetLink}" style="color: #0284c7; text-decoration: underline; font-weight: 500;">Click here for Google Meet</a></p>
</div>

<p>Hi ${firstName},</p>

<p>Looking forward to our demo! I saw ${company} is currently dealing with "${mainPainPoint}..." - I'll show you exactly how XShift's AI scheduling solves that and saves hours every week.</p>

<p>The Google Calendar invite has been sent with all the details. See you soon!</p>

<p>Best,<br>The XShift Team</p>
`.trim();
}

// Create Google Calendar event with Meet link
async function createCalendarEvent(auth, recipientData) {
  const { recipientEmail, firstName, lastName, company, meetingDate, meetingTime, ampm, timezone } = recipientData;
  const calendar = google.calendar({ version: 'v3', auth });

  // Convert 12-hour time to 24-hour format
  let [hours, minutes] = meetingTime.split(':');
  hours = parseInt(hours);
  minutes = parseInt(minutes) || 0;

  if (ampm === 'PM' && hours !== 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }

  const time24 = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  // Combine date and time into ISO format
  const startDateTime = new Date(`${meetingDate}T${time24}`);
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour meeting

  const event = {
    summary: `XShift Demo - ${company}`,
    description: `Meeting with ${firstName} ${lastName} from ${company} to discuss XShift's AI-powered employee scheduling platform.`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: timezone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: timezone,
    },
    attendees: [
      { email: recipientEmail },
    ],
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all', // Send calendar invite to attendees
    });

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

// Send email via Gmail SMTP
async function sendEmail(recipientEmail, recipientName, subject, htmlBody) {
  const mailOptions = {
    from: `XShift <${process.env.XSHIFT_EMAIL}>`,
    to: recipientEmail,
    subject: subject,
    html: htmlBody
  };

  try {
    await emailTransporter.sendMail(mailOptions);
    console.log(`Email sent to ${recipientEmail}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Send meeting invite
async function sendMeetingInvite(recipientData) {
  const { recipientEmail, firstName, lastName, company, meetingDate, meetingTime, ampm, timezone } = recipientData;
  const auth = getCalendarAuth();

  // Create calendar event with Google Meet
  const calendarEvent = await createCalendarEvent(auth, recipientData);
  const meetLink = calendarEvent.hangoutLink;

  // Convert 12-hour time to 24-hour for formatting
  let [hours, minutes] = meetingTime.split(':');
  hours = parseInt(hours);
  minutes = parseInt(minutes) || 0;

  if (ampm === 'PM' && hours !== 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }

  const time24 = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  // Format meeting time for email
  const meetingDateTime = new Date(`${meetingDate}T${time24}`);
  const formattedDateTime = meetingDateTime.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
    timeZoneName: 'short'
  });

  // Generate personalized email with all recipient data
  const emailBody = await generatePersonalizedEmail(recipientData, meetLink, formattedDateTime);

  // Send email from XShift
  const subject = `Meeting Confirmed: ${company} + XShift - ${formattedDateTime}`;
  await sendEmail(recipientEmail, `${firstName} ${lastName}`, subject, emailBody);

  return {
    success: true,
    meetLink: meetLink,
    eventId: calendarEvent.id,
    emailBody: emailBody,
    meetingTime: formattedDateTime
  };
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/send-invite', async (req, res) => {
  try {
    const { firstName, lastName, recipientEmail, company, industry, employeeCount, painPoints, meetingDate, meetingTime, ampm, timezone } = req.body;

    // Validate required inputs
    if (!firstName || !lastName || !recipientEmail || !company || !industry || !employeeCount || !painPoints || !meetingDate || !meetingTime || !ampm || !timezone) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    // Send meeting invite with all recipient data
    const result = await sendMeetingInvite(req.body);

    res.json({
      success: true,
      message: 'Meeting confirmation sent successfully!',
      meetLink: result.meetLink,
      meetingTime: result.meetingTime,
      emailPreview: result.emailBody
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Failed to send meeting confirmation',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Meeting Invite Agent running at http://localhost:${PORT}`);
  console.log(`Sending emails from: ${process.env.XSHIFT_EMAIL}`);
  console.log(`Calendar events created on: nmarbach@gmail.com`);
});
