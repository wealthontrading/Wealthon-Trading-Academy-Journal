const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace('responseModalities: ["AUDIO", "TEXT"]', 'responseModalities: [Modality.AUDIO, Modality.TEXT]');

server = server.replace('if (audio && clientWs.readyState === 1) clientWs.send(JSON.stringify({ audio }));\n', '');

fs.writeFileSync('server.ts', server);
