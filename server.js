const express = require('express');
const app = express();
const server = require('http').createServer(app);
const path = require('path');
const PeerServer = require('peer').ExpressPeerServer;
const io = require('socket.io')(server);

const PORT = process.env.PORT || 7001;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('chatroulette');
});

server.listen(PORT, (err) => {
  if (err) throw err;
  console.log(`App server listening on port ${PORT}`);
});

peerServer = PeerServer(server, {
  key: 'GKGW8JYxxg4zsKW6MzW5ZV7uRSMAFjqR',
});

peerServer.on('connection', (id) => {
  console.log(`Peer with id=${id} connected`);
});

peerServer.on('disconnect', (id) => {
  console.log(`Peer with id= ${id} diconnected`);
});

app.use('/peer', peerServer);

const randomProperty = (object) => {
  const keys = Object.keys(object);
  return object[keys[Math.floor(keys.length * Math.random())]];
}

const all_peers = [];

io.on('connection', (socket) => {
  const ip = socket.handshake.address;

  console.log(`socket.io on 'connection' -> ip=${ip}`);

  // Get random id and return to requester
  socket.on('nextParticipant', (requester) => {
    console.log(`Received nextParticipant from ip=${ip}`)
    console.log(`Number of peers: ${Object.keys(all_peers).length}`);
    if (Object.keys(all_peers).length > 1) {
      let num_tries = 10;
      do {
        const random_id = randomProperty(all_peers);
        num_tries--;
        if (num_tries == 0) return;
      } while (random_id == all_peers[ip]); // not yourself, pick another
      console.log(`Responding with nextParticipant: id=${random_id}`);
      socket.emit('nextParticipant', {id: random_id});
    }
  });

  // Register peerId with ip address
  socket.on('registerId', (user) => {
    console.log(`Received registerId from ip=${ip}`);
    if (typeof(user.id) === "string") {
      all_peers[ip] = user.id;
      console.log(`ID ${user.id} successfully registered with ip=${ip}`);
    } else {
      console.error('Error registering ID');
    }
  });

  // Remove ip addresses of disconnected users
  socket.on('disconnect', (socket) => {
    delete all_peers[ip];
  });
});
