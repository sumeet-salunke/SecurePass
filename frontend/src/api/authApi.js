import api from "./api.js";

// ================= AUTHENTICATION =================

export const register = async ({ name, email, password }) => {
  const response = await api.post("/api/auth/register", { name, email, password });
  return response.data;
};

export const verifyOTP = async ({ email, otp }) => {
  const response = await api.post("/api/auth/verify-otp", { email, otp });
  return response.data;
};

export const resendOTP = async ({ email }) => {
  const response = await api.post("/api/auth/resend-otp", { email });
  return response.data;
};

export const login = async ({ email, password }) => {
  const response = await api.post("/api/auth/login", { email, password });
  return response.data;
};

export const refreshToken = async () => {
  const response = await api.post("/api/auth/refresh");
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/api/auth/logout");
  return response.data;
};

export const logoutAllDevices = async () => {
  const response = await api.post("/api/auth/logout-all-devices");
  return response.data;
};

// ================= PASSWORD MANAGEMENT =================

export const changePassword = async ({ currentPassword, newPassword }) => {
  const response = await api.patch("/api/auth/change-password", { currentPassword, newPassword });
  return response.data;
};

export const forgotPassword = async ({ email }) => {
  const response = await api.post("/api/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async ({ email, otp, newPassword }) => {
  const response = await api.post("/api/auth/reset-password", { email, otp, newPassword });
  return response.data;
};

// ================= MULTI-FACTOR AUTHENTICATION (MFA) =================

export const setupMFA = async () => {
  const response = await api.post("/api/auth/mfa/setup");
  return response.data;
};

export const verifyMFASetup = async ({ code }) => {
  const response = await api.post("/api/auth/mfa/verify-setup", { code });
  return response.data;
};

export const verifyMFALogin = async ({ mfaChallengeToken, code }) => {
  const response = await api.post("/api/auth/mfa/verify-login", { mfaChallengeToken, code });
  return response.data;
};

export const verifyRecoveryCodeLogin = async ({ mfaChallengeToken, recoveryCode }) => {
  const response = await api.post("/api/auth/mfa/verify-recovery", { mfaChallengeToken, recoveryCode });
  return response.data;
};

export const disableMFA = async ({ password, code }) => {
  const response = await api.post("/api/auth/mfa/disable", { password, code });
  return response.data;
};

export const regenerateRecoveryCodes = async ({ password, code }) => {
  const response = await api.post("/api/auth/mfa/regenerate-recovery-codes", { password, code });
  return response.data;
};

// ================= EMAIL & ACCOUNT MANAGEMENT =================

export const changeEmail = async ({ currentPassword, newEmail }) => {
  const response = await api.post("/api/auth/change-email", { currentPassword, newEmail });
  return response.data;
};

export const verifyEmailChange = async ({ code }) => {
  const response = await api.post("/api/auth/verify-change-email", { code });
  return response.data;
};

export const getSessions = async () => {
  const response = await api.get("/api/auth/sessions");
  return response.data;
};

export const revokeSession = async (sessionId) => {
  const response = await api.delete(`/api/auth/sessions/${sessionId}`);
  return response.data;
};

export const revokeAllSessions = async () => {
  const response = await api.delete("/api/auth/sessions");
  return response.data;
};

export const deleteAccount = async ({ currentPassword, code }) => {
  const response = await api.delete("/api/auth/delete-account", {
    data: { currentPassword, code: code || undefined },
  });
  return response.data;
};