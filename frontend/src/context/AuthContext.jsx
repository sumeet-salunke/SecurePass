import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { setAccessToken as saveAccessToken, clearAccessToken } from "../api/token.js";
import { refreshToken, login as apiLogin, logout as apiLogout, verifyMFALogin as apiVerifyMFALogin, verifyRecoveryCodeLogin as apiVerifyRecoveryLogin } from "../api/authApi.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mfaChallenge, setMfaChallenge] = useState(null); // { mfaRequired: true, mfaChallengeToken: "..." }

  const setAccessToken = useCallback((token) => {
    setAccessTokenState(token);
    saveAccessToken(token);
  }, []);

  const isAuthenticated = Boolean(user && accessToken);

  // Restore session on application load via HTTP-only refresh cookie
  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const response = await refreshToken();
        if (isMounted && response?.data?.accessToken) {
          setAccessToken(response.data.accessToken);
          // If the refresh response includes user details, store them; otherwise decode or placeholder
          if (response.data.user) {
            setUser(response.data.user);
          } else {
            // Reconstruct minimal user from JWT or subsequent fetch
            try {
              const base64Url = response.data.accessToken.split(".")[1];
              const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
              const jsonPayload = decodeURIComponent(
                window.atob(base64)
                  .split("")
                  .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                  .join("")
              );
              const payload = JSON.parse(jsonPayload);
              setUser({ id: payload.userId, email: payload.email || "" });
            } catch {
              setUser({ id: "current-user" });
            }
          }
        }
      } catch {
        // No active session
        clearAccessToken();
        if (isMounted) {
          setUser(null);
          setAccessTokenState(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, [setAccessToken]);

  const loginUser = async (email, password) => {
    const res = await apiLogin({ email, password });
    if (res?.data?.mfaRequired) {
      setMfaChallenge({
        mfaRequired: true,
        mfaChallengeToken: res.data.mfaChallengeToken,
        email,
      });
      return { mfaRequired: true };
    }

    if (res?.data?.accessToken && res?.data?.user) {
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
      setMfaChallenge(null);
      return { success: true, user: res.data.user };
    }

    return res;
  };

  const completeMFALogin = async (code) => {
    if (!mfaChallenge?.mfaChallengeToken) {
      throw new Error("No active MFA challenge found.");
    }

    const res = await apiVerifyMFALogin({
      mfaChallengeToken: mfaChallenge.mfaChallengeToken,
      code,
    });

    if (res?.data?.accessToken && res?.data?.user) {
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
      setMfaChallenge(null);
      return { success: true, user: res.data.user };
    }
    return res;
  };

  const completeRecoveryLogin = async (recoveryCode) => {
    if (!mfaChallenge?.mfaChallengeToken) {
      throw new Error("No active MFA challenge found.");
    }

    const res = await apiVerifyRecoveryLogin({
      mfaChallengeToken: mfaChallenge.mfaChallengeToken,
      recoveryCode,
    });

    if (res?.data?.accessToken && res?.data?.user) {
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
      setMfaChallenge(null);
      return { success: true, user: res.data.user };
    }
    return res;
  };

  const cancelMFAChallenge = () => {
    setMfaChallenge(null);
  };

  const logoutUser = async () => {
    try {
      await apiLogout();
    } catch {
      // Ignore network errors on logout
    } finally {
      clearAccessToken();
      setUser(null);
      setAccessTokenState(null);
      setMfaChallenge(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        accessToken,
        setAccessToken,
        isAuthenticated,
        loading,
        mfaChallenge,
        loginUser,
        completeMFALogin,
        completeRecoveryLogin,
        cancelMFAChallenge,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};