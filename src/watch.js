import { OnePasswordConnect } from "@1password/connect";
import twilio from "twilio"
import dotenv from "dotenv"
import fs from "fs"
import https from "https"
import { createDecipheriv} from 'crypto';
dotenv.config();

let twilioAccountSid = ''; 
let twilioAuthToken = ''; 
let twilioClient = null;
const algorithm = "aes-256-ctr";

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const log = (message) => {
    fs.appendFileSync('app.log', `${new Date().toISOString()} ${message}\r

`);
}

const sendMessage = (messageBody) => {
    twilioClient = twilio(twilioAccountSid, twilioAuthToken);

    twilioClient.messages 
      .create({ 
         body: messageBody,  
         messagingServiceSid: config.messagingServiceSid,     
         to: config.phone
       }) 
      .then(message => console.log('Message sent:', message.sid)) 
      .done();
}

const check = (url) => {
    https.get(url, (res) => {
        log
        (`[${url}] ${res.statusCode} up`);
    }).on('error', (e) => {
        log
        (`
        [${url}] ${e.message} down
        `);
        sendMessage(`Error: [${url}] ${e.message}`);
    });
}

const checkAll = () => {
    console.log('Checking all urls...', new Date().toISOString());
    config.urls.forEach(check);
}

const doDecrypt = (text) => {
    const iv = Buffer.from(text.iv, 'hex');
    const encryptedText = Buffer.from(text.encryptedData, 'hex');
  
    const decipher = createDecipheriv(algorithm, Buffer.from(text.key, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

const getSecretFromVault = async () => {
    console.log(process.argv[2])
    console.log(process.argv[3])
    console.log(process.argv[4])
    const onePasswordAccessToken = doDecrypt(
        {
            key: process.argv[2],
            iv: process.argv[3],
            encryptedData: process.argv[4]
        }
    );

    const op = OnePasswordConnect({
        serverURL: config.onePasswordVault.onePasswordConnectUrl,
        token: onePasswordAccessToken,
        keepAlive: true,
    });

    let myVaultId = null;
    let allVaults = await op.listVaults();
    if (!allVaults || allVaults.length === 0) {
        throw new Error('Vaults not found');
    }
    for(let i = 0; i < allVaults.length; i++) {
        if (allVaults[i].name === config.onePasswordVault.vaultName) {
            myVaultId = allVaults[i].id;
        }
    }

    if (!myVaultId) {
        throw new Error(`Did not find Vault name ${config.onePasswordVault.vaultName}.`);
    }

    // get items
    const item1 = await op.getItemByTitle(myVaultId, config.onePasswordVault.twilioAccountSIDVaultItem);
    const item2 = await op.getItemByTitle(myVaultId, config.onePasswordVault.twilioAuthTokenVaultItem);

    for(let i = 0; i < item1.fields.length; i++) {
        if (item1.fields[i].id === "credential") {
            twilioAccountSid = item1.fields[i].value;
        }
    }

    for(let i = 0; i < item2.fields.length; i++) {
        if (item2.fields[i].id === "credential") {
            twilioAuthToken = item2.fields[i].value;
        }
    }
}

const inputValidation = () => {
    if(!process.argv[2] || !process.argv[3] || !process.argv[4]) {
        throw new Error('Please provide key,  iv, and encrypted one password access key');
    }
}

const configFileValidation = () => {
    if (!fs.existsSync('config.json')) {
        throw new Error('config.json file not found');
    }

    if (!config.urls || !config.interval || !config.phone || !config.onePasswordVault) {
        throw new Error('config.json is missing required fields');
    }

    if (!config.onePasswordVault.vaultName 
        || !config.onePasswordVault.twilioAccountSIDVaultItem 
        || !config.onePasswordVault.twilioAuthTokenVaultItem
        || !config.onePasswordVault.onePasswordConnectUrl
        ) {
        throw new Error('config.json is missing required fields');
    }

    if (config.urls.length === 0) {
        throw new Error('config.json is missing urls');
    }

    if (config.interval < 1) {
        throw new Error('config.json interval must be greater than 1');
    }
}

(async() =>{
   try {
    inputValidation();
    configFileValidation();
    await getSecretFromVault();

    // start app - executed endpoint check using interval (milliseconds)
    sendMessage('App started');
    checkAll();
    setInterval(checkAll, config.interval * 1000);
   } catch (error) {
      console.log(error.message);  
      process.exit(1);
   }
})();
