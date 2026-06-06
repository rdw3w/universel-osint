const https = require('https');
https.get("https://abhaykumar.xo.je/api/proxy420.php?tool=number_info&query=9580499932", (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => console.log(data));
});
