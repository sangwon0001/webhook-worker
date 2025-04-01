const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { exec } = require('child_process');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration values from environment variables
const GITHUB_SECRET = process.env.GITHUB_SECRET;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const PM2_APP_ID = process.env.PM2_APP_ID || '2';
const BUILD_COMMAND = process.env.BUILD_COMMAND || 'npm run build';

// Store raw body for signature verification
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

let isBuilding = false;

/**
 * Verify GitHub webhook signature
 * @param {Object} req - Express request object
 * @returns {boolean} - Whether signature is valid
 */
function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', GITHUB_SECRET);
  hmac.update(req.rawBody);
  const digest = `sha256=${hmac.digest('hex')}`;
  
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch (error) {
    console.error('Signature verification error:', error.message);
    return false;
  }
}

/**
 * Send notification to Slack
 * @param {string} message - Message to send to Slack
 * @returns {Promise} - Axios request promise
 */
function notifySlack(message) {
  if (!SLACK_WEBHOOK_URL) {
    console.log('Slack notification skipped (no webhook URL configured)');
    return Promise.resolve();
  }
  
  return axios.post(SLACK_WEBHOOK_URL, { text: message })
    .catch(error => {
      console.error('Failed to send Slack notification:', error.message);
    });
}

/**
 * Build and restart the application
 * @returns {Promise} - Build process promise
 */
async function buildAndRestart() {
  isBuilding = true;
  const startTime = new Date();

  return new Promise((resolve) => {
    const command = `cd ${process.env.BUILD_DIRECTORY || '.'} && ${BUILD_COMMAND} && pm2 restart ${PM2_APP_ID}`;
    console.log(`Executing: ${command}`);
    
    exec(command, (err, stdout, stderr) => {
      const duration = ((new Date()) - startTime) / 1000;
      isBuilding = false;

      if (err) {
        const message = `❌ *Build Failed*\n*Error:* ${err.message}\n*Duration:* ${duration}s`;
        console.error(message);
        notifySlack(message);
        return resolve();
      }

      const message = `✅ *${BUILD_DIRECTORY || '.'} Build Success*\n*Duration:* ${duration}s`;
      console.log(message, stdout, stderr);
      notifySlack(message);
      resolve();
    });
  });
}

// GitHub webhook endpoint
app.post('/webhook', async (req, res) => {
  // Verify webhook signature
  if (!verifySignature(req)) {
    console.warn('Invalid signature received');
    return res.status(403).send('Invalid signature');
  }

  // Check if the webhook is for the main branch
  const ref = req.body.ref;
  if (ref !== 'refs/heads/main') {
    console.log(`Ignoring webhook for branch: ${ref}`);
    return res.status(200).send('Ignored (not main branch)');
  }

  // Respond immediately to GitHub
  res.status(200).send('Build queued');
  
  // Wait if there's already a build in progress
  while (isBuilding) {
    console.log('Waiting for current build to finish...');
    await new Promise((r) => setTimeout(r, 5000));
  }

  // Start the build process
  console.log('Starting build process...');
  await buildAndRestart();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Webhook server listening on port ${PORT}`);
});
