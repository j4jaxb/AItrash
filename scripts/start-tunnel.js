const { tunnelmole } = require('tunnelmole');
const { spawn } = require('child_process');
const http = require('http');

(async () => {
  try {
    console.log('Starting a temporary dummy server on port 8081 to satisfy Tunnelmole...');
    const dummyServer = http.createServer((req, res) => {
      res.writeHead(200);
      res.end('OK');
    });

    dummyServer.listen(8081, async () => {
      try {
        console.log('Starting Tunnelmole...');
        const url = await tunnelmole({ port: 8081 });
        console.log(`\n========================================`);
        console.log(`Tunnelmole URL: ${url}`);
        console.log(`========================================\n`);

        dummyServer.close(() => {
          console.log('Starting Expo server with Tunnelmole proxy URL...');
          const expo = spawn('npx', ['expo', 'start', '--lan'], {
            stdio: 'inherit',
            shell: true,
            env: {
              ...process.env,
              EXPO_PACKAGER_PROXY_URL: url
            }
          });

          expo.on('close', (code) => {
            console.log(`Expo process exited with code ${code}`);
            process.exit(code || 0);
          });
        });
      } catch (err) {
        console.error('Error starting Tunnelmole:', err);
        dummyServer.close();
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
})();
