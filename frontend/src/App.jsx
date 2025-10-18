import { Navigate, Route, Routes } from "react-router";

import GoogleLoginPage from "./pages/GoogleLoginPage.jsx";
import NewHomePage from "./pages/NewHomePage.jsx";
import MeetingPage from "./pages/MeetingPage.jsx";

import { Toaster } from "react-hot-toast";
import PageLoader from "./components/PageLoader.jsx";
import useAuthUser from "./hooks/useAuthUser.js";

const App = () => {
  const { isLoading, authUser } = useAuthUser();
  const isAuthenticated = Boolean(authUser);

  if (isLoading) return <PageLoader />;

  return (
    <div className="h-screen">
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <NewHomePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={!isAuthenticated ? <GoogleLoginPage /> : <Navigate to="/" />}
        />
        <Route
          path="/meeting/:id"
          element={isAuthenticated ? <MeetingPage /> : <Navigate to="/login" />}
        />
      </Routes>

      <Toaster />
    </div>
  );
};
export default App;
