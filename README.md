# API Watch
Check your API health endpoints periodically and receive text message notification,
if your API goes down. This agent was designed to run on AWS ECS instance

# Intergrations
1. 1Password - uses 1Password [Secrets Automation](https://developer.1password.com/docs/connect) to secure, orchestrate, and manage infrastructure secrets.
2. Twilio - uses [Twilio](https://www.twilio.com/) to send text messages
3. AWS - uses Amazon Elastic Compute Cloud(EC2) to provide scalable computing capacity
4. Node.js built-in crypto module -  256-bit AES encryption(aes-256-ctr) to conceal 1Password access token
5. [pm2](https://pm2.keymetrics.io/) - helps manage and keep application online in production
6. [Rollup](https://rollupjs.org/guide/en/#overview) - module bundler

# Requirements
1. Issue a 1Password [Secrets Automation access token](https://developer.1password.com/docs/connect/manage-secrets-automation) for your app
   - Sign up for 1Password
   - Set up a Secrets Automation workflow.
   - Create new valut for app
2. Set up a [Twilio](https://www.twilio.com/) account with phone number
   - Twilio Account SID (store in your 1Password app value as JSON Web Token type)
   - Twilio Auth Token (store in your 1Password app value as JSON Web Token type)

3. Set up config.json
```json
    {
        "phone": "+<my-phone-number>",
        "messagingServiceSid": "<your-messagingServiceSid>",
        "interval": 1200,
        "urls": [
            "list of endpoint you want watch>",
            "...",
            "..."
        ],
        "onePasswordVault": {
            "vaultName": "<your-app-vault-name>",
            "twilioAccountSIDVaultItem": "<your-twilio-account-sid-vault-item-name>", //do not place secret here only the name of item
            "twilioAuthTokenVaultItem": "<your-twilio-AuthToken-vault-item-name>", //do not place secret here only the name of item
            "onePasswordConnectUrl": "<your 1Password connect server url>"
        }
    }
```

# Run app locally
1. ```npm install```
2. ```npm run build```
3. run prod or local command from output ```npm run start <your-1Password-acces-token> local``

# PM2 (prod deploy EC2 instance)
Note: Make sure node.js is installed on EC2 instance
1. `npm run build`
2. ssh ec2-user@<your-server-ip-address> -i ~<local-path-to-your-ssh-key.pem> (ssh into your server)
3. scp -i ~<local-path-to-your-ssh-key.pem> -r ./dist/ ec2-user@<your-server-ip-address>:~ (copy bundled app onto your server)
4. `npm install pm2@latest -g`
5. from root path `cd ./dist`
6. `pm2 link <link key>` (link to pm2 account dashboad -optional)
7. `npm install` (install apps dependencies on your server. Must be inside of `./dist` to start app in prod)
8. `chmod 0700 dist/scripts/startup.sh`
9. `scripts/startup.sh <your-1Password-acces-token>` (use pm2 to start app)

Info commands
- `pm2 list`
- `pm2 stop api-watch`
- `pm2 delete api-watch`