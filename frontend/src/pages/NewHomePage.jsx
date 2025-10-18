import { useState } from "react";
import { useNavigate } from "react-router";
import { Calendar, Clock, LogOut, Link2, Copy, Check, Trash2, Bell } from "lucide-react";
import toast from "react-hot-toast";
import { createMeeting, scheduleMeeting, getUpcomingMeetings, deleteMeeting } from "../lib/meetingApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthUser from "../hooks/useAuthUser";
import { axiosInstance } from "../lib/axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import ConfirmModal from "../components/ConfirmModal";

const NewHomePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState({ id: null, title: null });
  const [joinMeetingId, setJoinMeetingId] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [meetingForm, setMeetingForm] = useState({
    title: "",
    description: "",
    scheduledAt: new Date().toISOString().split('T')[0] + "T11:00", // Set default time to 11:00
    duration: 60,
    reminder: true, // Default to true for reminders
  });

  // Logout handler
  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
      toast.success("Logged out successfully");
      window.location.href = "/login";
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  // Fetch upcoming meetings
  const { data: upcomingMeetings } = useQuery({
    queryKey: ["upcomingMeetings"],
    queryFn: getUpcomingMeetings,
  });

  // Create instant meeting mutation
  const createMeetingMutation = useMutation({
    mutationFn: createMeeting,
    onSuccess: (data) => {
      const meetingLink = `${window.location.origin}/meeting/${data.meeting.meetingId}`;
      toast.success(
        <div>
          <p className="font-semibold">Meeting created successfully!</p>
          <p className="text-xs mt-1">Meeting ID: {data.meeting.meetingId}</p>
        </div>,
        { duration: 4000 }
      );
      // Copy meeting link to clipboard
      navigator.clipboard.writeText(meetingLink);
      toast.success("Meeting link copied to clipboard!", { duration: 2000 });
      navigate(`/meeting/${data.meeting.meetingId}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create meeting");
    },
  });

  // Schedule meeting mutation
  const scheduleMeetingMutation = useMutation({
    mutationFn: scheduleMeeting,
    onSuccess: () => {
      toast.success("Meeting scheduled successfully!");
      setShowScheduleModal(false);
      setMeetingForm({
        title: "",
        description: "",
        scheduledAt: "",
        duration: 60,
      });
      queryClient.invalidateQueries(["upcomingMeetings"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to schedule meeting");
    },
  });

  // Delete meeting mutation
  const deleteMeetingMutation = useMutation({
    mutationFn: deleteMeeting,
    onSuccess: () => {
      toast.success("Meeting deleted successfully!");
      queryClient.invalidateQueries(["upcomingMeetings"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete meeting");
    },
  });

  const handleInstantMeeting = () => {
    createMeetingMutation.mutate({
      title: "Quick Meeting",
      description: "Instant meeting",
    });
  };

  const handleJoinMeeting = () => {
    if (!joinMeetingId.trim()) {
      toast.error("Please enter a meeting ID or link");
      return;
    }

    // Extract meeting ID from link if full URL is provided
    let meetingId = joinMeetingId.trim();
    if (meetingId.includes("/meeting/")) {
      meetingId = meetingId.split("/meeting/")[1];
    }

    // Navigate to meeting
    navigate(`/meeting/${meetingId}`);
    setJoinMeetingId("");
    setShowJoinModal(false);
  };

  const copyMeetingLink = (meetingId) => {
    navigator.clipboard.writeText(meetingId);
    setCopiedId(meetingId);
    toast.success("Meeting ID copied to clipboard!");
    setTimeout(() => setCopiedId(""), 2000);
  };

  const handleScheduleMeeting = (e) => {
    e.preventDefault();
    
    if (!meetingForm.title || !meetingForm.scheduledAt) {
      toast.error("Please fill in required fields");
      return;
    }

    scheduleMeetingMutation.mutate(meetingForm);
  };

  const handleJoinScheduledMeeting = (meetingId) => {
    navigate(`/meeting/${meetingId}`);
  };

  const handleDeleteMeeting = (meetingId, meetingTitle) => {
    // Set the meeting to delete and show confirmation modal
    setMeetingToDelete({ id: meetingId, title: meetingTitle });
    setShowDeleteModal(true);
  };

  const confirmDeleteMeeting = () => {
    if (meetingToDelete.id) {
      deleteMeetingMutation.mutate(meetingToDelete.id);
      // Reset the delete state
      setMeetingToDelete({ id: null, title: null });
      setShowDeleteModal(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50"
      style={{
        backgroundImage: "url(/background.svg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Navbar */}
      <nav className="border-b border-teal-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/gatherly-logo.png" alt="Gatherly" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-bold text-teal-700">Gatherly</span>
          </div>
          <div className="flex items-center gap-3 bg-slate-800 px-4 py-3 rounded-lg">
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">{authUser?.fullName}</p>
              <p className="text-slate-400 text-xs">{authUser?.email}</p>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="text-slate-300 hover:text-white transition-colors p-1"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="space-y-12">
          {/* Create and Join Meeting */}
          <div className="text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Start or Join a Meeting</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleInstantMeeting}
                disabled={createMeetingMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                {createMeetingMutation.isPending ? "Creating..." : "Create Meeting"}
              </Button>
              <Button
                size="lg"
                onClick={() => setShowJoinModal(true)}
                variant="outline"
                className="border-teal-600 text-teal-600 hover:bg-teal-50 shadow-lg hover:shadow-xl transition-all"
              >
                <Link2 className="w-5 h-5 mr-2" />
                Join Meeting
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-teal-200"></div>
            <span className="text-slate-500 text-sm">or</span>
            <div className="flex-1 h-px bg-teal-200"></div>
          </div>

          {/* Schedule Meeting */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center">Schedule a Meeting</h2>
            <div className="space-y-4 bg-white p-6 rounded-lg shadow-md border border-teal-100">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Meeting Title</label>
                <Input
                  placeholder="Enter meeting title"
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  className="bg-white border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                  <Input
                    type="date"
                    value={meetingForm.scheduledAt.split('T')[0]}
                    onChange={(e) => {
                      const time = meetingForm.scheduledAt.split('T')[1] || '00:00';
                      setMeetingForm({ ...meetingForm, scheduledAt: `${e.target.value}T${time}` });
                    }}
                    className="bg-white border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Time</label>
                  <Input
                    type="time"
                    value={meetingForm.scheduledAt.split('T')[1] || ''}
                    onChange={(e) => {
                      const date = meetingForm.scheduledAt.split('T')[0] || new Date().toISOString().split('T')[0];
                      setMeetingForm({ ...meetingForm, scheduledAt: `${date}T${e.target.value}` });
                    }}
                    className="bg-white border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                    placeholder="11:00 AM"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reminder"
                  checked={meetingForm.reminder}
                  onCheckedChange={(checked) => setMeetingForm({ ...meetingForm, reminder: checked })}
                />
                <label
                  htmlFor="reminder"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <Bell size={16} className="text-teal-600" />
                  Send reminder 15 minutes before meeting
                </label>
              </div>
              <Button
                size="lg"
                onClick={(e) => {
                  e.preventDefault();
                  if (!meetingForm.title.trim() || !meetingForm.scheduledAt) {
                    toast.error("Please fill in required fields");
                    return;
                  }
                  scheduleMeetingMutation.mutate(meetingForm);
                }}
                disabled={!meetingForm.title.trim() || !meetingForm.scheduledAt || scheduleMeetingMutation.isPending}
                variant="outline"
                className="w-full border-teal-600 text-teal-600 hover:bg-teal-50 disabled:border-slate-300 disabled:text-slate-400 shadow-lg hover:shadow-xl transition-all"
              >
                {scheduleMeetingMutation.isPending ? "Scheduling..." : "Schedule Meeting"}
              </Button>
            </div>
          </div>

          {/* Upcoming Meetings */}
          {upcomingMeetings?.meetings && upcomingMeetings.meetings.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center">Upcoming Meetings</h2>
              <div className="space-y-3">
                {upcomingMeetings.meetings.map((meeting) => (
                  <div
                    key={meeting.meetingId}
                    className="bg-white p-4 rounded-lg shadow-md border border-teal-100 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{meeting.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Calendar size={16} className="text-teal-600" />
                            {new Date(meeting.scheduledAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={16} className="text-teal-600" />
                            {new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {meeting.reminder && (
                            <div className="flex items-center gap-1">
                              <Bell size={16} className="text-teal-600" />
                              <span>Reminder</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 select-all cursor-text">
                            {meeting.meetingId}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyMeetingLink(meeting.meetingId)}
                            className="h-6 px-2"
                          >
                            {copiedId === meeting.meetingId ? (
                              <Check size={14} className="text-green-600" />
                            ) : (
                              <Copy size={14} className="text-teal-600" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleJoinScheduledMeeting(meeting.meetingId)}
                          className="bg-teal-600 hover:bg-teal-700 text-white"
                        >
                          Join
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteMeeting(meeting.meetingId, meeting.title)}
                          className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                          disabled={deleteMeetingMutation.isPending}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Join Meeting Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Join a Meeting</h3>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinMeetingId("");
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Meeting ID or Link
                </label>
                <Input
                  placeholder="Enter meeting ID or paste meeting link"
                  value={joinMeetingId}
                  onChange={(e) => setJoinMeetingId(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleJoinMeeting()}
                  className="bg-white border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-1">
                  Paste the meeting link or enter the meeting ID shared by the host
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinMeetingId("");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleJoinMeeting}
                  disabled={!joinMeetingId.trim()}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Join Meeting
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Logout Confirmation"
        message="Are you sure you want to logout? You will need to sign in again to access your meetings."
        confirmText="Logout"
        cancelText="Cancel"
        type="warning"
      />

      {/* Delete Meeting Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setMeetingToDelete({ id: null, title: null });
        }}
        onConfirm={confirmDeleteMeeting}
        title="Delete Meeting"
        message={`Are you sure you want to delete "${meetingToDelete.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default NewHomePage;