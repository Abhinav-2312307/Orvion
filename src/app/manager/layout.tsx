import DashboardLayout from '@/components/DashboardLayout';

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
