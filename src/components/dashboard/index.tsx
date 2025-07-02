"use client"
import GeneratorCardsColumn from "./generator-cards-column";
import InputColumn from "./input-column";
import OutputCardsColumn from "./output-cards-column";
import { useDashboardDialogs } from "@/hooks/use-dashboard-dialogs";

export default function Dashboard() {
  const { dialogs } = useDashboardDialogs();

  return (
    <>
      <main className="flex h-full w-full gap-1 overflow-hidden">
        <div className="w-1/3 h-full flex flex-col min-w-0">
          <InputColumn />
        </div>
        <div className="w-1/3 h-full flex flex-col min-w-0">
          <GeneratorCardsColumn />
        </div>
        <div className="w-1/3 h-full flex flex-col min-w-0">
          <OutputCardsColumn />
        </div>
      </main>
      {dialogs}
    </>
  )
}