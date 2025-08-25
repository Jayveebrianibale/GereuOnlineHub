// Entry screen ng app: chine-check muna kung tapos na ang auth
import { AuthGuard } from './components/AuthGuard';
import { useAuth } from './hooks/useAuth';

export default function Index() {
  // Kunin kung loading pa ang auth check
  const { isLoading } = useAuth();

  // Kung nagche-check pa ng login, huwag munang mag-render
  if (isLoading) {
    return null;
  }

  // Si AuthGuard ang bahala mag-redirect (admin/user/onboarding)
  return <AuthGuard />;
}