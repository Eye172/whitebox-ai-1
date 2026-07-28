import Sidebar from "@/components/hr/Sidebar";
import TopBar from "@/components/hr/TopBar";
import CommandKProvider from "@/components/hr/CommandK";

export default function HrLayout({ children }: { children: React.ReactNode }) {
  return (
    <CommandKProvider>
      <Sidebar />
      <div className="pl-[232px]">
        <TopBar />
        <main className="min-h-[calc(100vh-52px)]">{children}</main>
      </div>
    </CommandKProvider>
  );
}
