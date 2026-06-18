import { useState } from "react";
import type { FormEvent } from "react";
import { GraduationCap, School } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import type { AuthUser } from "@/types";
import type { UserRole } from "@/types/education";

type AuthProps = {
  initialRole?: "student" | "teacher";
  login: (email: string, password: string, requestedRole?: UserRole) => Promise<AuthUser>;
  register: (email: string, password: string, name?: string) => Promise<AuthUser>;
  onDone: (user: AuthUser) => void;
};

export function Auth({ initialRole = "student", login, register, onDone }: AuthProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"student" | "teacher">(initialRole);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setBusy(true);

    try {
      let user: AuthUser;
      if (mode === "login") {
        user = await login(email, password, role);
      } else {
        user = await register(email, password, name);
      }
      onDone(user);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败，请稍后再试");
    } finally {
      setBusy(false);
    }
  }

  function fillTestAccount(nextRole: "student" | "teacher") {
    setMode("login");
    setRole(nextRole);
    setEmail(`${nextRole}@test.com`);
    setPassword("123456");
    setMessage("");
  }

  return (
    <div className="rounded-[1.8rem] bg-[linear-gradient(135deg,#F7F1E4_0%,#EAF5F2_54%,#FBE5DF_100%)] px-3 py-5 sm:px-6">
      <PageHeader title="登录 / 注册" subtitle="选择学生或教师身份进入对应工作台。真实账号仍使用现有后端认证。" />

      <GameCard className="mx-auto max-w-xl bg-white/82">
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button className={`min-h-20 rounded-2xl border p-3 text-left transition ${role === "student" ? "border-tide bg-tide/10 text-ink" : "border-white/80 bg-white/64 text-ink/58"}`} onClick={() => setRole("student")} type="button">
            <GraduationCap className="size-5 text-tide" />
            <p className="mt-2 text-sm font-black">学生身份</p>
            <p className="mt-1 text-xs font-semibold">进入学习中心</p>
          </button>
          <button className={`min-h-20 rounded-2xl border p-3 text-left transition ${role === "teacher" ? "border-ink/20 bg-ink/5 text-ink" : "border-white/80 bg-white/64 text-ink/58"}`} onClick={() => setRole("teacher")} type="button">
            <School className="size-5 text-ink" />
            <p className="mt-2 text-sm font-black">教师身份</p>
            <p className="mt-1 text-xs font-semibold">进入管理中心</p>
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-ink/5 p-1">
          <button
            className={`min-h-11 rounded-xl text-sm font-black ${mode === "login" ? "bg-ink text-white shadow-insetGame" : "text-ink/62"}`}
            onClick={() => setMode("login")}
            type="button"
          >
            登录
          </button>
          <button
            className={`min-h-11 rounded-xl text-sm font-black ${mode === "register" ? "bg-ink text-white shadow-insetGame" : "text-ink/62"}`}
            onClick={() => setMode("register")}
            type="button"
          >
            注册
          </button>
        </div>

        <form className="space-y-3" onSubmit={submit}>
          {mode === "register" && (
            <input
              className="min-h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink"
              onChange={(event) => setName(event.target.value)}
              placeholder="昵称，可不填"
              value={name}
            />
          )}
          <input
            className="min-h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="邮箱"
            type="email"
            value={email}
          />
          <input
            className="min-h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink"
            onChange={(event) => setPassword(event.target.value)}
            placeholder={mode === "login" ? "密码" : "密码，至少 8 位"}
            type="password"
            value={password}
          />
          {message && <p className="rounded-2xl bg-coral/10 px-4 py-3 text-sm font-bold text-coral">{message}</p>}
          <button
            className="min-h-12 w-full rounded-2xl bg-coral px-4 py-3 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy}
            type="submit"
          >
            {busy ? "处理中..." : mode === "login" ? "登录" : "注册并登录"}
          </button>
        </form>

        <div className="mt-5 rounded-2xl border border-gold/20 bg-gold/10 p-4">
          <p className="text-sm font-black text-ink">开发测试账号</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-ink/56">仅用于当前前端测试版本，密码固定为 123456。不要用于真实学生数据。</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button className="min-h-10 rounded-2xl bg-white/82 px-3 text-xs font-black text-tide" onClick={() => fillTestAccount("student")} type="button">student@test.com</button>
            <button className="min-h-10 rounded-2xl bg-white/82 px-3 text-xs font-black text-ink" onClick={() => fillTestAccount("teacher")} type="button">teacher@test.com</button>
          </div>
        </div>
      </GameCard>
    </div>
  );
}
