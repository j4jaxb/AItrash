export const ADMIN_EMAIL = "Admin";
export const ADMIN_PASSWORD = "Admin123";

export const isAdminUser = (user) => {
  if (!user) return false;

  const role = user.role || user.user_role || user.userType;
  if (typeof role === "string" && role.toLowerCase() === "admin") {
    return true;
  }

  if (typeof user.is_admin === "boolean") return user.is_admin;
  if (typeof user.isAdmin === "boolean") return user.isAdmin;

  return (
    typeof user.email === "string" &&
    user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
    user.password === ADMIN_PASSWORD
  );
};

export const isAdminCredentials = (email, password) => {
  return email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD;
};

export const getAdminFallbackUser = (email) => ({
  id: "admin",
  email,
  first_name: "Admin",
  last_name: "User",
  password: ADMIN_PASSWORD,
  role: "admin",
  is_admin: true,
});
