import { useState } from "react";
import { Activity, LockKeyhole } from "lucide-react";
import { useAuth } from "./AuthProvider";

export function LoginPage() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.error) setError(result.error);
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="brand auth-card__brand">
          <div className="brand__mark">
            <Activity size={20} strokeWidth={2} />
          </div>
          <div>
            <strong>Bull Media Ops</strong>
            <span>Supabase Staging</span>
          </div>
        </div>

        <div className="auth-card__header">
          <LockKeyhole size={22} strokeWidth={1.9} />
          <div>
            <h1>Acessar plataforma</h1>
            <p>Entre com o usuário criado no projeto Supabase staging.</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>E-mail</span>
            <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </label>
          <label>
            <span>Senha</span>
            <input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          </label>
          {error ? <p className="auth-form__error">{error}</p> : null}
          <button className="auth-form__submit" disabled={isLoading || submitting} type="submit">
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
