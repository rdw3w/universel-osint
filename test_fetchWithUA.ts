import crypto from 'crypto';

const fetchWithUA = async (url: string) => {
    let res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      }
    });
    
    let text = await res.text();
    
    const m = text.match(/a=toNumbers\("([a-f0-9]+)"\),b=toNumbers\("([a-f0-9]+)"\),c=toNumbers\("([a-f0-9]+)"\)/);
    if (m) {
      try {
        const key = Buffer.from(m[1], 'hex');
        const iv = Buffer.from(m[2], 'hex');
        const ciphertext = Buffer.from(m[3], 'hex');
        const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
        decipher.setAutoPadding(false);
        const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        const cookieVal = decrypted.toString('hex');
        
        let finalUrl = url;
        if (url.includes('?')) finalUrl += "&i=1";
        else finalUrl += "?i=1";

        res = await fetch(finalUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Cookie": `__test=${cookieVal}`
          }
        });
        text = await res.text();
      } catch (e) {
        console.error("Bypass failed", e);
      }
    }

    console.log("FINAL TEXT:", text);
}

fetchWithUA("https://abhaykumar.xo.je/api/proxy420.php?tool=number_info&query=9580426580");
