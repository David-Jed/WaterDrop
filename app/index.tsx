import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return <Redirect href="/(auth)/login" />;
}