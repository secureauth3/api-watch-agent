import { OnePasswordConnect } from "@1password/connect";
import twilio from "twilio"
import dotenv from "dotenv"
import fs from "fs"
import https from "https"
import { createDecipheriv} from 'crypto';
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, VALUT_NAME, ONE_PASSWORD_CONNECT_URL } from "./constants.js";
import { version } from '../package.json';
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
         messagingServiceSid: 'MG423b3f2093e44e62a21552f88c87fee0',      
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
    console.log('Checking all urls...');
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
    const onePasswordAccessToken = doDecrypt(
        {
            key: process.argv[2],
            iv: process.argv[3],
            encryptedData: process.env.ONE_PASSWORD_ACCESS_KEY
        }
    );

    const op = OnePasswordConnect({
        serverURL: ONE_PASSWORD_CONNECT_URL,
        token: onePasswordAccessToken,
        keepAlive: true,
    });

    let myVaultId = null;
    let allVaults = await op.listVaults();
    if (!allVaults || allVaults.length === 0) {
        throw new Error('Vaults not found');
    }
    for(let i = 0; i < allVaults.length; i++) {
        if (allVaults[i].name === VALUT_NAME) {
            myVaultId = allVaults[i].id;
        }
    }

    if (!myVaultId) {
        throw new Error(`Did not find Vault name ${VALUT_NAME}.`);
    }

    // get items
    const item1 = await op.getItemByTitle(myVaultId, TWILIO_ACCOUNT_SID);
    const item2 = await op.getItemByTitle(myVaultId, TWILIO_AUTH_TOKEN);

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
    if(!process.argv[2] || !process.argv[3]) {
        throw new Error('Please provide key and iv');
    }
}

const configFileValidation = () => {
    if (!fs.existsSync('config.json')) {
        throw new Error('config.json file not found');
    }

    if (!config.urls || !config.interval || !config.phone) {
        throw new Error('config.json is missing required fields');
    }
}

(async() =>{
   try {
    console.log(`API Watch version: ${version}`);
    inputValidation();
    configFileValidation();
    await getSecretFromVault();

    // start app - executed endpoint check using interval (milliseconds)
    setInterval(checkAll, config.interval * 1000);
   } catch (error) {
       console.log(error);  
   }
})();
