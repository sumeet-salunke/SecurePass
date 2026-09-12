import api from "./api.js";

// ================= VAULT SETUP & STATS =================

export const createVault = async ({ vaultSalt, encryptedVaultKey, vaultKeyIv, vaultKeyAuthTag }) => {
  const response = await api.post("/api/vault", {
    vaultSalt,
    encryptedVaultKey,
    vaultKeyIv,
    vaultKeyAuthTag,
  });
  return response.data;
};

export const getVault = async () => {
  const response = await api.get("/api/vault");
  return response.data;
};

export const getVaultStats = async () => {
  const response = await api.get("/api/vault/stats");
  return response.data;
};

export const deleteVault = async () => {
  const response = await api.delete("/api/vault");
  return response.data;
};

// ================= CREDENTIALS CRUD =================

export const listCredentials = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.favorite !== undefined) queryParams.append("favorite", params.favorite);

  const url = `/api/vault/credentials${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  const response = await api.get(url);
  return response.data;
};

export const createCredential = async ({ encryptedData, iv, authTag, category = "Login", favorite = false }) => {
  const response = await api.post("/api/vault/credentials", {
    encryptedData,
    iv,
    authTag,
    category,
    favorite,
  });
  return response.data;
};

export const getCredential = async (id) => {
  const response = await api.get(`/api/vault/credentials/${id}`);
  return response.data;
};

export const updateCredential = async (id, data) => {
  const response = await api.patch(`/api/vault/credentials/${id}`, data);
  return response.data;
};

export const deleteCredential = async (id) => {
  const response = await api.delete(`/api/vault/credentials/${id}`);
  return response.data;
};

// ================= SECURE NOTES CRUD =================

export const listSecureNotes = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.favorite !== undefined) queryParams.append("favorite", params.favorite);

  const url = `/api/vault/notes${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  const response = await api.get(url);
  return response.data;
};

export const createSecureNote = async ({ encryptedData, iv, authTag, favorite = false }) => {
  const response = await api.post("/api/vault/notes", {
    encryptedData,
    iv,
    authTag,
    favorite,
  });
  return response.data;
};

export const getSecureNote = async (id) => {
  const response = await api.get(`/api/vault/notes/${id}`);
  return response.data;
};

export const updateSecureNote = async (id, data) => {
  const response = await api.patch(`/api/vault/notes/${id}`, data);
  return response.data;
};

export const deleteSecureNote = async (id) => {
  const response = await api.delete(`/api/vault/notes/${id}`);
  return response.data;
};

// ================= TOTP CRUD =================

export const listTOTP = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);

  const url = `/api/vault/totp${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  const response = await api.get(url);
  return response.data;
};

export const createTOTP = async ({ encryptedData, iv, authTag, algorithm = "SHA1", digits = 6, period = 30 }) => {
  const response = await api.post("/api/vault/totp", {
    encryptedData,
    iv,
    authTag,
    algorithm,
    digits,
    period,
  });
  return response.data;
};

export const getTOTP = async (id) => {
  const response = await api.get(`/api/vault/totp/${id}`);
  return response.data;
};

export const updateTOTP = async (id, data) => {
  const response = await api.patch(`/api/vault/totp/${id}`, data);
  return response.data;
};

export const deleteTOTP = async (id) => {
  const response = await api.delete(`/api/vault/totp/${id}`);
  return response.data;
};

// ================= BACKEND PASSWORD GENERATOR =================

export const generatePasswordApi = async (options = {}) => {
  const response = await api.post("/api/password-generator", options);
  return response.data;
};
