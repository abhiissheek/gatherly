import { useEffect } from "react";
import { useNavigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { GoogleSignInButton } from "../components/GoogleSignInButton";

const GoogleLoginPage = () => {
  const navigate = useNavigate();
  const { authUser, isLoading } = useAuthUser();

  useEffect(() => {
    if (authUser && !isLoading) {
      navigate("/");
    }
  }, [authUser, isLoading, navigate]);

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5001/api/auth/google";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 p-4"
      style={{
        backgroundImage: "url(/background.svg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="w-20 h-20 mx-auto mb-6">
          <img src="/gatherly-logo.png" alt="Gatherly" className="w-full h-full object-contain" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
          Easy calls,
          <br />
          seamless meetings
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed max-w-md mx-auto mb-6">
          Connect with anyone, anywhere. Start a meeting in seconds with Gatherly's simple and reliable video calling platform.
        </p>

        <GoogleSignInButton onSignIn={handleGoogleLogin} />
      </div>
    </div>
  );
};

export default GoogleLoginPage;
