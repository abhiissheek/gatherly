import { create } from "zustand";

export const useMeetingStore = create((set) => ({
  // Current meeting state
  currentMeeting: null,
  participants: [],
  messages: [],
  unreadMessages: 0,
  
  // Local media state
  localStream: null,
  isAudioOn: true,
  isVideoOn: true,
  isScreenSharing: false,
  
  // Remote streams
  remoteStreams: {}, // { userId: stream }
  
  // Peer connections
  peerConnections: {}, // { userId: RTCPeerConnection }
  
  // Participant media states
  participantMediaStates: {}, // { userId: { isVideoOn: boolean, isAudioOn: boolean } }
  
  // ICE servers
  iceServers: [],
  
  // Actions
  setCurrentMeeting: (meeting) => set({ currentMeeting: meeting }),
  
  setParticipants: (participants) => set({ participants }),
  
  addParticipant: (participant) =>
    set((state) => {
      // Check if participant already exists
      const exists = state.participants.some(
        (p) => p.userId === participant.userId || p.userId?._id === participant.userId
      );
      if (exists) {
        return state; // Don't add duplicate
      }
      return {
        participants: [...state.participants, participant],
      };
    }),
  
  removeParticipant: (userId) =>
    set((state) => ({
      participants: state.participants.filter(
        (p) => p.userId !== userId && p.userId?._id !== userId
      ),
    })),
  
  setLocalStream: (stream) => set({ localStream: stream }),
  
  setIsAudioOn: (isOn) => set({ isAudioOn: isOn }),
  
  setIsVideoOn: (isOn) => set({ isVideoOn: isOn }),
  
  setIsScreenSharing: (isSharing) => set({ isScreenSharing: isSharing }),
  
  setParticipantVideoState: (userId, isVideoOn) =>
    set((state) => ({
      participantMediaStates: {
        ...state.participantMediaStates,
        [userId]: {
          ...state.participantMediaStates[userId],
          isVideoOn: isVideoOn
        }
      }
    })),
  
  setParticipantAudioState: (userId, isAudioOn) =>
    set((state) => ({
      participantMediaStates: {
        ...state.participantMediaStates,
        [userId]: {
          ...state.participantMediaStates[userId],
          isAudioOn: isAudioOn
        }
      }
    })),
  
  addRemoteStream: (userId, stream) =>
    set((state) => ({
      remoteStreams: { ...state.remoteStreams, [userId]: stream },
    })),
  
  removeRemoteStream: (userId) =>
    set((state) => {
      const newStreams = { ...state.remoteStreams };
      delete newStreams[userId];
      return { remoteStreams: newStreams };
    }),
  
  addPeerConnection: (userId, pc) =>
    set((state) => ({
      peerConnections: { ...state.peerConnections, [userId]: pc },
    })),
  
  removePeerConnection: (userId) =>
    set((state) => {
      const newConnections = { ...state.peerConnections };
      delete newConnections[userId];
      return { peerConnections: newConnections };
    }),
  
  addMessage: (message) =>
    set((state) => {
      // Check if message already exists (by _id)
      const exists = state.messages.some((m) => m._id === message._id);
      if (exists) {
        return state; // Don't add duplicate
      }
      
      // If this is a real message (from server) and we have a temp message with same content and sender
      // from within last 5 seconds, replace the temp message
      if (!message._id.startsWith('temp-')) {
        const now = new Date(message.createdAt).getTime();
        const filteredMessages = state.messages.filter((m) => {
          if (!m._id.startsWith('temp-')) return true; // Keep all real messages
          
          // Remove temp message if it matches content, sender, and is recent
          const tempTime = new Date(m.createdAt).getTime();
          const isRecent = (now - tempTime) < 5000; // Within 5 seconds
          const sameContent = m.content === message.content;
          const sameSender = m.sender._id === message.sender._id;
          
          return !(isRecent && sameContent && sameSender); // Remove if all match
        });
        
        return {
          messages: [...filteredMessages, message],
        };
      }
      
      // Just add the message (optimistic or unique)
      return {
        messages: [...state.messages, message],
      };
    }),
  
  incrementUnreadMessages: () =>
    set((state) => ({
      unreadMessages: state.unreadMessages + 1,
    })),
  
  setMessages: (messages) => set({ messages }),
  
  resetUnreadMessages: () => set({ unreadMessages: 0 }),
  
  setIceServers: (servers) => set({ iceServers: servers }),
  
  // Reset store
  resetMeeting: () =>
    set({
      currentMeeting: null,
      participants: [],
      messages: [],
      unreadMessages: 0,
      localStream: null,
      isAudioOn: true,
      isVideoOn: true,
      isScreenSharing: false,
      remoteStreams: {},
      peerConnections: {},
      participantMediaStates: {},
    }),
}));