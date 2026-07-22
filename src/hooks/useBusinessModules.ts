import { useAuthStore } from "../store/authStore";

export const useBusinessModules = () => {
  const user = useAuthStore((state) => state.user);

  return {
    isModuleEnabled: (moduleName?: string) => {
      if (!moduleName) return true;
      // For Tauri desktop app, allow all modules if no user is authenticated
      if (!user) return true;
      
      // Administrators have access to everything
      if (user.role === 'Administrator' || user.permissions.includes('all')) return true;

      return user.businessModules.includes(moduleName);
    },
  };
};
