// ESM-compatible client
const socket = io();
const roomId = "default-room";
const peers = {};

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const remoteVideo2 = document.getElementById("remoteVideo2");

navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    localVideo.srcObject = stream;

    socket.emit("join", roomId);

    socket.on("all-users", (users) => {
      users.forEach((userId) => {
        const peer = createPeer(userId, socket.id, stream);
        peers[userId] = peer;
      });
    });

    socket.on("user-joined", (userId) => {
      const peer = addPeer(userId, stream);
      peers[userId] = peer;
    });

    socket.on("user-signal", (payload) => {
      const peer = peers[payload.callerId];
      peer.signal(payload.signal);
    });

    socket.on("receiving-returned-signal", (payload) => {
      const peer = peers[payload.id];
      peer.signal(payload.signal);
    });
  })
  .catch((err) => {
    console.error("Media error:", err);
    alert("Camera/Mic not found or permission denied.");
  });

function createPeer(userToSignal, callerId, stream) {
  const peer = new SimplePeer({
    initiator: true,
    trickle: false,
    stream: stream,
  });

  peer.on("signal", (signal) => {
    socket.emit("sending-signal", { userToSignal, callerId, signal });
  });

  peer.on("stream", (remoteStream) => {
    remoteVideo.srcObject = remoteStream;
  });
  peer.on("stream", (remoteStream) => {
    remoteVideo2.srcObject = remoteStream;
  });
  return peer;
}

function addPeer(incomingId, stream) {
  const peer = new SimplePeer({
    initiator: false,
    trickle: false,
    stream: stream,
  });

  peer.on("signal", (signal) => {
    socket.emit("returning-signal", { signal, callerId: incomingId });
  });

  peer.on("stream", (remoteStream) => {
    remoteVideo.srcObject = remoteStream;
  });
  peer.on("stream", (remoteStream) => {
    remoteVideo2.srcObject = remoteStream;
  });
  return peer;
}
