# Gatherly - Video Calling Platform

![Gatherly Demo](frontend/public/screenshot-for-readme.png)

Gatherly is a real-time video calling platform that allows users to create and join video calls, chat, and manage audio/video settings. The application uses WebRTC for real-time communication and provides a responsive, user-friendly interface.

## 🌟 Features

### Core Features
- 📹 Real-time Video Calls with WebRTC (supports multiple participants)
- 💬 In-meeting Chat with Message History
- 🖥️ Screen Sharing Support
- 🔐 Google OAuth Authentication
- 🔊 Audio/Video Toggle Controls
- 📅 Meeting Scheduling with Reminder System

### UI/UX Features
- 🎨 Modern Teal-themed UI with Tailwind CSS
- 📱 Fully Responsive Design for Desktop and Mobile
- 🌙 Dark/Light Theme Toggle
- ⚡ Real-time Updates with Socket.IO
- 🧠 Global State Management with Zustand

## 🛠️ Technology Stack

- **Frontend**: React + Vite + Tailwind CSS + Zustand
- **Backend**: Express.js + Socket.io + WebRTC
- **Database**: MongoDB
- **Authentication**: Google OAuth
- **Real-time Communication**: Socket.io and WebRTC
- **State Management**: Zustand (global state)

## 📋 Current Implementation Status

### ✅ Core Features Implemented
1. **Video Calling**
   - Multi-participant WebRTC mesh network
   - Camera on/off toggle with visual indicators
   - Microphone mute/unmute with visual indicators
   - Screen sharing capability

2. **Meeting Management**
   - Create instant meetings with unique IDs
   - Schedule future meetings with date/time selection
   - Meeting reminder system (15 minutes before start)

3. **Communication Features**
   - Real-time text chat during meetings
   - Message history persistence
   - Notification sounds for user actions

4. **User Interface**
   - Modern, responsive design with Tailwind CSS
   - Dark/light theme support
   - Intuitive controls for all features
   - Participant grid layout with dynamic sizing

### 🚫 Removed Features (As Per Requirements)
1. **Admin Controls** - Removed per user request
2. **Recording Feature** - Removed per user request
3. **Password Protection** - Removed per user request

## 🧪 Environment Setup

### Backend Configuration (`.env` file in `/backend` directory)
```env
PORT=5001
MONGO_URI=your_mongo_uri
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
JWT_SECRET_KEY=your_jwt_secret
NODE_ENV=development
CLIENT_URL=http://localhost:3000
# Email configuration for reminders (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

### Frontend Configuration (`.env` file in `/frontend` directory)
```env
VITE_API_URL=http://localhost:5001
```

## ▶️ Running the Application

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📱 User Workflow

1. **Authentication**
   - Users sign in with Google OAuth
   - Secure session management with JWT

2. **Creating Meetings**
   - Click "Create Meeting" for instant meetings
   - Click "Schedule Meeting" for future meetings
   - Enable/disable meeting reminders

3. **Joining Meetings**
   - Enter meeting ID or click meeting link
   - Grant camera/microphone permissions

4. **During Meetings**
   - Toggle audio/video on/off
   - Share screen with other participants
   - Chat with all participants in real-time
   - View all participants in a responsive grid

5. **Meeting Management**
   - Leave meetings at any time
   - End meetings (for creators)
   - View upcoming scheduled meetings

## 🔔 Reminder System

The reminder system automatically sends email notifications 15 minutes before scheduled meetings:
- Enabled by default when scheduling meetings
- Visible indicator in upcoming meetings list
- Requires email configuration in backend `.env` file
- Only sends reminders for meetings with reminder enabled

## 🎨 UI Components

### Main Pages
- **Home Page**: Dashboard for creating, scheduling, and joining meetings
- **Meeting Page**: Video call interface with all controls
- **Authentication Pages**: Google OAuth login

### Key Components
- **Video Grid**: Responsive layout for all participants
- **Chat Panel**: Real-time messaging during meetings
- **Participants Panel**: List of all meeting participants
- **Control Bar**: Audio, video, screen share, and leave controls

## 📞 Technical Architecture

### WebRTC Implementation
- Mesh network topology for multi-participant calls
- STUN/TURN server configuration for NAT traversal
- Media stream management for audio/video toggling
- Screen sharing with proper UI layout handling

### Real-time Communication
- Socket.IO for signaling and chat messages
- Event-driven architecture for user actions
- Automatic reconnection handling
- Participant status synchronization

### Data Management
- MongoDB for persistent data storage
- Mongoose ODM for data modeling
- RESTful API for meeting operations
- Real-time state management with Zustand

## 🚀 Deployment

The application can be deployed to any cloud platform that supports Node.js applications:
- Frontend: Vercel, Netlify, or similar static hosting
- Backend: Render, Heroku, or similar Node.js hosting
- Database: MongoDB Atlas for database hosting

## 📸 Screenshots

### Home Page
![Home Page](frontend/public/screenshot-for-readme.png)

### Meeting Interface
![Meeting Interface](frontend/public/screenshot-for-readme.png)

## 🛡️ Security Features

- Google OAuth for secure authentication
- Encrypted communication with HTTPS
- Secure session management with JWT
- Input validation and sanitization

## 📈 Performance Considerations

- Optimized WebRTC mesh network for small groups (2-6 participants)
- Efficient state management with Zustand
- Lazy loading of components
- Responsive design for all device sizes
- Minimal bundle size with Vite build optimization

## 🆘 Troubleshooting

### Common Issues
1. **Blank Screen After Joining**
   - Check browser permissions for camera/microphone
   - Ensure backend server is running
   - Verify MongoDB connection

2. **Audio/Video Not Working**
   - Check browser permissions
   - Verify no other applications are using camera/microphone
   - Try refreshing the page

3. **Chat Not Working**
   - Ensure Socket.IO connection is established
   - Check network connectivity

### Ports Used
- Frontend: http://localhost:3000
- Backend: http://localhost:5001

## 📄 License

This project is for educational purposes and demonstration of WebRTC video calling capabilities.

## 🙋 Support

For issues or questions about the implementation, please check the code documentation or create an issue in the repository.