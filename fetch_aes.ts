import https from 'https';
https.get("https://abhaykumar.xo.je/aes.js", (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => console.log(data.length));
});
