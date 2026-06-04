import type { Subject } from "@/types";
import { subjectLabels } from "@/lib/labels";

const subjectColors: Record<Subject, string> = {
  history: "bg-coral/14 text-coral",
  geography: "bg-tide/14 text-tide",
  politics: "bg-leaf/14 text-leaf"
};

export function SubjectPill({ subject }: { subject: Subject }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-black ${subjectColors[subject]}`}>{subjectLabels[subject]}</span>;
}
