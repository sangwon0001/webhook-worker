#!/bin/bash

# Default settings
WEBHOOK_URL="http://localhost:3000/webhook"
SECRET="mysecret"
PAYLOAD_FILE="payload.json"

# Help function
print_help() {
  echo " GitHub Webhook Simulator"
  echo ""
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --url <url>         Webhook server URL (default: $WEBHOOK_URL)"
  echo "  --secret <secret>   GitHub Webhook Secret (default: $SECRET)"
  echo "  --file <path>       Payload JSON file path (default: $PAYLOAD_FILE)"
  echo "  -h, --help          Print help"
  echo ""
  exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --url)
      WEBHOOK_URL="$2"
      shift 2
      ;;
    --secret)
      SECRET="$2"
      shift 2
      ;;
    --file)
      PAYLOAD_FILE="$2"
      shift 2
      ;;
    -h|--help)
      print_help
      ;;
    *)
      echo " Unknown option: $1"
      print_help
      ;;
  esac
done

# Check payload file
if [ ! -f "$PAYLOAD_FILE" ]; then
  echo " Payload file does not exist: $PAYLOAD_FILE"
  exit 1
fi

# Generate signature
SIGNATURE=$(openssl dgst -sha256 -hmac "$SECRET" < "$PAYLOAD_FILE" | sed 's/^.* //')

# Print request info
echo " Sending Webhook request..."
echo " URL: $WEBHOOK_URL"
echo " Signature: sha256=$SIGNATURE"
echo " Payload file: $PAYLOAD_FILE"
echo

# Execute curl request
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=$SIGNATURE" \
  --data-binary "@$PAYLOAD_FILE"