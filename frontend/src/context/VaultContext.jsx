import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext.jsx";
import {
  getVault,
  createVault as apiCreateVault,
  getVaultStats,
  listCredentials as apiListCredentials,
  createCredential as apiCreateCredential,
  updateCredential as apiUpdateCredential,
  deleteCredential as apiDeleteCredential,
  listSecureNotes as apiListNotes,
  createSecureNote as apiCreateNote,
  updateSecureNote as apiUpdateNote,
  deleteSecureNote as apiDeleteNote,
  listTOTP as apiListTOTP,
  createTOTP as apiCreateTOTP,
  updateTOTP as apiUpdateTOTP,
  deleteTOTP as apiDeleteTOTP,
} from "../api/vaultApi.js";
import {
  base64ToUint8Array,
  getRandomBytes,
  deriveKEK,
  encryptVaultKey,
  decryptVaultKey,
  encryptData,
  decryptData,
  uint8ArrayToBase64,
} from "../utils/crypto.js";

const VaultContext = createContext(null);

export const VaultProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const [hasVault, setHasVault] = useState(null); // null = unknown, false = no vault, true = vault exists
  const [vaultMetadata, setVaultMetadata] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [vekKey, setVekKey] = useState(null); // CryptoKey kept strictly in memory

  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultStats, setVaultStats] = useState(null);

  const [credentials, setCredentials] = useState([]);
  const [secureNotes, setSecureNotes] = useState([]);
  const [totpList, setTotpList] = useState([]);

  // Check vault existence on login
  const checkVaultStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setHasVault(null);
      setVaultMetadata(null);
      setIsUnlocked(false);
      setVekKey(null);
      setCredentials([]);
      setSecureNotes([]);
      setTotpList([]);
      setVaultStats(null);
      return;
    }

    try {
      setVaultLoading(true);
      const res = await getVault();
      if (res?.data) {
        setHasVault(true);
        setVaultMetadata(res.data);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setHasVault(false);
        setVaultMetadata(null);
      }
    } finally {
      setVaultLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    checkVaultStatus();
  }, [checkVaultStatus]);

  // Lock Vault
  const lockVault = useCallback(() => {
    setVekKey(null);
    setIsUnlocked(false);
    setCredentials([]);
    setSecureNotes([]);
    setTotpList([]);
  }, []);

  // Fetch Vault Stats
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated || !hasVault) return;
    try {
      const res = await getVaultStats();
      if (res?.data) {
        setVaultStats(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch vault stats:", err);
    }
  }, [isAuthenticated, hasVault]);

  // Fetch and Decrypt Credentials
  const fetchCredentials = useCallback(async (activeVek = vekKey) => {
    if (!activeVek) return;
    try {
      const res = await apiListCredentials({ limit: 100 });
      const rawItems = res?.data?.items || [];

      const decrypted = await Promise.all(
        rawItems.map(async (item) => {
          try {
            const dataObj = await decryptData(item.encryptedData, item.iv, item.authTag, activeVek);
            return {
              id: item.id,
              ...dataObj,
              category: item.category || "Login",
              favorite: Boolean(item.favorite),
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            };
          } catch (decryptErr) {
            console.error("Failed to decrypt credential:", item.id, decryptErr);
            return {
              id: item.id,
              title: "Decryption Failed",
              username: "",
              password: "",
              url: "",
              notes: "",
              category: item.category || "Login",
              favorite: Boolean(item.favorite),
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            };
          }
        })
      );
      setCredentials(decrypted);
    } catch (err) {
      console.error("Failed to fetch credentials:", err);
    }
  }, [vekKey]);

  // Fetch and Decrypt Secure Notes
  const fetchNotes = useCallback(async (activeVek = vekKey) => {
    if (!activeVek) return;
    try {
      const res = await apiListNotes({ limit: 100 });
      const rawItems = res?.data?.items || [];

      const decrypted = await Promise.all(
        rawItems.map(async (item) => {
          try {
            const dataObj = await decryptData(item.encryptedData, item.iv, item.authTag, activeVek);
            return {
              id: item.id,
              ...dataObj,
              favorite: Boolean(item.favorite),
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            };
          } catch (decryptErr) {
            console.error("Failed to decrypt secure note:", item.id, decryptErr);
            return {
              id: item.id,
              title: "Decryption Failed",
              content: "",
              favorite: Boolean(item.favorite),
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            };
          }
        })
      );
      setSecureNotes(decrypted);
    } catch (err) {
      console.error("Failed to fetch secure notes:", err);
    }
  }, [vekKey]);

  // Fetch and Decrypt TOTP entries
  const fetchTOTP = useCallback(async (activeVek = vekKey) => {
    if (!activeVek) return;
    try {
      const res = await apiListTOTP({ limit: 100 });
      const rawItems = res?.data?.items || [];

      const decrypted = await Promise.all(
        rawItems.map(async (item) => {
          try {
            const dataObj = await decryptData(item.encryptedData, item.iv, item.authTag, activeVek);
            return {
              id: item.id,
              ...dataObj,
              algorithm: item.algorithm || "SHA1",
              digits: item.digits || 6,
              period: item.period || 30,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            };
          } catch (decryptErr) {
            console.error("Failed to decrypt TOTP item:", item.id, decryptErr);
            return {
              id: item.id,
              serviceName: "Decryption Failed",
              accountName: "",
              secretKey: "",
              algorithm: item.algorithm || "SHA1",
              digits: item.digits || 6,
              period: item.period || 30,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            };
          }
        })
      );
      setTotpList(decrypted);
    } catch (err) {
      console.error("Failed to fetch TOTP records:", err);
    }
  }, [vekKey]);

  // Unlock Vault using Master Password
  const unlockVault = async (masterPassword) => {
    if (!vaultMetadata) throw new Error("Vault not found.");

    const saltBytes = base64ToUint8Array(vaultMetadata.vaultSalt);
    const kek = await deriveKEK(masterPassword, saltBytes);

    const decryptedVek = await decryptVaultKey(
      vaultMetadata.encryptedVaultKey,
      vaultMetadata.vaultKeyIv,
      vaultMetadata.vaultKeyAuthTag,
      kek
    );

    setVekKey(decryptedVek);
    setIsUnlocked(true);

    // Refresh all data
    await Promise.all([
      fetchCredentials(decryptedVek),
      fetchNotes(decryptedVek),
      fetchTOTP(decryptedVek),
      fetchStats(),
    ]);

    return true;
  };

  // Setup New Vault for First-Time Users
  const setupNewVault = async (masterPassword) => {
    const saltBytes = getRandomBytes(16);
    const vekBytes = getRandomBytes(32);

    const kek = await deriveKEK(masterPassword, saltBytes);
    const encryptedKeyData = await encryptVaultKey(vekBytes, kek);

    const payload = {
      vaultSalt: uint8ArrayToBase64(saltBytes),
      encryptedVaultKey: encryptedKeyData.encryptedVaultKey,
      vaultKeyIv: encryptedKeyData.vaultKeyIv,
      vaultKeyAuthTag: encryptedKeyData.vaultKeyAuthTag,
    };

    const res = await apiCreateVault(payload);
    setVaultMetadata(res.data);
    setHasVault(true);

    // Import the raw VEK into a usable CryptoKey
    const importedVek = await window.crypto.subtle.importKey(
      "raw",
      vekBytes,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    setVekKey(importedVek);
    setIsUnlocked(true);
    await fetchStats();
    return true;
  };

  // ================= CRUD OPERATIONS =================

  // Add Credential
  const addCredential = async (itemData) => {
    if (!vekKey) throw new Error("Vault is locked.");
    const { title, username, password, url, notes, category = "Login", favorite = false } = itemData;

    const payloadToEncrypt = { title, username, password, url, notes };
    const encrypted = await encryptData(payloadToEncrypt, vekKey);

    const res = await apiCreateCredential({
      ...encrypted,
      category,
      favorite,
    });

    const newItem = {
      id: res.data.id,
      title,
      username,
      password,
      url,
      notes,
      category: res.data.category,
      favorite: res.data.favorite,
      createdAt: res.data.createdAt,
      updatedAt: res.data.updatedAt,
    };

    setCredentials((prev) => [newItem, ...prev]);
    fetchStats();
    return newItem;
  };

  // Edit Credential
  const editCredential = async (id, itemData) => {
    if (!vekKey) throw new Error("Vault is locked.");
    const { title, username, password, url, notes, category, favorite } = itemData;

    const payloadToEncrypt = { title, username, password, url, notes };
    const encrypted = await encryptData(payloadToEncrypt, vekKey);

    const res = await apiUpdateCredential(id, {
      ...encrypted,
      category,
      favorite,
    });

    setCredentials((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              title,
              username,
              password,
              url,
              notes,
              category: res.data.category,
              favorite: res.data.favorite,
              updatedAt: res.data.updatedAt,
            }
          : item
      )
    );
    fetchStats();
  };

  // Toggle Favorite Credential
  const toggleFavoriteCredential = async (id, currentFavorite) => {
    const nextVal = !currentFavorite;
    await apiUpdateCredential(id, { favorite: nextVal });
    setCredentials((prev) =>
      prev.map((item) => (item.id === id ? { ...item, favorite: nextVal } : item))
    );
    fetchStats();
  };

  // Delete Credential
  const removeCredential = async (id) => {
    await apiDeleteCredential(id);
    setCredentials((prev) => prev.filter((item) => item.id !== id));
    fetchStats();
  };

  // Add Secure Note
  const addNote = async (itemData) => {
    if (!vekKey) throw new Error("Vault is locked.");
    const { title, content, favorite = false } = itemData;

    const payloadToEncrypt = { title, content };
    const encrypted = await encryptData(payloadToEncrypt, vekKey);

    const res = await apiCreateNote({
      ...encrypted,
      favorite,
    });

    const newItem = {
      id: res.data.id,
      title,
      content,
      favorite: res.data.favorite,
      createdAt: res.data.createdAt,
      updatedAt: res.data.updatedAt,
    };

    setSecureNotes((prev) => [newItem, ...prev]);
    fetchStats();
    return newItem;
  };

  // Edit Secure Note
  const editNote = async (id, itemData) => {
    if (!vekKey) throw new Error("Vault is locked.");
    const { title, content, favorite } = itemData;

    const payloadToEncrypt = { title, content };
    const encrypted = await encryptData(payloadToEncrypt, vekKey);

    const res = await apiUpdateNote(id, {
      ...encrypted,
      favorite,
    });

    setSecureNotes((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              title,
              content,
              favorite: res.data.favorite,
              updatedAt: res.data.updatedAt,
            }
          : item
      )
    );
    fetchStats();
  };

  // Toggle Favorite Note
  const toggleFavoriteNote = async (id, currentFavorite) => {
    const nextVal = !currentFavorite;
    await apiUpdateNote(id, { favorite: nextVal });
    setSecureNotes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, favorite: nextVal } : item))
    );
    fetchStats();
  };

  // Delete Secure Note
  const removeNote = async (id) => {
    await apiDeleteNote(id);
    setSecureNotes((prev) => prev.filter((item) => item.id !== id));
    fetchStats();
  };

  // Add TOTP
  const addTOTP = async (itemData) => {
    if (!vekKey) throw new Error("Vault is locked.");
    const { serviceName, accountName, secretKey, algorithm = "SHA1", digits = 6, period = 30 } = itemData;

    const payloadToEncrypt = { serviceName, accountName, secretKey };
    const encrypted = await encryptData(payloadToEncrypt, vekKey);

    const res = await apiCreateTOTP({
      ...encrypted,
      algorithm,
      digits,
      period,
    });

    const newItem = {
      id: res.data.id,
      serviceName,
      accountName,
      secretKey,
      algorithm: res.data.algorithm,
      digits: res.data.digits,
      period: res.data.period,
      createdAt: res.data.createdAt,
      updatedAt: res.data.updatedAt,
    };

    setTotpList((prev) => [newItem, ...prev]);
    fetchStats();
    return newItem;
  };

  // Edit TOTP
  const editTOTP = async (id, itemData) => {
    if (!vekKey) throw new Error("Vault is locked.");
    const { serviceName, accountName, secretKey, algorithm, digits, period } = itemData;

    const payloadToEncrypt = { serviceName, accountName, secretKey };
    const encrypted = await encryptData(payloadToEncrypt, vekKey);

    const res = await apiUpdateTOTP(id, {
      ...encrypted,
      algorithm,
      digits,
      period,
    });

    setTotpList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              serviceName,
              accountName,
              secretKey,
              algorithm: res.data.algorithm,
              digits: res.data.digits,
              period: res.data.period,
              updatedAt: res.data.updatedAt,
            }
          : item
      )
    );
    fetchStats();
  };

  // Delete TOTP
  const removeTOTP = async (id) => {
    await apiDeleteTOTP(id);
    setTotpList((prev) => prev.filter((item) => item.id !== id));
    fetchStats();
  };

  return (
    <VaultContext.Provider
      value={{
        hasVault,
        vaultMetadata,
        isUnlocked,
        vaultLoading,
        vaultStats,
        credentials,
        secureNotes,
        totpList,
        checkVaultStatus,
        setupNewVault,
        unlockVault,
        lockVault,
        fetchStats,
        fetchCredentials,
        addCredential,
        editCredential,
        toggleFavoriteCredential,
        removeCredential,
        fetchNotes,
        addNote,
        editNote,
        toggleFavoriteNote,
        removeNote,
        fetchTOTP,
        addTOTP,
        editTOTP,
        removeTOTP,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return context;
};
