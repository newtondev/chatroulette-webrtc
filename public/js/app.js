//(() => {

  const initUserMedia = () => {
    um = navigator.getUserMedia || navigator.webkitGetUserMedia ||
          navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if (!!um) {
      navigator.getUserMedia = um;
      return true;
    }

    return false;
  };

  const toggleVideoPlayPause = () => {
    console.log("Toggle PLAY PAUSE!");
    const video = document.querySelector('.local-video');
    console.log(video);
    if (!video.paused) {
      video.pause();
    } else {
      video.play();
    }
  };

  window.addEventListener('load', () => {
    console.log("LOADED!");
    if (initUserMedia()) {
      navigator.getUserMedia({
        video: true,
        audio: true
      }, (localMediaStream) => {
        const video = document.querySelector('.local-video');
        // cache for later use
        window.localMediaStream = localMediaStream;
        video.src = window.URL.createObjectURL(localMediaStream);
      }, (err) => {
        console.error("Failed getting user media");
        if (err) throw err;
      });

      const peer = new Peer('', {
        host: window.location.hostname,
        secure: true,
        key: 'GKGW8JYxxg4zsKW6MzW5ZV7uRSMAFjqR',
        port: 7001,
        path: '/peer',
      });

      peer.on('open', () => {
        console.log('Connected to Peer.js');
      });

      const socket = io.connect(window.location.href);
      socket.on('connect', (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log('Connected to socket.io');
          // Register our id with the server or wait for id from server and
          // then Register
          if (peer.open) {
            socket.emit('registerId', {id: peer.id});
          } else {
            peer.on('open', () => {
              socket.emit('registerId', {id: peer.id});
            });
          }
        }
      });

      const onCallConnected = (stream) => {
        console.log("CALL CONNECTED!!!");
        const video = document.querySelector('.remote-video');
        console.log(video);
        video.src = window.URL.createObjectURL(stream);
      };

      socket.on('nextParticipant', (participant) => {
        console.log('Received nextParticipant');
        console.log(participant);
        if (window.localMediaStream) {
          const call = peer.call(participant.id, window.localMediaStream).on('stream', onCallConnected);
        }
      });

      peer.on('call', (call) => {
        call.answer(window.localMediaStream);
        call.on('stream', onCallConnected);
      });

      document.querySelector('.btn-next').onclick = () => {
        socket.emit('nextParticipant');
      };
    } else {
      console.error('Failed getting user media... Unsupported browser!');
    }
  });

//})()
