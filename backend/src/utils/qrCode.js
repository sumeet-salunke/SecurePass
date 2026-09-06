import QRCode from "qrcode";

//convert the otpauth:// URI into a QR code data URL
//The frontend can use this directly as the image source
export const generateQRCode = async (otpAuthURI) => {
  return await QRCode.toDataURL(otpAuthURI);
};