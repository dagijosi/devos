import { useAuthStore } from "../store/authStore";

export const useAbility = () => {
  const user = useAuthStore((state) => state.user);

  return {
    can: (params: { permission?: string[]; role?: string[]; entitlement?: string }) => {
      // For Tauri desktop app, allow all access if no user is authenticated
      if (!user) return true;
      
      // If user has 'all' permission, they can do everything
      if (user.permissions.includes('all')) return true;

      // Check role
      if (params.role && params.role.length > 0) {
        if (!params.role.includes(user.role)) return false;
      }

      // Check permissions
      if (params.permission && params.permission.length > 0) {
        const hasPermission = params.permission.some(p => user.permissions.includes(p));
        if (!hasPermission) return false;
      }

      // Entitlement logic could go here if needed
      
      return true;
    },
    isPlatformMode: user?.role === 'Administrator',
  };
};
