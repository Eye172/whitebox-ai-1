import Settings from "@/components/hr/Settings";
import { PageHeader } from "@/components/hr/PageHeader";

export default function SettingsPage() {
  return (
    <div className="p-6 md:p-8">
      <PageHeader title="Settings" sub="Integrations, roles, compliance, and the token-driven look." />
      <Settings />
    </div>
  );
}
