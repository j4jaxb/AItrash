const { spawn, execSync } = require('child_process');
const http = require('http');
const net = require('net');
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

// Helper to kill processes on exit
const childProcesses = [];
let proxyServer = null;

function cleanup() {
  console.log('\nCleaning up processes...');
  if (proxyServer) {
    try {
      proxyServer.close();
    } catch (e) {}
  }
  for (const proc of childProcesses) {
    if (proc && !proc.killed) {
      try {
        proc.kill();
      } catch (e) {}
    }
  }
}
process.on('exit', cleanup);
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

function startReverseProxy() {
  const proxy = http.createServer((req, res) => {
    let targetPort;
    if (req.url.startsWith('/predict')) {
      targetPort = 5000;
    } else if (req.url.startsWith('/api/email')) {
      targetPort = 5001;
    } else {
      targetPort = 8081;
    }

    const proxyReq = http.request({
      host: '127.0.0.1',
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: req.headers
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      res.writeHead(502);
      res.end(`Bad Gateway: ${err.message}`);
    });

    req.pipe(proxyReq, { end: true });
  });

  proxy.on('upgrade', (req, socket, head) => {
    const client = net.connect(8081, '127.0.0.1', () => {
      let rawHeaders = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`;
      for (let i = 0; i < req.rawHeaders.length; i += 2) {
        rawHeaders += `${req.rawHeaders[i]}: ${req.rawHeaders[i+1]}\r\n`;
      }
      rawHeaders += '\r\n';
      
      client.write(rawHeaders);
      client.write(head);
      socket.pipe(client).pipe(socket);
    });
    client.on('error', () => socket.destroy());
    socket.on('error', () => client.destroy());
  });

  proxy.listen(8000, '127.0.0.1', () => {
    console.log('Local reverse proxy running on port 8000...');
  });

  return proxy;
}

function getNgrokUrl() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.tunnels && json.tunnels.length > 0) {
            const httpsTunnel = json.tunnels.find(t => t.proto === 'https');
            if (httpsTunnel) {
              resolve(httpsTunnel.public_url);
            } else {
              resolve(json.tunnels[0].public_url);
            }
          } else {
            reject(new Error('No tunnels active'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

(async () => {
  try {
    // Clean up any existing ngrok daemon
    console.log('Cleaning up existing Ngrok connections...');
    try {
      execSync('taskkill /F /IM ngrok.exe', { stdio: 'ignore' });
    } catch (e) {
      // Ignore if taskkill fails
    }

    // Clean up ports 5000, 5001, 8000, 8081 and 4040 (ngrok control port) before launching
    console.log('Cleaning up ports 5000, 5001, 8000, 8081, 4040...');
    try {
      execSync('npx --yes kill-port 5000 5001 8000 8081 4040', { stdio: 'ignore' });
      console.log('Ports are ready!');
    } catch (e) {
      // Ignore if ports were already free or kill-port failed
    }

    // 1. Start Email Server (port 5001)
    console.log('Starting Email Server (port 5001)...');
    const emailServer = spawn('node', ['backend/emailServer.js'], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true
    });
    childProcesses.push(emailServer);

    // 2. Start AI Server (port 5000)
    console.log('Starting AI Server (port 5000)...');
    const aiServer = spawn('.venv\\Scripts\\python.exe', ['backend/ai_server.py'], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true
    });
    childProcesses.push(aiServer);

    // 3. Start Local Reverse Proxy (port 8000)
    proxyServer = startReverseProxy();

    // Give the servers a few seconds to start up
    console.log('Waiting 5 seconds for backends to start...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. Start Ngrok on port 8000 by spawning npx ngrok directly
    console.log('Starting Ngrok on port 8000...');
    const ngrok = spawn('npx', ['ngrok', 'http', '8000'], {
      cwd: projectRoot,
      stdio: 'ignore',
      shell: true
    });
    childProcesses.push(ngrok);

    // Wait and query the Ngrok API to get the public tunnel URL
    let tunnelUrl;
    console.log('Resolving Ngrok tunnel URL...');
    for (let i = 0; i < 20; i++) {
      try {
        tunnelUrl = await getNgrokUrl();
        break;
      } catch (e) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (!tunnelUrl) {
      throw new Error('Ngrok failed to start or did not return a tunnel URL. Please ensure your authtoken is configured.');
    }

    console.log(`\n======================================================================`);
    console.log(`Shared Ngrok Tunnel URL: ${tunnelUrl}`);
    console.log(`======================================================================\n`);

    // 5. Update utils/config.js with the new tunnel URLs
    const configPath = path.join(projectRoot, 'utils', 'config.js');
    const configContent = `// Auto-generated configuration for backend tunnel URLs
export const API_CONFIG = {
  AI_URL: "${tunnelUrl}",
  EMAIL_URL: "${tunnelUrl}"
};
`;
    fs.writeFileSync(configPath, configContent);
    console.log('Updated utils/config.js with tunnel URLs.');

    // 6. Launch Expo on port 8081 with EXPO_PACKAGER_PROXY_URL set to tunnelUrl
    console.log('Starting Expo server with Ngrok proxy URL...');
    const expo = spawn('npx', ['expo', 'start', '--lan'], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        EXPO_PACKAGER_PROXY_URL: tunnelUrl
      }
    });
    childProcesses.push(expo);

    expo.on('close', (code) => {
      console.log(`Expo process exited with code ${code}`);
      process.exit(code || 0);
    });

  } catch (error) {
    console.error('Failed to start development environment:', error);
    process.exit(1);
  }
})();
