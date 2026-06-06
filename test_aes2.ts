import https from 'https';
import crypto from 'crypto';

const fetchWithCache = (url) => new Promise((resolve, reject) => {
  https.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "text/html,application/xhtml+xml,application/xml"
    }
  }, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      resolve({status: res.statusCode, data, headers: res.headers});
    });
  });
});

async function run() {
  const url = "https://abhaykumar.xo.je/api/proxy420.php?tool=number_info&query=9580499932";
  const res = await fetchWithCache(url);
  
  const m = res.data.match(/a=toNumbers\("([a-f0-9]+)"\),b=toNumbers\("([a-f0-9]+)"\),c=toNumbers\("([a-f0-9]+)"\)/);
  if (m) {
    const key = Buffer.from(m[1], 'hex');
    const iv = Buffer.from(m[2], 'hex');
    const ciphertext = Buffer.from(m[3], 'hex');
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    decipher.setAutoPadding(false);
    let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const cookieVal = decrypted.toString('hex');
    console.log("Calculated cookie:", cookieVal);
    
    return new Promise((resolve) => {
      https.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Cookie": `__test=${cookieVal}`,
          "Accept": "application/json"
        }
      }, (res2) => {
        let d2 = '';
        res2.on('data', c => d2 += c);
        res2.on('end', () => console.log("Final:", d2));
      });
    });
  } else {
    console.log("No match found", !!res.data.includes('aes.js'));
    console.log(res.data);
  }
}

run();
