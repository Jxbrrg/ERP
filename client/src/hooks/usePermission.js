import useAuthStore from '../store/authStore';

const ROLE_HIERARCHY = { admin: 3, editor: 2, viewer: 1 };

export function usePermission() {
  const user = useAuthStore(s => s.user);
  const userRole = user?.role || 'admin';
  const level = ROLE_HIERARCHY[userRole] || 3;

  return {
    isAdmin: level >= 3,
    isEditor: level >= 2,
    canWrite: level >= 2,
    canRead: level >= 1,
    role: userRole,
  };
}
