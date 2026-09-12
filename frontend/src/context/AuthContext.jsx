import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { setAccessToken as saveAccessToken, clearAccessToken, subscribeAccessToken } from "../api/token.js";
import {
  refreshToken,
  login as apiLogin,
  logout as apiLogout,
  verifyMFALogin as apiVerifyMFALogin,
  verifyRecoveryCodeLogin as apiVerifyRecoveryLogin,
} from "../api/authApi.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mfaChallenge, setMfaChallenge] = useState(null); // { mfaRequired: true, mfaChallengeToken: "...", email: "..." }
  const isRestoringRef = useRef(false);

  const setAccessToken = useCallback((token) => {
    setAccessTokenState(token);
    saveAccessToken(token);
  }, []);

  const parseJwtPayload = (token) => {
    try {
      const base64Url = token.split(".")[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  // Sync state if token is cleared externally (e.g. 401 interceptor)
  useEffect(() => {
    const unsubscribe = subscribeAccessToken((token) => {
      if (!token) {
        setAccessTokenState(null);
        setUser(null);
      } else {
        setAccessTokenState(token);
      }
    });
    return unsubscribe;
  }, []);

  const restoreSession = useCallback(async () => {
    if (isRestoringRef.current) return;
    isRestoringRef.current = true;

    try {
      const response = await refreshToken();
      const token = response?.data?.accessToken;
      if (token) {
        setAccessToken(token);
        if (response.data.user) {
          setUser(response.data.user);
        } else {
          const payload = parseJwtPayload(token);
          setUser({
            id: payload?.userId || "user",
            email: payload?.email || "",
            name: payload?.name || "SecurePass User",
          });
        }
      } else {
        clearAccessToken();
        setUser(null);
        setAccessTokenState(null);
      }
    } catch {
      clearAccessToken();
      setUser(null);
      setAccessTokenState(null);
    } finally {
      isRestoringRef.current = false;
      setLoading(false);
    }
  }, [setAccessToken]);

  // Restore session on application load via HTTP-only refresh cookie
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

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

  const isAuthenticated = Boolean(user && accessToken);

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
        refreshSession: restoreSession,
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