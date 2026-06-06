import crypto from 'crypto';

function toNumbers(d) {
    let e = [];
    d.replace(/(..)/g, function(d) {
        e.push(parseInt(d, 16));
    });
    return e;
}

function toHex(d) {
    let e = "";
    for (let f = 0; f < d.length; f++) {
        e += (16 > d[f] ? "0" : "") + d[f].toString(16);
    }
    return e.toLowerCase();
}

const a_hex = "f655ba9d09a112d4968c63579db590b4";
const b_hex = "98344c2eee86c3994890592585b49f80";
const c_hex = "f4b516c9daadf99a4db9b58b317292b4";

const key = Buffer.from(a_hex, 'hex');
const iv = Buffer.from(b_hex, 'hex');
const ciphertext = Buffer.from(c_hex, 'hex');

try {
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  decipher.setAutoPadding(false); // maybe?
  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  console.log("Cookie value: ", decrypted.toString('hex'));
} catch (err) {
  console.error("CBC failed", err);
}
