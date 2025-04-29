import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

/**
 * Hook zum Verwalten der Authentifizierung im Frontend
 */
export function useAuth() {
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/user");
        return await res.json();
      } catch (error) {
        // Bei 401 geben wir null zurück (nicht authentifiziert)
        if (error.status === 401) {
          return null;
        }
        throw error;
      }
    },
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}