import PageContainer from '@/components/layout/page-container';
import BusinessFormEdit from '../_components/businessEdit';
import EmployeeViewPage from '../_components/employee-view-page';

export const metadata = {
  title: 'Dashboard : Employee View'
};

export default function Page() {
  return (
    <PageContainer>
      <BusinessFormEdit />
    </PageContainer>
  );
}
