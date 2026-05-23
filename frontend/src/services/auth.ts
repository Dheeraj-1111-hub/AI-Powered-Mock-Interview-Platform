export const getToken = () => {
  return localStorage.getItem("hireiq_token");
};

export const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
