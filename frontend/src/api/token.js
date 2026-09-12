let accessToken = null;
const listeners = new Set();

export const setAccessToken = (token) => {
  accessToken = token;
  listeners.forEach((listener) => {
    try {
      listener(accessToken);
    } catch {
      // Ignore listener errors
    }
  });
};

export const getAccessToken = () => {
  return accessToken;
};

export const clearAccessToken = () => {
  accessToken = null;
  listeners.forEach((listener) => {
    try {
      listener(null);
    } catch {
      // Ignore listener errors
    }
  });
};

export const subscribeAccessToken = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};