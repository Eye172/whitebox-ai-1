import CreateVacancy from "@/components/hr/CreateVacancy";
import { PageHeader } from "@/components/hr/PageHeader";

export default function NewVacancyPage() {
  return (
    <div className="p-6 md:p-8">
      <PageHeader title="Create vacancy" sub="Turn a role into a full, transparent evaluation config." />
      <CreateVacancy />
    </div>
  );
}
