import { useState } from "react";
import type { FormEvent } from "react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";

type AuthProps = {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  onDone: () => void;
};

export function Auth({ login, register, onDone }: AuthProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
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
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      onDone();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败，请稍后再试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="登录 / 注册" subtitle="登录后可以把闯关进度和错题保存到后端；不登录也可以继续游客模式。" />

      <GameCard className="mx-auto max-w-xl">
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
            placeholder="密码，至少 8 位"
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
      </GameCard>
    </div>
  );
}
