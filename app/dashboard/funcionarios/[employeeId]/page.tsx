import PageContainer from '@/components/layout/page-container';
import EmployeeFormEdit from '../_components/employeeEdit';

export const metadata = {
  title: 'Dashboard : Employee View'
};

export default function Page() {
  return (
    <PageContainer>
      <EmployeeFormEdit />
    </PageContainer>
  );
}
