# API Watch
Check your API health endpoints periodically and receive text message notification,
if your API goes down.

# Intergrations
1. 1Password - uses 1Password [Secrets Automation](https://developer.1password.com/docs/connect) to secure, orchestrate, and manage infrastructure secrets.
2. Twilio - uses [Twilio](https://www.twilio.com/) to send text messages
3. AWS - uses Amazon Elastic Compute Cloud(EC2) to provide scalable computing capacity
4. Node.js built-in crypto module -  256-bit AES encryption(aes-256-ctr) to conceal 1Password access token at rest
5. [pm2](https://pm2.keymetrics.io/) - helps manage and keep application online in production
6. [Rollup](https://rollupjs.org/guide/en/#overview) - module bundler

# Requirements
1. Set up config.json
```json
 {
        "phone": "+<my-phone-number>",
        "interval": 10,
        "urls": [
            "https://google.com",
            "https://facebook.com",
            "https://twitter.com"
        ]
    }
```
2. Create `.env`
3. Issue a 1Password [Secrets Automation access token](https://developer.1password.com/docs/connect/manage-secrets-automation)
   - Sign up for 1Password
   - Set up a Secrets Automation workflow.
3. Set up a [Twilio](https://www.twilio.com/) account with phone number
   - Twilio Account SID (store in your 1Password value)
   - Twilio Auth Token (store in your 1Password value)

# Run app locally
1. ```npm install```
2. ```npm run encrypt-token <1password-access-token>```
    - copy `ONE_PASSWORD_ACCESS_KEY` value from output into .env
3. update values in `./src/contants.js`
4. run prod or local command from output ```npm run start <key> <iv>``` or ```npm run prod <key> <iv>``` 

# PM2 (prod deploy EC2)
Note: Make sure node.js is installed
1. `npm run build`
2. ssh ec2-user@<your-server-ip-address> -i ~<local-path-to-your-ssh-key.pem> (ssh into your server)
3. scp -i ~<local-path-to-your-ssh-key.pem> -r ./dist/ ec2-user@<your-server-ip-address>:~ (copy bundled app onto your server)
4. `npm install pm2@latest -g`
5. `pm2 link <link key>` (link to pm2 account dashboad -optional)
6. `npm install` (install apps dependencies on your server. Must be inside of `/dist`)
7. create `.env` on server and run `srcipts/encrypt.js` to get 1Password access to <key> and <iv> 
8. `NODE_ENV=production pm2 start --name api-watch --attach src/watch.js -- <key> <iv>` (use pm2 to start app)

Info commands
- `pm2 list`
- `pm2 stop api-watch`
- `pm2 delete api-watch`