import PageContainer from '@/components/layout/page-container';
import PlanFormEdit from '../_components/planEdit';

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
