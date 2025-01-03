import { Metadata } from 'next';
import SignInViewPage from '../_components/sigin-view';

export const metadata: Metadata = {
  title: 'Acerta+ | Login',
  description: 'Login acerta+.'
};

export default function Page() {
  return <SignInViewPage />;
}
