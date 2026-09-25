import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { BrandMark } from "../../components/brand-mark";
import { PasswordInput } from "../../components/password-input";
import { api } from "../../lib/api";
import { apiErrorMessage } from "../../lib/api-error";

type PageState = "loading" | "ready" | "invalid" | "expired" | "used";
type PreviewState = Exclude<PageState, "loading">;

function getPreviewState(value: string | null): PreviewState | null {
  if (!import.meta.env.DEV) return null;
  if (
    value === "ready" ||
    value === "invalid" ||
    value === "expired" ||
    value === "used"
  )
    return value;
  return null;
}

function activationErrorState(
  error: unknown,
): Exclude<PageState, "loading" | "ready"> {
  if (!axios.isAxiosError<{ error?: { code?: string } }>(error))
    return "invalid";
  const code = error.response?.data?.error?.code;
  if (code === "ACTIVATION_EXPIRED") return "expired";
  if (code === "ACTIVATION_ALREADY_USED") return "used";
  return "invalid";
}

function isActivationLinkError(error: unknown): boolean {
  if (!axios.isAxiosError<{ error?: { code?: string } }>(error)) return false;
  return [
    "INVALID_ACTIVATION_TOKEN",
    "ACTIVATION_EXPIRED",
    "ACTIVATION_ALREADY_USED",
  ].includes(error.response?.data?.error?.code ?? "");
}

const stateMessage = {
  invalid: [
    "Link inválido",
    "Este link de ativação não é válido. Solicite um novo convite ao administrador.",
  ],
  expired: [
    "Link expirado",
    "O prazo de 48 horas terminou. Solicite o reenvio do convite ao administrador.",
  ],
  used: [
    "Link já utilizado",
    "Esta conta já foi ativada. Entre com o e-mail e a senha definidos anteriormente.",
  ],
} as const;

export function ActivateAccountPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const previewState = getPreviewState(searchParams.get("preview"));
  const [state, setState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    if (previewState !== null) {
      setState(previewState);
      return () => {
        active = false;
      };
    }
    if (token === "") {
      setState("invalid");
      return () => {
        active = false;
      };
    }
    api
      .post("/auth/activations/validate", { token })
      .then(() => {
        if (active) setState("ready");
      })
      .catch((caught: unknown) => {
        if (active) setState(activationErrorState(caught));
      });
    return () => {
      active = false;
    };
  }, [previewState, token]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (previewState !== null) return;
    setError(null);
    if (password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/auth/activations/accept", { token, password });
      void navigate("/", { replace: true });
    } catch (caught) {
      if (isActivationLinkError(caught)) setState(activationErrorState(caught));
      else
        setError(apiErrorMessage(caught, "Não foi possível ativar a conta."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-black/90 p-6">
      <section className="w-full max-w-[440px] bg-white">
        <div className="mb-8 bg-black p-4 py-8 text-white">
          <BrandMark />
        </div>
        {state === "loading" && (
          <p role="status" className="text-sm text-zinc-600">
            Validando convite...
          </p>
        )}
        <div className="px-6 pb-8">
        {(state === "invalid" || state === "expired" || state === "used") && (
          <div className="grid gap-3">
            <h1 className="m-0 text-2xl">{stateMessage[state][0]}</h1>
            <p className="m-0 text-sm leading-relaxed text-zinc-600">
              {stateMessage[state][1]}
            </p>
            {state === "used" && (
              <button
                className="mt-3 border border-zinc-950 bg-zinc-950 px-4 py-3 text-xs font-bold text-white uppercase"
                onClick={() => void navigate("/login", { replace: true })}
              >
                Ir para o login
              </button>
            )}
          </div>
        )}
        {state === "ready" && (
          <form
            className="grid gap-6"
            onSubmit={(event) => void submit(event)}
            noValidate
          >
            <header>
              <p className="m-0 text-[0.625rem] font-bold tracking-[0.2em] text-zinc-500 uppercase">
                Ativação de conta
              </p>
              <h1 className="mt-3 mb-2 text-3xl">Defina sua senha</h1>
              <p className="m-0 text-sm text-zinc-600">
                Use pelo menos 8 caracteres.
              </p>
            </header>
            <label className="grid gap-2 text-xs font-bold text-zinc-600 uppercase">
              Senha
              <PasswordInput
                aria-label="Senha"
                className="w-full border-0 border-b border-zinc-300 bg-transparent py-3 text-sm text-zinc-950 outline-none focus:border-sky-500"
                autoComplete="new-password"
                maxLength={200}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-xs font-bold text-zinc-600 uppercase">
              Confirmar senha
              <PasswordInput
                aria-label="Confirmar senha"
                className="w-full border-0 border-b border-zinc-300 bg-transparent py-3 text-sm text-zinc-950 outline-none focus:border-sky-500"
                autoComplete="new-password"
                maxLength={200}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </label>
            {error && (
              <div
                role="alert"
                className="border-l-[3px] border-red-600 bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                {error}
              </div>
            )}
            <button
              className="border border-zinc-950 bg-zinc-950 px-4 py-3 text-xs font-bold text-white uppercase disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "Ativando..." : "Ativar conta"}
            </button>
          </form>
        )}
        </div>
      </section>
    </main>
  );
}
