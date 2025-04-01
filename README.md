# Webhook Worker

A simple GitHub webhook server that automatically builds and deploys your application when changes are pushed to the main branch. It also sends notifications to Slack about the build status.

## Features

- GitHub webhook integration with signature verification
- Automatic build and deployment via PM2
- Slack notifications for build status
- Queue system to handle multiple webhook events
- Health check endpoint

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Copy the environment sample file and configure it:

```bash
cp .env.sample .env
```

4. Edit the `.env` file with your configuration values:
   - `GITHUB_SECRET`: Your GitHub webhook secret
   - `SLACK_WEBHOOK_URL`: Your Slack webhook URL
   - `PM2_APP_ID`: The PM2 process ID to restart (default: 2)
   - `BUILD_COMMAND`: The command to run for building (default: npm run build)

## Usage

### Development Mode

To run the server in development mode with auto-restart on file changes:

```bash
npm run dev
```

### Production Mode

To run the server in production mode:

```bash
npm start
```

For production deployment, it's recommended to use PM2:

```bash
pm2 start src/index.js --name webhook-worker
```

## PM2 Deployment

### Installation

Install PM2 globally:

```bash
npm install -g pm2
```

### Starting the Application



```bash
pm2 start ecosystem.config.js
```

### PM2 Management Commands

- View application status:
```bash
pm2 status
```

- Stop the application:
```bash
pm2 stop webhook-worker
```

- Restart the application:
```bash
pm2 restart webhook-worker
```

- View logs:
```bash
pm2 logs webhook-worker
```

### Startup and Auto-restart

To ensure the application starts automatically on system reboot:

```bash
pm2 startup
pm2 save
```

### Monitoring

Use PM2's monitoring tools:

```bash
pm2 monit
```

## GitHub Webhook Setup

1. Go to your GitHub repository
2. Navigate to Settings > Webhooks > Add webhook
3. Set the Payload URL to your server's URL (e.g., `https://your-server.com/webhook`)
4. Set Content type to `application/json`
5. Set a Secret that matches your `GITHUB_SECRET` environment variable
6. Select "Just the push event"
7. Ensure "Active" is checked
8. Click "Add webhook"

## Endpoints

- `POST /webhook`: GitHub webhook endpoint
- `GET /health`: Health check endpoint

## License

MIT
