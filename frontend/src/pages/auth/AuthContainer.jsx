import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import LoginView from "./LoginView.jsx";
import RegisterView from "./RegisterView.jsx";
import VerifyOtpView from "./VerifyOtpView.jsx";
import MFAChallengeView from "./MFAChallengeView.jsx";
import ForgotPasswordView from "./ForgotPasswordView.jsx";

export default function AuthContainer() {
  const { mfaChallenge } = useAuth();
  const [view, setView] = useState("login"); // 'login' | 'register' | 'verify-otp' | 'forgot-password'
  const [pendingEmail, setPendingEmail] = useState("");

  const handleRegistered = (email) => {
    setPendingEmail(email);
    setView("verify-otp");
  };

  const handleUnverifiedEmail = (email) => {
    setPendingEmail(email);
    setView("verify-otp");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {mfaChallenge ? (
          <MFAChallengeView />
        ) : view === "login" ? (
          <LoginView
            onSwitchToRegister={() => setView("register")}
            onSwitchToForgotPassword={() => setView("forgot-password")}
            onUnverifiedEmail={handleUnverifiedEmail}
          />
        ) : view === "register" ? (
          <RegisterView
            onSwitchToLogin={() => setView("login")}
            onRegistered={handleRegistered}
          />
        ) : view === "verify-otp" ? (
          <VerifyOtpView
            email={pendingEmail}
            onVerified={() => setView("login")}
            onSwitchToLogin={() => setView("login")}
          />
        ) : view === "forgot-password" ? (
          <ForgotPasswordView onSwitchToLogin={() => setView("login")} />
        ) : null}
      </div>
    </div>
  );
}
