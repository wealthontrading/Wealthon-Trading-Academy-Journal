const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace('responseModalities: [Modality.AUDIO]', 'responseModalities: ["AUDIO", "TEXT"]');

server = server.replace(
  'const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;',
  `const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const p of parts) {
                if (p.inlineData?.data && clientWs.readyState === 1) {
                  clientWs.send(JSON.stringify({ audio: p.inlineData.data }));
                }
                if (p.text && clientWs.readyState === 1) {
                  clientWs.send(JSON.stringify({ text: p.text }));
                }
              }
            }`
);

fs.writeFileSync('server.ts', server);
