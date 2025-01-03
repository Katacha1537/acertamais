import { SearchParams } from 'nuqs/parsers';
import EmployeeViewPage from '../_components/employee-view-page';

type pageProps = {
  searchParams: SearchParams;
};

export const metadata = {
  title: 'Clínicas : Novo Clínica'
};

export default async function Page({ searchParams }: pageProps) {
  return <EmployeeViewPage />;
}
