import PageContainer from '@/components/layout/page-container';
import CredencialsFormEdit from '../_components/credencialsEdit';

export const metadata = {
  title: 'Dashboard : Employee View'
};

export default function Page() {
  return (
    <PageContainer>
      <CredencialsFormEdit />
    </PageContainer>
  );
}
