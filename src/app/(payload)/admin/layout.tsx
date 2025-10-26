import { Suspense } from "react";

type Props = {
  children: React.ReactNode;
};

const AdminLayout = ({ children }: Props) => (
  <Suspense fallback={null}>{children}</Suspense>
);

export default AdminLayout;
