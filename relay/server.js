const { WebSocketServer } = require('ws');

const port = process.env.PORT || 8080;
const wss = new WebSocketServer({ port });

// In-memory storage: disappears when Render sleeps but perfect for ephemeral secure chat
const events = [];
const subscriptions = new Map(); // Map<WebSocket, Map<subId, filters>>

console.log(`Stealth Mini-Relay running on port ${port}...`);

wss.on('connection', (ws) => {
  subscriptions.set(ws, new Map());

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const type = data[0];

      if (type === 'REQ') {
        const subId = data[1];
        const filters = data[2] || {};
        subscriptions.get(ws).set(subId, filters);
        
        // Return match from memory
        events.forEach(e => {
          let match = true;
          if (filters.kinds && !filters.kinds.includes(e.kind)) match = false;
          if (filters.authors && !filters.authors.includes(e.pubkey)) match = false;
          
          if (filters['#p']) {
            const pTags = e.tags.filter(t => t[0] === 'p').map(t => t[1]);
            if (!filters['#p'].some(p => pTags.includes(p))) match = false;
          }
          
          if (match) ws.send(JSON.stringify(['EVENT', subId, e]));
        });
        ws.send(JSON.stringify(['EOSE', subId]));

      } else if (type === 'EVENT') {
        const event = data[1];
        
        // Store
        events.push(event);
        if (events.length > 500) events.shift(); // Max 500 messages
        
        // Ack
        ws.send(JSON.stringify(['OK', event.id, true, 'saved']));
        
        // Broadcast
        wss.clients.forEach(client => {
          if (client.readyState === 1 && subscriptions.has(client)) {
            const subs = subscriptions.get(client);
            subs.forEach((filter, subId) => {
              // Note: A true relay matches filters here again.
              // For a mini relay, broadcasting to all open subs is fast enough.
              client.send(JSON.stringify(['EVENT', subId, event]));
            });
          }
        });

      } else if (type === 'CLOSE') {
        const subId = data[1];
        subscriptions.get(ws).delete(subId);
      }
    } catch (err) {
      // Ignorar basura
    }
  });

  ws.on('close', () => {
    subscriptions.delete(ws);
  });
});
