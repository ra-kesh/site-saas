import { caller } from "@/trpc/server";
import { redirect } from "next/navigation";

const Dashboard = () => {
  return <div>Dashboard</div>;
};

const DashboardPage = async () => {
  const session = await caller.auth.session();

  if (!session.user) {
    redirect("/sign-in");
  }

  return <Dashboard />;
};

export default DashboardPage;
