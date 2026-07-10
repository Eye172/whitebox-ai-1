import Link from "next/link";
import { VACANCIES } from "@/lib/fixtures";
import { PageHeader } from "@/components/hr/PageHeader";
import { Button, VacancyStatusPill } from "@/components/ui/primitives";
import { Plus, MoreHorizontal, Copy } from "lucide-react";

export default function VacanciesPage() {
  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="Vacancies"
        sub="Every role across states — draft, live, closed."
        right={
          <Link href="/hr/vacancies/new">
            <Button>
              <Plus className="h-4 w-4" /> Create vacancy
            </Button>
          </Link>
        }
      />

      <div className="overflow-hidden rounded-md border border-hairline bg-surface">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-hairline">
              <th className="mono-label px-4 py-2.5 font-normal">Title</th>
              <th className="mono-label px-4 py-2.5 font-normal">Status</th>
              <th className="mono-label px-4 py-2.5 font-normal">Code</th>
              <th className="mono-label px-4 py-2.5 font-normal">Dept</th>
              <th className="mono-label px-4 py-2.5 text-right font-normal">Applicants</th>
              <th className="mono-label px-4 py-2.5 font-normal">Version</th>
              <th className="mono-label px-4 py-2.5 font-normal">Updated</th>
              <th className="w-10 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {VACANCIES.map((v) => (
              <tr key={v.id} className={`border-b border-hairline last:border-0 hover:bg-white/[0.02] ${v.status === "CLOSED" ? "opacity-60" : ""}`}>
                <td className="px-4 py-3">
                  <Link href={`/hr/vacancies/${v.id}/ranking`} className="font-medium text-text-hi hover:text-iris-b">
                    {v.title}
                  </Link>
                </td>
                <td className="px-4 py-3"><VacancyStatusPill status={v.status} /></td>
                <td className="px-4 py-3">
                  <span className="mono inline-flex items-center gap-1.5 text-[12px] text-text-mid">
                    {v.code} <Copy className="h-3 w-3 text-text-lo" />
                  </span>
                </td>
                <td className="px-4 py-3 text-text-mid">{v.department}</td>
                <td className="tnum mono px-4 py-3 text-right text-text-hi">{v.applicants}</td>
                <td className="mono px-4 py-3 text-text-lo">v{v.configVersion}</td>
                <td className="mono px-4 py-3 text-text-lo">{v.updated}</td>
                <td className="px-4 py-3">
                  <MoreHorizontal className="h-4 w-4 text-text-lo" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
