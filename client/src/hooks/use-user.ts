import { useQuery } from '@tanstack/react-query';
import { User } from '@shared/schema';

export function useUser() {
  const { 
    data: user, 
    isLoading, 
    error,
    refetch
  } = useQuery<User>({
    queryKey: ['/api/user'],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 Minuten Cache-Gültigkeit
  });

  return {
    user,
    isLoading,
    error,
    refetch,
    isAuthenticated: !!user
  };
}