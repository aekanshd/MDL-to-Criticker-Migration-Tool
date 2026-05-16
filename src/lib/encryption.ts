import CryptoJS from "crypto-js";

const SECRET_KEY = "mdl-criticker-bridge-secret-key-!123";

export const encryptToken = (token: string): string => {
  if (!token) return "";
  return CryptoJS.AES.encrypt(token, SECRET_KEY).toString();
};

export const decryptToken = (encryptedToken: string): string => {
  if (!encryptedToken) return "";
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.error("Failed to decrypt token");
    return "";
  }
};
