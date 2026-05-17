import DashboardLayout from '@/components/DashboardLayout';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
