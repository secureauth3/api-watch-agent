import { createDecipheriv } from 'crypto';

const algorithm = "aes-256-ctr";

function decrypt(text) {
  const iv = Buffer.from(text.iv, 'hex');
  const encryptedText = Buffer.from(text.encryptedData, 'hex');

  const decipher = createDecipheriv(algorithm, Buffer.from(text.key, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

(async() =>{
  try {
    const dataToDecrypt = {
      key: process.argv[2],
      iv: process.argv[3],
      encryptedData: process.argv[4],
    }
    const result = decrypt(dataToDecrypt)
    console.log(result)
  } catch (error) {
      console.log(error);  
  }
})();