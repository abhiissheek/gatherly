import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  MessageSquare,
  Users,
  X,
  AlertCircle,
  Phone,
} from "lucide-react";
import toast from "react-hot-toast";
import { useMeetingStore } from "../store/useMeetingStore";
import { getSocket, initializeSocket } from "../lib/socket";
import {
  createPeerConnection,
  getMediaStream,
  getDisplayStream,
  stopMediaStream,
  toggleAudioTrack,
  toggleVideoTrack,
  createOffer,
  createAnswer,
  handleAnswer,
  handleIceCandidate,
  replaceVideoTrack,
} from "../lib/webrtc";
import { getMeeting, endMeeting, getIceServers } from "../lib/meetingApi";
import useAuthUser from "../hooks/useAuthUser";
import VideoGrid from "../components/VideoGrid";
import ChatPanel from "../components/ChatPanel";
import ParticipantsPanel from "../components/ParticipantsPanel";
import ConfirmModal from "../components/ConfirmModal";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

const MeetingPage = () => {
  const { id: meetingId } = useParams();
  const navigate = useNavigate();
  const { authUser } = useAuthUser();
  
  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const lastLeftEventRef = useRef({}); // Track last leave event per user
  
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showLeaveMeetingModal, setShowLeaveMeetingModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [screenShareStream, setScreenShareStream] = useState(null);
  const [screenShareUserId, setScreenShareUserId] = useState(null);

  // Play notification sound
  const playSound = (type) => {
    try {
      const audio = new Audio();
      if (type === 'join') {
        // Simple beep for join
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZTR';
      } else if (type === 'leave') {
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZTR';
      } else if (type === 'message') {
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZTR';
      }
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Sound play failed:', e));
    } catch (error) {
      console.log('Sound error:', error);
    }
  };

  const {
    currentMeeting,
    setCurrentMeeting,
    localStream,
    setLocalStream,
    isAudioOn,
    isVideoOn,
    isScreenSharing,
    setIsAudioOn,
    setIsVideoOn,
    setIsScreenSharing,
    participants,
    setParticipants,
    addParticipant,
    removeParticipant,
    remoteStreams,
    addRemoteStream,
    removeRemoteStream,
    peerConnections,
    addPeerConnection,
    removePeerConnection,
    iceServers,
    setIceServers,
    resetMeeting,
    unreadMessages,
    resetUnreadMessages,
    incrementUnreadMessages,
    addMessage,
  } = useMeetingStore();

  // Keep local video ref synced with localStream
  useEffect(() => {
    console.log("useEffect triggered - localStream:", localStream, "isVideoOn:", isVideoOn);
    if (localVideoRef.current && localStream) {
      console.log("Setting local video srcObject");
      localVideoRef.current.srcObject = localStream;
    } else {
      console.log("Not setting local video srcObject - localVideoRef.current:", localVideoRef.current, "localStream:", localStream);
    }
  }, [localStream, isVideoOn]);

  // Handle chat messages with proper showChat dependency
  useEffect(() => {
    if (!socketRef.current) return;

    const handleChatMessage = (message) => {
      addMessage(message);
      
      // Increment unread count only if:
      // 1. Chat is not open
      // 2. Message is from someone else
      if (!showChat && message.sender._id !== authUser._id) {
        incrementUnreadMessages();
      }
      
      // Play sound for messages from others
      if (message.sender._id !== authUser._id) {
        playSound('message');
      }
    };

    socketRef.current.on("chat-message", handleChatMessage);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("chat-message", handleChatMessage);
      }
    };
  }, [showChat, authUser._id, addMessage, incrementUnreadMessages]);

  // Initialize meeting
  useEffect(() => {
    const initMeeting = async () => {
      try {
        console.log("Initializing meeting with ID:", meetingId);
        // Get meeting details
        const meetingData = await getMeeting(meetingId);
        console.log("Meeting data received:", meetingData);
        setCurrentMeeting(meetingData.meeting);

        // Get ICE servers
        const iceData = await getIceServers();
        console.log("ICE servers received:", iceData);
        setIceServers(iceData.iceServers || []);

        // Get local media stream
        console.log("Getting local media stream");
        const stream = await getMediaStream();
        console.log("Local media stream received:", stream);
        setLocalStream(stream);

        if (localVideoRef.current) {
          console.log("Setting local video ref srcObject");
          localVideoRef.current.srcObject = stream;
        } else {
          console.log("localVideoRef.current is null");
        }

        // Initialize socket
        console.log("Initializing socket");
        socketRef.current = initializeSocket();
        setupSocketListeners();

        // Join meeting room
        console.log("Joining meeting room");
        socketRef.current.emit("join-meeting", {
          meetingId,
          userId: authUser._id,
          userName: authUser.fullName,
        });

        setIsLoading(false);
        console.log("Meeting initialization complete");
      } catch (error) {
        console.error("Error initializing meeting:", error);
        toast.error("Failed to join meeting");
        navigate("/");
      }
    };

    initMeeting();

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up meeting");
      if (localStream) {
        stopMediaStream(localStream);
      }
      
      // Close all peer connections
      Object.values(peerConnections).forEach((pc) => {
        pc.close();
      });

      // Remove all socket listeners
      if (socketRef.current) {
        socketRef.current.off("user-joined");
        socketRef.current.off("user-left");
        socketRef.current.off("offer");
        socketRef.current.off("answer");
        socketRef.current.off("ice-candidate");
        socketRef.current.off("meeting-participants");
        socketRef.current.off("user-audio-toggled");
        socketRef.current.off("user-video-toggled");
        socketRef.current.off("screen-share-started");
        socketRef.current.off("screen-share-stopped");

        // Leave meeting
        socketRef.current.emit("leave-meeting", {
          meetingId,
          userId: authUser._id,
        });
      }

      resetMeeting();
    };
  }, [meetingId]);

  // Setup socket event listeners
  const setupSocketListeners = () => {
    const socket = socketRef.current;

    // Remove any existing listeners first to prevent duplicates
    socket.off("user-joined");
    socket.off("user-left");
    socket.off("offer");
    socket.off("answer");
    socket.off("ice-candidate");
    socket.off("meeting-participants");
    socket.off("user-audio-toggled");
    socket.off("user-video-toggled");
    socket.off("screen-share-started");
    socket.off("screen-share-stopped");

    // User joined
    socket.on("user-joined", async ({ userId, userName, socketId, permissions }) => {
      console.log("User joined:", userName, userId);
      
      // Don't add yourself
      if (userId === authUser._id) {
        console.log("Skipping self-join event");
        return;
      }
      
      // Use store's getter to check current participants (not stale closure)
      const currentParticipants = useMeetingStore.getState().participants;
      const alreadyExists = currentParticipants.some(
        p => p.userId === userId || p.userId?._id === userId
      );
      
      if (!alreadyExists) {
        addParticipant({ userId, userName, permissions });
        // Only show toast and play sound for new participants
        toast.success(`${userName} joined the meeting`);
        playSound('join');
        
        // Create peer connection for new user
        await createPeerConnectionForUser(userId);
      } else {
        console.log("Participant already exists, skipping duplicate join");
      }
    });

    // User left
    socket.on("user-left", ({ userId, userName }) => {
      console.log("User left event received:", userId, userName);
      
      // Prevent duplicate notifications within 1 second
      const now = Date.now();
      if (lastLeftEventRef.current[userId] && (now - lastLeftEventRef.current[userId]) < 1000) {
        console.log("Duplicate leave event detected, ignoring");
        return;
      }
      lastLeftEventRef.current[userId] = now;
      
      // Get participant name from store before removing
      const currentParticipants = useMeetingStore.getState().participants;
      const leavingParticipant = currentParticipants.find(
        p => p.userId === userId || p.userId?._id === userId
      );
      
      // Only show notification if participant exists (prevents duplicates)
      if (leavingParticipant) {
        const participantName = userName || leavingParticipant.userName || 'A participant';
        
        // Show toast notification
        toast.error(`${participantName} left the meeting`);
        
        // Play leave sound
        playSound('leave');
      }
      
      removeParticipant(userId);
      removeRemoteStream(userId);
      
      // Close peer connection
      const pc = peerConnections[userId];
      if (pc) {
        pc.close();
        removePeerConnection(userId);
      }
      
      // Clean up the timestamp after 2 seconds
      setTimeout(() => {
        delete lastLeftEventRef.current[userId];
      }, 2000);
    });

    // Receive WebRTC offer
    socket.on("offer", async ({ offer, fromUserId }) => {
      console.log("Received offer from:", fromUserId);
      // For incoming offers, we always need to create/ensure a peer connection exists
      let pc;
      const currentPeerConnections = useMeetingStore.getState().peerConnections;
      if (currentPeerConnections[fromUserId]) {
        pc = currentPeerConnections[fromUserId];
      } else {
        // Create peer connection if it doesn't exist
        pc = await createPeerConnectionForUser(fromUserId);
      }
      
      const answer = await createAnswer(pc, offer);
      
      socket.emit("answer", {
        meetingId,
        answer,
        targetUserId: fromUserId,
        fromUserId: authUser._id,
      });
    });

    // Receive WebRTC answer
    socket.on("answer", async ({ answer, fromUserId }) => {
      console.log("✅ Received answer from:", fromUserId);
      // Get fresh peerConnections from store
      const currentPeerConnections = useMeetingStore.getState().peerConnections;
      const pc = currentPeerConnections[fromUserId];
      if (pc) {
        console.log("Setting remote description for:", fromUserId);
        await handleAnswer(pc, answer);
        console.log("✅ Remote description set successfully for:", fromUserId);
      } else {
        console.error("❌ No peer connection found for:", fromUserId);
      }
    });

    // Receive ICE candidate
    socket.on("ice-candidate", async ({ candidate, fromUserId }) => {
      console.log("✅ Received ICE candidate from:", fromUserId);
      // Get fresh peerConnections from store
      const currentPeerConnections = useMeetingStore.getState().peerConnections;
      const pc = currentPeerConnections[fromUserId];
      if (pc && candidate) {
        console.log("Adding ICE candidate for:", fromUserId);
        await handleIceCandidate(pc, candidate);
      } else if (!pc) {
        // Try to create peer connection if it doesn't exist
        console.log("No peer connection found for ICE candidate from:", fromUserId, " - attempting to create");
        await createPeerConnectionForUser(fromUserId);
        // Try again with the new connection
        const newPeerConnections = useMeetingStore.getState().peerConnections;
        const newPc = newPeerConnections[fromUserId];
        if (newPc && candidate) {
          await handleIceCandidate(newPc, candidate);
        }
      }
    });

    // Meeting participants list
    socket.on("meeting-participants", async ({ participants }) => {
      console.log("Received participants list:", participants);
      // Transform participants data to match expected format
      const formattedParticipants = participants.map(p => ({
        userId: p.userId._id || p.userId,
        userName: p.userId.fullName || p.userName,
        profilePic: p.userId.profilePic,
        permissions: p.permissions,
        role: p.role
      }));
      setParticipants(formattedParticipants);
      
      // CRITICAL: Wait a bit to ensure local stream is ready
      // Create peer connections with all existing participants AFTER local stream is set
      setTimeout(async () => {
        const currentLocalStream = useMeetingStore.getState().localStream;
        
        if (!currentLocalStream) {
          console.error("Local stream still not available after delay, retrying...");
          // Retry after another delay
          setTimeout(async () => {
            await createConnectionsWithParticipants(formattedParticipants);
          }, 1000);
          return;
        }
        
        await createConnectionsWithParticipants(formattedParticipants);
      }, 500);
    });
    
    // Helper function to create connections with participants
    const createConnectionsWithParticipants = async (participants) => {
      for (const participant of participants) {
        const participantId = participant.userId;
        // Don't create connection with yourself
        if (participantId !== authUser._id) {
          console.log("Creating peer connection with existing participant:", participantId);
          await createPeerConnectionForUser(participantId);
        }
      }
    };

    // Media toggle events
    socket.on("user-audio-toggled", ({ userId, isAudioOn }) => {
      console.log(`User ${userId} ${isAudioOn ? "unmuted" : "muted"}`);
      // Update participant audio state
      useMeetingStore.getState().setParticipantAudioState(userId, isAudioOn);
    });

    socket.on("user-video-toggled", ({ userId, isVideoOn }) => {
      console.log(`User ${userId} ${isVideoOn ? "enabled" : "disabled"} video`);
      // Update participant video state
      useMeetingStore.getState().setParticipantVideoState(userId, isVideoOn);
    });

    // Screen share events
    socket.on("screen-share-started", ({ userId }) => {
      console.log(`User ${userId} started screen sharing`);
      setScreenShareUserId(userId);
      toast.info(`${participants.find(p => p.userId === userId)?.userName || 'Someone'} started sharing screen`);
    });

    socket.on("screen-share-stopped", ({ userId }) => {
      console.log(`User ${userId} stopped screen sharing`);
      if (screenShareUserId === userId) {
        setScreenShareUserId(null);
        setScreenShareStream(null);
      }
      toast.info(`Screen sharing stopped`);
    });
  };

  // Setup socket listeners when socketRef changes
  useEffect(() => {
    if (socketRef.current) {
      setupSocketListeners();
    }
  }, [socketRef.current]);

  // Create peer connection for a user
  const createPeerConnectionForUser = async (userId) => {
    // Get fresh peerConnections from store
    const currentPeerConnections = useMeetingStore.getState().peerConnections;
    
    // Check if peer connection already exists
    if (currentPeerConnections[userId]) {
      console.log("Peer connection already exists for:", userId);
      return currentPeerConnections[userId];
    }

    console.log("Creating new peer connection for:", userId);
    const pc = createPeerConnection(iceServers);

    // Add local stream tracks FIRST before setting up handlers
    if (localStream) {
      console.log("Adding local tracks to peer connection for:", userId);
      localStream.getTracks().forEach((track) => {
        console.log("Adding track:", track.kind, "to peer connection");
        pc.addTrack(track, localStream);
      });
    } else {
      // Try to get from store if not in closure
      const currentLocalStream = useMeetingStore.getState().localStream;
      if (currentLocalStream) {
        console.log("Adding local tracks from store to peer connection for:", userId);
        currentLocalStream.getTracks().forEach((track) => {
          console.log("Adding track:", track.kind, "to peer connection");
          pc.addTrack(track, currentLocalStream);
        });
      } else {
        console.error("❌ No local stream available! Cannot add tracks to peer connection.");
        console.error("This peer connection will not send video/audio.");
      }
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate to:", userId);
        socketRef.current.emit("ice-candidate", {
          meetingId,
          candidate: event.candidate,
          targetUserId: userId,
          fromUserId: authUser._id,
        });
      }
    };

    // Handle remote stream - THIS IS CRITICAL!
    pc.ontrack = (event) => {
      console.log("✅ Received remote track from:", userId, "Kind:", event.track.kind);
      console.log("Remote stream:", event.streams[0]);
      addRemoteStream(userId, event.streams[0]);
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${userId}:`, pc.connectionState);
      
      if (pc.connectionState === "connected") {
        console.log(`✅ Successfully connected to ${userId}`);
      } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        console.log(`❌ Peer connection ${pc.connectionState} for user ${userId}`);
        // Try to reconnect
        setTimeout(() => {
          console.log(`Attempting to reconnect to ${userId}`);
          createPeerConnectionForUser(userId);
        }, 3000);
      }
    };

    // Add to store BEFORE creating offer
    addPeerConnection(userId, pc);

    // Create and send offer ONLY if we initiated the connection
    // In a mesh network, we need to determine who creates the offer
    // We'll use userId comparison to decide who initiates
    if (authUser._id < userId) {
      console.log("Creating offer for:", userId);
      try {
        const offer = await createOffer(pc);
        console.log("Sending offer to:", userId);
        socketRef.current.emit("offer", {
          meetingId,
          offer,
          targetUserId: userId,
          fromUserId: authUser._id,
        });
      } catch (error) {
        console.error("Error creating/sending offer to", userId, error);
      }
    }

    return pc;
  };

  // Toggle audio
  const handleToggleAudio = () => {
    if (localStream) {
      const newState = !isAudioOn;
      toggleAudioTrack(localStream, newState);
      setIsAudioOn(newState);
      
      socketRef.current.emit("toggle-audio", {
        meetingId,
        userId: authUser._id,
        isAudioOn: newState,
      });
      
      // Broadcast the change to all peers
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        Object.values(peerConnections).forEach((pc) => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'audio');
          if (sender && sender.track) {
            sender.track.enabled = newState;
          }
        });
      }
    }
  };

  // Toggle video
  const handleToggleVideo = () => {
    if (localStream) {
      const newState = !isVideoOn;
      toggleVideoTrack(localStream, newState);
      setIsVideoOn(newState);
      
      socketRef.current.emit("toggle-video", {
        meetingId,
        userId: authUser._id,
        isVideoOn: newState,
      });
      
      // Broadcast the change to all peers
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        Object.values(peerConnections).forEach((pc) => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender && sender.track) {
            sender.track.enabled = newState;
          }
        });
      }
    }
  };

  // Toggle screen sharing
  const handleToggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const screenStream = await getDisplayStream();
        const screenTrack = screenStream.getVideoTracks()[0];

        // Set screen share stream for local display
        setScreenShareStream(screenStream);
        setScreenShareUserId(authUser._id);

        // Replace video track in all peer connections
        Object.values(peerConnections).forEach((pc) => {
          replaceVideoTrack(pc, screenTrack);
        });

        // Handle screen share stop
        screenTrack.onended = () => {
          handleStopScreenShare();
        };

        setIsScreenSharing(true);
        
        socketRef.current.emit("screen-share-start", {
          meetingId,
          userId: authUser._id,
        });

        toast.success("Screen sharing started");
      } else {
        handleStopScreenShare();
      }
    } catch (error) {
      console.error("Screen share error:", error);
      toast.error("Failed to start screen sharing");
    }
  };

  const handleStopScreenShare = async () => {
    // Get camera stream again
    const cameraStream = await getMediaStream({ video: true, audio: isAudioOn });
    const cameraTrack = cameraStream.getVideoTracks()[0];

    // Replace track back to camera
    Object.values(peerConnections).forEach((pc) => {
      replaceVideoTrack(pc, cameraTrack);
    });

    // Update local stream
    setLocalStream(cameraStream);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = cameraStream;
    }

    // Clear screen share state
    setScreenShareStream(null);
    setScreenShareUserId(null);
    setIsScreenSharing(false);
    
    socketRef.current.emit("screen-share-stop", {
      meetingId,
      userId: authUser._id,
    });

    toast.success("Screen sharing stopped");
  };

  // Leave meeting
  const handleLeaveMeeting = async () => {
    try {
      // Stop local stream
      if (localStream) {
        stopMediaStream(localStream);
      }

      // Close peer connections
      Object.values(peerConnections).forEach((pc) => {
        pc.close();
      });

      // Emit leave event
      socketRef.current.emit("leave-meeting", {
        meetingId,
        userId: authUser._id,
      });

      navigate("/");
    } catch (error) {
      console.error("Error leaving meeting:", error);
      navigate("/");
    }
  };

  // End meeting (admin only)
  const handleEndMeeting = async () => {
    try {
      await endMeeting(meetingId);
      toast.success("Meeting ended");
      navigate("/");
    } catch (error) {
      toast.error("Failed to end meeting");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-white">Joining meeting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm p-4 border-b border-teal-700/30">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">{currentMeeting?.title || "Meeting"}</h1>
            <p className="text-sm text-slate-400">
              {participants.filter((p) => p.userId?._id !== authUser._id && p.userId !== authUser._id).length + 1} participant{participants.filter((p) => p.userId?._id !== authUser._id && p.userId !== authUser._id).length !== 0 ? "s" : ""}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowParticipants(!showParticipants)}
              variant="outline"
              size="icon"
              className={`border-teal-600 ${showParticipants ? 'bg-teal-700/20 text-teal-400' : 'text-teal-400 hover:bg-teal-700/20'}`}
            >
              <Users size={20} />
            </Button>
            <Button
              onClick={() => {
                setShowChat(!showChat);
                if (!showChat) {
                  resetUnreadMessages();
                }
              }}
              variant="outline"
              size="icon"
              className={`border-teal-600 relative ${showChat ? 'bg-teal-700/20 text-teal-400' : 'text-teal-400 hover:bg-teal-700/20'}`}
            >
              <MessageSquare size={20} />
              {!showChat && unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video grid */}
        <div className="flex-1">
          <VideoGrid
            localVideoRef={localVideoRef}
            remoteStreams={remoteStreams}
            participants={participants}
            isVideoOn={isVideoOn}
            isAudioOn={isAudioOn}
            authUser={authUser}
            screenShareStream={screenShareStream}
            screenShareUserId={screenShareUserId}
          />
        </div>

        {/* Side panels */}
        {showParticipants && (
          <ParticipantsPanel
            participants={participants}
            currentUserId={authUser._id}
            meetingCreatorId={currentMeeting?.creator?._id}
            onClose={() => setShowParticipants(false)}
          />
        )}
        
        {showChat && (
          <ChatPanel
            meetingId={meetingId}
            socket={socketRef.current}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>

      {/* Controls */}
      <div className="border-t border-teal-700/30 bg-slate-800/80 backdrop-blur-sm px-6 py-4 flex items-center justify-center gap-4">
        <Button
          onClick={handleToggleAudio}
          variant={isAudioOn ? "outline" : "destructive"}
          size="lg"
          className={`rounded-full w-14 h-14 p-0 ${isAudioOn ? 'border-teal-600 text-teal-400 hover:bg-teal-700/20' : ''}`}
        >
          {isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </Button>
        <Button
          onClick={handleToggleVideo}
          variant={isVideoOn ? "outline" : "destructive"}
          size="lg"
          className={`rounded-full w-14 h-14 p-0 ${isVideoOn ? 'border-teal-600 text-teal-400 hover:bg-teal-700/20' : ''}`}
        >
          {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </Button>
        <Button
          onClick={handleToggleScreenShare}
          variant={isScreenSharing ? "default" : "outline"}
          size="lg"
          className={`rounded-full w-14 h-14 p-0 flex items-center justify-center ${isScreenSharing ? 'bg-teal-600 hover:bg-teal-700' : 'border-teal-600 text-teal-400 hover:bg-teal-700/20'}`}
        >
          <img 
            src="/screen-share.svg" 
            alt="Screen Share" 
            className={`w-6 h-6 ${isScreenSharing ? 'brightness-0 invert' : ''}`}
          />
        </Button>
        <Button
          onClick={() => setShowLeaveMeetingModal(true)}
          variant="destructive"
          size="lg"
          className="rounded-full w-14 h-14 p-0"
        >
          <Phone className="w-6 h-6" />
        </Button>
      </div>

      {/* Leave Meeting Confirmation Modal */}
      <ConfirmModal
        isOpen={showLeaveMeetingModal}
        onClose={() => setShowLeaveMeetingModal(false)}
        onConfirm={handleLeaveMeeting}
        title="Leave Meeting"
        message="Are you sure you want to leave this meeting? You can rejoin anytime with the meeting ID."
        confirmText="Leave Meeting"
        cancelText="Stay"
        type="danger"
      />
    </div>
  );
};

export default MeetingPage;
