import { useState } from "react";
import type { FormEvent } from "react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { SubjectPill } from "@/components/SubjectPill";
import { subjectLabels } from "@/lib/labels";
import type { ScheduleItem, Subject } from "@/types";

const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const subjects: Subject[] = ["history", "politics", "geography", "biology", "math", "english"];

type TimetableProps = {
  items: ScheduleItem[];
  addItem: (item: Omit<ScheduleItem, "id" | "done">) => void;
  toggleDone: (id: string) => void;
  quickAdd: (subject: Subject) => void;
};

export function Timetable({ items, addItem, toggleDone, quickAdd }: TimetableProps) {
  const [day, setDay] = useState("周一");
  const [time, setTime] = useState("19:30");
  const [subject, setSubject] = useState<Subject>("history");
  const [title, setTitle] = useState("");
  const [task, setTask] = useState("");

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !task.trim()) {
      return;
    }
    addItem({ day, time, subject, title: title.trim(), task: task.trim() });
    setTitle("");
    setTask("");
  }

  return (
    <div>
      <PageHeader title="课程表页" subtitle="安排一周学习任务，完成后点一下打勾，刷新页面也会保留。" />

      <GameCard className="mb-5">
        <form className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1.3fr_2fr_auto]" onSubmit={submitTask}>
          <select className="min-h-12 rounded-2xl border border-ink/10 bg-white px-3 py-3 text-sm font-bold text-ink" onChange={(event) => setDay(event.target.value)} value={day}>
            {days.map((item) => <option key={item}>{item}</option>)}
          </select>
          <input className="min-h-12 rounded-2xl border border-ink/10 bg-white px-3 py-3 text-sm font-bold text-ink" onChange={(event) => setTime(event.target.value)} type="time" value={time} />
          <select className="min-h-12 rounded-2xl border border-ink/10 bg-white px-3 py-3 text-sm font-bold text-ink" onChange={(event) => setSubject(event.target.value as Subject)} value={subject}>
            {subjects.map((item) => <option key={item} value={item}>{subjectLabels[item]}</option>)}
          </select>
          <input className="min-h-12 rounded-2xl border border-ink/10 bg-white px-3 py-3 text-sm font-bold text-ink" onChange={(event) => setTitle(event.target.value)} placeholder="任务标题" value={title} />
          <input className="min-h-12 rounded-2xl border border-ink/10 bg-white px-3 py-3 text-sm font-bold text-ink" onChange={(event) => setTask(event.target.value)} placeholder="具体要做什么" value={task} />
          <button className="min-h-12 rounded-2xl bg-tide px-4 py-3 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink" type="submit">添加</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {subjects.map((item) => (
            <button className="min-h-10 rounded-full bg-ink/6 px-4 py-2 text-xs font-black text-ink/64 transition hover:bg-white hover:text-ink" key={item} onClick={() => quickAdd(item)} type="button">
              快速加一个{subjectLabels[item]}自习
            </button>
          ))}
        </div>
      </GameCard>

      <div className="grid gap-4 lg:grid-cols-7">
        {days.map((dayName) => {
          const dayItems = items.filter((item) => item.day === dayName);

          return (
            <section className="rounded-[1.4rem] border border-white/70 bg-white/52 p-3 shadow-soft" key={dayName}>
              <h2 className="mb-3 text-center text-sm font-black text-ink">{dayName}</h2>
              <div className="space-y-2">
                {dayItems.map((item) => (
                  <button
                    className={`w-full rounded-2xl border p-3 text-left transition ${item.done ? "border-leaf/30 bg-leaf/12" : "border-white/70 bg-white/82 hover:-translate-y-0.5 hover:shadow-game"}`}
                    key={item.id}
                    onClick={() => toggleDone(item.id)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-ink/52">{item.time}</span>
                      <SubjectPill subject={item.subject} />
                    </div>
                    <h3 className={`mt-2 text-sm font-black ${item.done ? "text-ink/48 line-through" : "text-ink"}`}>{item.title}</h3>
                    <p className="mt-1 text-xs font-semibold leading-5 text-ink/62">{item.task}</p>
                    <p className="mt-2 text-xs font-black text-tide">{item.done ? "已完成" : "点我标记完成"}</p>
                  </button>
                ))}
                {dayItems.length === 0 && <p className="rounded-2xl bg-white/60 p-3 text-center text-xs font-bold text-ink/45">空</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
