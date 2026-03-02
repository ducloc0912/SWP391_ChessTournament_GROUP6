export const REGISTRATION_REQUIRED_FIELDS = [
  "fullName",
  "username",
  "email",
  "phone",
  "rankAtRegistration",
];

export const validateRegistrationField = (field, value) => {
  const text = String(value ?? "").trim();
  if (field === "fullName") {
    if (!text) return "Vui lòng nhập họ và tên.";
    return "";
  }
  if (field === "username") {
    if (!text) return "Vui lòng nhập username.";
    return "";
  }
  if (field === "email") {
    if (!text) return "Vui lòng nhập email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return "Email không hợp lệ.";
    return "";
  }
  if (field === "phone") {
    if (!text) return "Vui lòng nhập số điện thoại.";
    if (!/^[0-9+\s()-]{8,15}$/.test(text)) return "Số điện thoại không hợp lệ.";
    return "";
  }
  if (field === "rankAtRegistration") {
    if (text === "") return "Vui lòng nhập rank đăng ký.";
    const rankNum = Number(text);
    if (!Number.isInteger(rankNum) || rankNum < 0) return "Rank phải là số nguyên >= 0.";
    return "";
  }
  return "";
};

export const validateRegistrationForm = (form) => {
  const errors = {};
  REGISTRATION_REQUIRED_FIELDS.forEach((field) => {
    const message = validateRegistrationField(field, form?.[field]);
    if (message) errors[field] = message;
  });
  return errors;
};
