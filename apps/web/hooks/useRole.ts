import { useSession } from 'next-auth/react';

export function useRole() {
  const { data: session } = useSession();
  
  const isAdmin = session?.user?.role === 'ADMIN';
  const isProblemSetter = session?.user?.role === 'PROBLEM_SETTER' || isAdmin;
  const isUser = !!session?.user;
  
  return {
    isAdmin,
    isProblemSetter,
    isUser,
    role: session?.user?.role,
  };
}