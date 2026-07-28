"use client";

import StudioProvider from "@/components/hr/studio/StudioProvider";
import VacancyStudio from "@/components/hr/studio/VacancyStudio";

export default function NewVacancyPage() {
  return (
    <StudioProvider>
      <VacancyStudio />
    </StudioProvider>
  );
}
