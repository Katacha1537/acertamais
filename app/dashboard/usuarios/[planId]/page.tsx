import PageContainer from '@/components/layout/page-container';
import PlanFormEdit from '../_components/userEdit';

export const metadata = {
  title: 'Dashboard : Employee View'
};

export default function Page() {
  return (
    <PageContainer>
      <PlanFormEdit />
    </PageContainer>
  );
}
