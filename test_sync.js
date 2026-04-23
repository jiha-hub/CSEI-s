const http = require('http');

const data = JSON.stringify({
  csei_results: [{
    scores: [
      { subject: '희 (喜)', A: 50, fullMark: 100 }
    ],
    timestamp: new Date().toISOString()
  }],
  cure_history: []
});

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/user/sync',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`status: ${res.statusCode}`);
  let chunks = '';
  res.on('data', d => chunks += d);
  res.on('end', () => console.log('Response:', chunks));
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
