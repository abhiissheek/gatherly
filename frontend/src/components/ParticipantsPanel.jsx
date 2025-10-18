import { X, User, Crown, MicOff, VideoOff } from "lucide-react";

const ParticipantsPanel = ({ participants, currentUserId, meetingCreatorId, onClose }) => {
  const isAdmin = currentUserId === meetingCreatorId;
  
  // Filter out current user from participants list
  const otherParticipants = participants.filter(
    (p) => p.userId?._id !== currentUserId && p.userId !== currentUserId
  );

  return (
    <div className="w-80 border-l border-teal-700/30 bg-slate-800/80 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-teal-700/30 flex items-center justify-between">
        <h2 className="font-semibold text-white">Participants</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Participants list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Current user */}
        <div className="flex items-center justify-between p-3 bg-teal-700/20 rounded-lg border border-teal-700/30">
          <span className="text-sm font-medium text-white">
            You {currentUserId === meetingCreatorId && '(Host)'}
          </span>
        </div>

        {/* Other participants */}
        {otherParticipants.map((participant) => {
          const participantId = participant.userId?._id || participant.userId;
          const isHost = participantId === meetingCreatorId;
          
          return (
            <div
              key={participant.userId}
              className="flex items-center justify-between p-3 bg-teal-700/20 rounded-lg border border-teal-700/30"
            >
              <span className="text-sm font-medium text-white">
                {participant.userName} {isHost && '(Host)'}
              </span>
              <div className="flex gap-2">
                {/* Add audio/video indicators if available */}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ParticipantsPanel;
