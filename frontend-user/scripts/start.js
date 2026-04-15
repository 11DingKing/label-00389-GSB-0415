const { spawn } = require('child_process');
const os = require('os');

// 获取局域网 IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();
const port = process.env.PORT || 3000;

console.log('\n\x1b[36m▲ Next.js 14.2.21\x1b[0m');
console.log(`  - Local:    \x1b[36mhttp://localhost:${port}\x1b[0m`);
console.log(`  - Network:  \x1b[36mhttp://${localIP}:${port}\x1b[0m\n`);

// 启动 Next.js
const next = spawn('npx', ['next', 'start', '-H', '0.0.0.0', '-p', port], {
  stdio: 'inherit',
  shell: true,
});

next.on('close', (code) => process.exit(code));
