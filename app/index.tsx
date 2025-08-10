import { AuthGuard } from './components/AuthGuard';
import { useAuth } from './hooks/useAuth';

export default function Index() {
  const { isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return null;
  }

  // AuthGuard will handle the routing logic
  return <AuthGuard />;
}