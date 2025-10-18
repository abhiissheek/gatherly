import { useEffect, useRef } from "react";
import { User, Mic, MicOff } from "lucide-react";
import { useMeetingStore } from "../store/useMeetingStore";

const VideoTile = ({ stream, userName, userId, isLocal = false, isVideoOn = true, isAudioOn = true, className = "" }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`relative bg-base-300 rounded-lg overflow-hidden ${className}`}>
      {isVideoOn && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal ? 'mirror' : ''}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="avatar placeholder">
            <div className="bg-neutral text-neutral-content rounded-full w-16 md:w-24">
              <User size={32} className="md:w-12 md:h-12" />
            </div>
          </div>
        </div>
      )}
      
      {/* Mic status indicator */}
      <div className="absolute top-2 right-2 bg-base-100/90 p-1 rounded-full shadow-lg">
        {isAudioOn ? (
          <Mic size={16} className="text-white" />
        ) : (
          <MicOff size={16} className="text-red-500" />
        )}
      </div>
      
      <div className="absolute bottom-2 left-2 bg-base-100/90 px-2 py-1 rounded-md shadow-lg">
        <span className="text-xs md:text-sm font-medium">
          {isLocal ? "You" : userName}
        </span>
      </div>
    </div>
  );
};

const VideoGrid = ({ 
  localVideoRef, 
  remoteStreams, 
  participants, 
  isVideoOn,
  isAudioOn,
  authUser,
  screenShareStream = null,
  screenShareUserId = null 
}) => {
  console.log("VideoGrid props:", { localVideoRef, remoteStreams, participants, isVideoOn, isAudioOn, authUser, screenShareStream, screenShareUserId });
  const totalParticipants = Object.keys(remoteStreams).length + 1;
  const localStreamRef = useRef(null);
  const { participantMediaStates } = useMeetingStore();
  
  // Dynamic grid layout calculation for optimal display
  const getGridLayout = () => {
    const count = totalParticipants;
    
    // Calculate optimal grid dimensions
    if (count === 1) return { cols: 1, rows: 1, colClass: "grid-cols-1", rowClass: "grid-rows-1" };
    if (count === 2) return { cols: 2, rows: 1, colClass: "grid-cols-2", rowClass: "grid-rows-1" };
    if (count <= 4) return { cols: 2, rows: 2, colClass: "grid-cols-2", rowClass: "grid-rows-2" };
    if (count <= 6) return { cols: 3, rows: 2, colClass: "grid-cols-3", rowClass: "grid-rows-2" };
    if (count <= 9) return { cols: 3, rows: 3, colClass: "grid-cols-3", rowClass: "grid-rows-3" };
    if (count <= 12) return { cols: 4, rows: 3, colClass: "grid-cols-4", rowClass: "grid-rows-3" };
    if (count <= 16) return { cols: 4, rows: 4, colClass: "grid-cols-4", rowClass: "grid-rows-4" };
    
    // For more than 16, use 4x4 and show indicator
    return { cols: 4, rows: 4, colClass: "grid-cols-4", rowClass: "grid-rows-4" };
  };
  
  const gridLayout = getGridLayout();
  console.log("Grid layout:", gridLayout, "Total participants:", totalParticipants);
  const isOdd = totalParticipants % 2 === 1;
  const shouldCenterLast = isOdd && totalParticipants > 1;
  
  // Create an array of all participants including local user
  const allParticipants = [
    { id: 'local', isLocal: true },
    ...Object.keys(remoteStreams).map(userId => ({ id: userId, isLocal: false }))
  ];
  console.log("All participants:", allParticipants);

  // If screen is being shared, use sidebar layout
  if (screenShareStream) {
    return (
      <div className="flex gap-4 h-full">
        {/* Main screen share area */}
        <div className="flex-1 relative bg-base-300 rounded-lg overflow-hidden">
          <video
            ref={(ref) => {
              if (ref) ref.srcObject = screenShareStream;
            }}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
          <div className="absolute bottom-4 left-4 bg-base-100/90 px-4 py-2 rounded-md shadow-lg">
            <span className="text-sm font-medium">
              {screenShareUserId === authUser?._id 
                ? "You are presenting" 
                : `${participants.find(p => p.userId === screenShareUserId)?.userName || 'Someone'} is presenting`}
            </span>
          </div>
        </div>

        {/* Sidebar with participant thumbnails */}
        <div className="w-64 flex flex-col gap-2 overflow-y-auto">
          {/* Local video thumbnail */}
          <div className="relative bg-base-300 rounded-lg overflow-hidden aspect-video flex-shrink-0">
            {isVideoOn ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="avatar placeholder">
                  <div className="bg-primary text-primary-content rounded-full w-12">
                    <User size={24} />
                  </div>
                </div>
              </div>
            )}
            {/* Mic status indicator for local participant in screen share mode */}
            <div className="absolute top-1 right-1 bg-base-100/90 p-1 rounded-full">
              {isAudioOn ? (
                <Mic size={12} className="text-white" />
              ) : (
                <MicOff size={12} className="text-red-500" />
              )}
            </div>
            <div className="absolute bottom-1 left-1 bg-base-100/90 px-2 py-0.5 rounded">
              <span className="text-xs font-medium">You</span>
            </div>
          </div>

          {/* Remote video thumbnails */}
          {Object.entries(remoteStreams).map(([userId, stream]) => {
            const participant = participants.find((p) => p.userId === userId);
            // Get participant video state, default to true if not set
            const isParticipantVideoOn = participantMediaStates[userId]?.isVideoOn !== false;
            // Get participant audio state, default to true if not set
            const isParticipantAudioOn = participantMediaStates[userId]?.isAudioOn !== false;
            return (
              <div key={userId} className="relative bg-base-300 rounded-lg overflow-hidden aspect-video flex-shrink-0">
                {isParticipantVideoOn && stream ? (
                  <video
                    ref={(ref) => {
                      if (ref) ref.srcObject = stream;
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content rounded-full w-12">
                        <User size={24} />
                      </div>
                    </div>
                  </div>
                )}
                {/* Mic status indicator for remote participant in screen share mode */}
                <div className="absolute top-1 right-1 bg-base-100/90 p-1 rounded-full">
                  {isParticipantAudioOn ? (
                    <Mic size={12} className="text-white" />
                  ) : (
                    <MicOff size={12} className="text-red-500" />
                  )}
                </div>
                <div className="absolute bottom-1 left-1 bg-base-100/90 px-2 py-0.5 rounded">
                  <span className="text-xs font-medium">
                    {participant?.userName || "Participant"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Normal grid layout (no screen share)
  return (
    <div className="h-full w-full p-4 overflow-hidden">
      <div 
        className={`grid ${gridLayout.colClass} ${gridLayout.rowClass} gap-2 w-full h-full`}
        style={{ 
          height: '100%',
          gridAutoRows: '1fr'
        }}
      >
        {allParticipants.map((participant, index) => {
          // For local participant
          if (participant.isLocal) {
            return (
              <div 
                key="local" 
                className="relative bg-slate-800 rounded-lg overflow-hidden"
                style={{ minHeight: '150px' }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  {isVideoOn ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-700">
                      <div className="bg-teal-600 text-white rounded-full w-16 h-16 flex items-center justify-center">
                        <User size={32} />
                      </div>
                    </div>
                  )}
                </div>
                {/* Mic status indicator for local participant */}
                <div className="absolute top-2 right-2 bg-slate-900/80 p-1 rounded-full">
                  {isAudioOn ? (
                    <Mic size={16} className="text-white" />
                  ) : (
                    <MicOff size={16} className="text-red-500" />
                  )}
                </div>
                <div className="absolute bottom-2 left-2 bg-slate-900/80 px-3 py-1 rounded-md">
                  <span className="text-sm font-medium text-white">You</span>
                </div>
              </div>
            );
          }
          
          // For remote participants
          const userId = participant.id;
          const stream = remoteStreams[userId];
          const participantData = participants.find((p) => p.userId === userId || p.userId?._id === userId);
          // Get participant video state, default to true if not set
          const isParticipantVideoOn = participantMediaStates[userId]?.isVideoOn !== false;
          // Get participant audio state, default to true if not set
          const isParticipantAudioOn = participantMediaStates[userId]?.isAudioOn !== false;
          
          // Check if this is the last item and we need to center it
          const isLastItem = index === allParticipants.length - 1;
          const centerLastItem = shouldCenterLast && isLastItem;
          
          // Calculate the center column based on grid layout
          const centerColumn = Math.ceil(gridLayout.cols / 2);
          const centeredColumnStyle = centerLastItem ? { gridColumnStart: centerColumn } : {};
          
          return (
            <div 
              key={userId} 
              className="relative bg-slate-800 rounded-lg overflow-hidden"
              style={{ ...centeredColumnStyle, minHeight: '150px' }}
            >
              <div className="w-full h-full flex items-center justify-center">
                {isParticipantVideoOn && stream ? (
                  <video
                    ref={(ref) => {
                      if (ref && ref.srcObject !== stream) {
                        ref.srcObject = stream;
                      }
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-700">
                    <div className="bg-slate-600 text-white rounded-full w-16 h-16 flex items-center justify-center">
                      <User size={32} />
                    </div>
                  </div>
                )}
              </div>
              {/* Mic status indicator for remote participant */}
              <div className="absolute top-2 right-2 bg-slate-900/80 p-1 rounded-full">
                {isParticipantAudioOn ? (
                  <Mic size={16} className="text-white" />
                ) : (
                  <MicOff size={16} className="text-red-500" />
                )}
              </div>
              <div className="absolute bottom-2 left-2 bg-slate-900/80 px-3 py-1 rounded-md">
                <span className="text-sm font-medium text-white">
                  {participantData?.userName || "Participant"}
                </span>
              </div>
            </div>
          );
        })}
        
        {/* Show indicator if there are more than 16 participants */}
        {totalParticipants > 16 && (
          <div className="relative bg-slate-800 rounded-lg overflow-hidden" style={{ minHeight: '150px' }}>
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-3xl font-bold mb-2">+{totalParticipants - 16}</div>
                <div className="text-sm opacity-75">More participants</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoGrid;