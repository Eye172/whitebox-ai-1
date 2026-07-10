import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-server";
import HRShell from "@/components/hr/HRShell";

export default async function HRLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <HRShell user={user}>{children}</HRShell>;
}
