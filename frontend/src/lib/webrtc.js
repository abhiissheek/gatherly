// WebRTC configuration
const DEFAULT_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export const createPeerConnection = (iceServers = DEFAULT_ICE_SERVERS) => {
  console.log("Creating peer connection with ICE servers:", iceServers);
  const configuration = {
    iceServers: iceServers.length > 0 ? iceServers : DEFAULT_ICE_SERVERS,
  };

  return new RTCPeerConnection(configuration);
};

export const addLocalStream = async (peerConnection, stream) => {
  console.log("Adding local stream to peer connection");
  stream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, stream);
  });
};

export const createOffer = async (peerConnection) => {
  console.log("Creating offer");
  const offer = await peerConnection.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
  });
  await peerConnection.setLocalDescription(offer);
  console.log("Offer created and local description set");
  return offer;
};

export const createAnswer = async (peerConnection, offer) => {
  console.log("Creating answer for offer:", offer);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  console.log("Answer created and local description set");
  return answer;
};

export const handleAnswer = async (peerConnection, answer) => {
  console.log("Handling answer:", answer);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  console.log("Remote description set successfully");
};

export const handleIceCandidate = async (peerConnection, candidate) => {
  console.log("Handling ICE candidate:", candidate);
  if (candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    console.log("ICE candidate added successfully");
  }
};

export const getMediaStream = async (constraints = { video: true, audio: true }) => {
  try {
    console.log("Getting media stream with constraints:", constraints);
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log("Media stream obtained successfully:", stream);
    return stream;
  } catch (error) {
    console.error("Error accessing media devices:", error);
    throw error;
  }
};

export const getDisplayStream = async () => {
  try {
    console.log("Getting display stream");
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
    console.log("Display stream obtained successfully:", stream);
    return stream;
  } catch (error) {
    console.error("Error accessing display media:", error);
    throw error;
  }
};

export const stopMediaStream = (stream) => {
  console.log("Stopping media stream");
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
};

export const toggleAudioTrack = (stream, enabled) => {
  console.log("Toggling audio track to:", enabled);
  const audioTrack = stream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = enabled;
  }
};

export const toggleVideoTrack = (stream, enabled) => {
  console.log("Toggling video track to:", enabled);
  const videoTrack = stream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = enabled;
  }
};

export const replaceVideoTrack = async (peerConnection, newTrack) => {
  console.log("Replacing video track");
  const sender = peerConnection
    .getSenders()
    .find((s) => s.track && s.track.kind === "video");
  
  if (sender) {
    await sender.replaceTrack(newTrack);
    console.log("Video track replaced successfully");
  }
};