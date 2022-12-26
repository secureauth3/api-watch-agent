import { createCipheriv, randomBytes, createDecipheriv } from 'crypto';

const initVector = randomBytes(16);
const securitykey = randomBytes(32);
const algorithm = "aes-256-ctr";

function encrypt(text) {
  const cipher = createCipheriv(algorithm, Buffer.from(securitykey), initVector);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: initVector.toString('hex'), encryptedData: encrypted.toString('hex') };
}
 
function decrypt(text, key) {
  const iv = Buffer.from(text.iv, 'hex');
  const encryptedText = Buffer.from(text.encryptedData, 'hex');

  const decipher = createDecipheriv(algorithm, Buffer.from(key, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

(async() =>{
  try {
    const dataToEncrypt = process.argv[2];
    const encryptedData = encrypt(dataToEncrypt);
    console.log('key: ' + securitykey.toString('hex'));
    console.log('iv: ' + initVector.toString('hex'));
    console.log(`ONE_PASSWORD_ACCESS_KEY=${encryptedData.encryptedData}`);
    console.log('____________________________________________________')
    
    const testEncrypted = decrypt(encryptedData, securitykey.toString('hex'));
    if (!testEncrypted === dataToEncrypt) {
      throw new Error('Encryption failed');
    }
  } catch (error) {
      console.log(error);  
  }
})();