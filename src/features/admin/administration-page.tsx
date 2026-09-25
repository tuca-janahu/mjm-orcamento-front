import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useOutletContext } from "react-router";
import { api } from "../../lib/api";
import { apiErrorMessage } from "../../lib/api-error";
import type {
  AuthenticatedOutletContext,
  InternalUserDto,
  PricingConfigDto,
  UserInvitationDto,
} from "../../lib/api-types";
import { formatDate, labelFromEnum } from "../../lib/format";
import { ui } from "../../lib/ui";

type Section = "users" | "pricing";

const accentedWords: Record<string, string> = {
  adaptacao: "adaptação",
  administracao: "administração",
  analise: "análise",
  autenticacao: "autenticação",
  basica: "básica",
  basicas: "básicas",
  basico: "básico",
  basicos: "básicos",
  configuracao: "configuração",
  configuracoes: "configurações",
  conteudo: "conteúdo",
  formulario: "formulário",
  formularios: "formulários",
  gestao: "gestão",
  implantacao: "implantação",
  integracao: "integração",
  integracoes: "integrações",
  manutencao: "manutenção",
  migracao: "migração",
  modulo: "módulo",
  modulos: "módulos",
  notificacao: "notificação",
  notificacoes: "notificações",
  pagina: "página",
  paginas: "páginas",
  padrao: "padrão",
  permissao: "permissão",
  permissoes: "permissões",
  producao: "produção",
  reducao: "redução",
  relatorio: "relatório",
  relatorios: "relatórios",
  secao: "seção",
  secoes: "seções",
  unica: "única",
  unicas: "únicas",
  unico: "único",
  unicos: "únicos",
  urgencia: "urgência",
  prospeccao: "prospecção",
  execucao: "execução",
  preparacao: "preparação",
  concluido: "concluído",
};

function accentedLabel(value: string): string {
  return value.replace(/[A-Za-zÀ-ÿ]+/g, (word) => {
    const replacement = accentedWords[word.toLocaleLowerCase("pt-BR")];
    if (replacement === undefined) return word;
    return word[0] === word[0]?.toLocaleUpperCase("pt-BR")
      ? replacement[0]?.toLocaleUpperCase("pt-BR") + replacement.slice(1)
      : replacement;
  });
}

export function AdministrationPage() {
  const { user: authenticatedUser } =
    useOutletContext<AuthenticatedOutletContext>();
  const [section, setSection] = useState<Section>("users");
  const [users, setUsers] = useState<InternalUserDto[]>([]);
  const [invitations, setInvitations] = useState<UserInvitationDto[]>([]);
  const [pricingConfigs, setPricingConfigs] = useState<PricingConfigDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");
  const [pricingApplication, setPricingApplication] = useState("WEBSITE");
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [savingPricingId, setSavingPricingId] = useState<string | null>(null);
  const [resendingInvitationId, setResendingInvitationId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersResponse, invitationsResponse, pricingResponse] = await Promise.all([
        api.get<{ users: InternalUserDto[] }>("/users"),
        api.get<{ invitations: UserInvitationDto[] }>("/user-invitations"),
        api.get<{ pricingConfigs: PricingConfigDto[] }>("/pricing-configs"),
      ]);
      setUsers(usersResponse.data.users);
      setInvitations(invitationsResponse.data.invitations);
      setPricingConfigs(pricingResponse.data.pricingConfigs);
      setDraftValues(
        Object.fromEntries(
          pricingResponse.data.pricingConfigs.map((config) => [
            config.id,
            config.value,
          ]),
        ),
      );
    } catch (caught) {
      setError(
        apiErrorMessage(
          caught,
          "Não foi possível carregar a área administrativa.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticatedUser.role === "ADMIN") void loadData();
  }, [authenticatedUser.role, loadData]);

  const pricingApplications = useMemo(
    () =>
      Array.from(
        new Set(pricingConfigs.map((config) => config.applicationType)),
      ),
    [pricingConfigs],
  );

  const pricingGroups = useMemo(
    () =>
      pricingConfigs
        .filter((config) => config.applicationType === pricingApplication)
        .reduce<Record<string, PricingConfigDto[]>>((groups, config) => {
          (groups[config.category] ??= []).push(config);
          return groups;
        }, {}),
    [pricingApplication, pricingConfigs],
  );

  if (authenticatedUser.role !== "ADMIN") return <Navigate to="/" replace />;

  async function createInvitation(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const { data } = await api.post<{ invitation: UserInvitationDto }>("/user-invitations", {
        name,
        email,
        role,
      });
      setInvitations((current) => [data.invitation, ...current]);
      setName("");
      setEmail("");
      setRole("USER");
      setSuccess(`Convite enviado para ${data.invitation.email}.`);
    } catch (caught) {
      try {
        const response = await api.get<{ invitations: UserInvitationDto[] }>("/user-invitations");
        setInvitations(response.data.invitations);
      } catch {
        // Preserve the original delivery error.
      }
      setError(
        apiErrorMessage(caught, "Não foi possível enviar o convite."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function resendInvitation(invitation: UserInvitationDto): Promise<void> {
    setResendingInvitationId(invitation.id);
    setError(null);
    setSuccess(null);
    try {
      const { data } = await api.post<{ invitation: UserInvitationDto }>(
        `/user-invitations/${invitation.id}/resend`,
      );
      setInvitations((current) =>
        current.map((item) => item.id === invitation.id ? data.invitation : item),
      );
      setSuccess(`Convite reenviado para ${data.invitation.email}.`);
    } catch (caught) {
      try {
        const response = await api.get<{ invitations: UserInvitationDto[] }>("/user-invitations");
        setInvitations(response.data.invitations);
      } catch {
        // Preserve the original delivery error.
      }
      setError(apiErrorMessage(caught, "Não foi possível reenviar o convite."));
    } finally {
      setResendingInvitationId(null);
    }
  }

  async function savePricing(config: PricingConfigDto): Promise<void> {
    setSavingPricingId(config.id);
    setError(null);
    setSuccess(null);
    try {
      const { data } = await api.patch<{ pricingConfig: PricingConfigDto }>(
        `/pricing-configs/${config.id}`,
        { value: draftValues[config.id] },
      );
      setPricingConfigs((current) =>
        current.map((item) =>
          item.id === config.id ? data.pricingConfig : item,
        ),
      );
      setDraftValues((current) => ({
        ...current,
        [config.id]: data.pricingConfig.value,
      }));
      setSuccess(`Valor de “${accentedLabel(config.name)}” atualizado.`);
    } catch (caught) {
      setError(apiErrorMessage(caught, "Não foi possível atualizar o valor."));
    } finally {
      setSavingPricingId(null);
    }
  }

  return (
    <div className={ui.pageContent}>
      <header className={ui.pageHeading}>
        <div>
          <p className={ui.eyebrow}>Acesso restrito</p>
          <h1 className={ui.pageTitle}>Administração</h1>
          <p className={ui.subtitle}>
            Gerencie as contas internas e os valores usados nos novos
            orçamentos.
          </p>
        </div>
      </header>

      <div
        className="mb-6 flex border-b border-zinc-300"
        role="tablist"
        aria-label="Administração"
      >
        <button
          className={`min-h-11 cursor-pointer border-0 border-b-2 bg-transparent px-5 text-[0.625rem] font-bold tracking-[0.1em] uppercase ${section === "users" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-500"}`}
          type="button"
          role="tab"
          aria-selected={section === "users"}
          onClick={() => setSection("users")}
        >
          Usuários internos
        </button>
        <button
          className={`min-h-11 cursor-pointer border-0 border-b-2 bg-transparent px-5 text-[0.625rem] font-bold tracking-[0.1em] uppercase ${section === "pricing" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-500"}`}
          type="button"
          role="tab"
          aria-selected={section === "pricing"}
          onClick={() => setSection("pricing")}
        >
          Precificação
        </button>
      </div>

      {error && (
        <div className={`${ui.error} mb-5`} role="alert">
          {error}
        </div>
      )}
      {success && (
        <div
          className="mb-5 border-l-[3px] border-green-600 bg-green-50 px-3.5 py-3 text-[0.8125rem] text-green-800"
          role="status"
        >
          {success}
        </div>
      )}
      {loading && <div className={ui.loading}>Carregando configurações...</div>}

      {!loading && section === "users" && (
        <div className="grid items-start gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <form
            className={`${ui.panel} grid gap-5 p-5 sm:p-6`}
            onSubmit={(event) => void createInvitation(event)}
          >
            <div>
              <p className={ui.eyebrow}>Novo acesso</p>
              <h2 className="mt-2 mb-1 text-lg">Enviar convite</h2>
              <p className="m-0 text-xs leading-relaxed text-zinc-500">
                A pessoa receberá um link válido por 48 horas para definir a própria senha.
              </p>
            </div>
            <label className={ui.field}>
              Nome
              <input
                className={ui.input}
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={120}
                required
              />
            </label>
            <label className={ui.field}>
              E-mail
              <input
                className={ui.input}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className={ui.field}>
              Perfil
              <select
                className={ui.input}
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as "ADMIN" | "USER")
                }
              >
                <option value="USER">Usuário</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </label>
            <button
              className={ui.primaryAction}
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Enviando..." : "Enviar convite"}
            </button>
          </form>

          <section className={ui.panel}>
            <header className={ui.panelHeader}>
              <div>
                <p className={ui.eyebrow}>Equipe</p>
                <h2 className="mt-2 mb-0 text-lg">Contas internas</h2>
              </div>
              <span className={ui.moduleStatus}>{users.length} contas</span>
            </header>
            {users.length === 0 && (
              <div className={ui.empty}>Nenhuma conta cadastrada.</div>
            )}
            {users.map((user) => (
              <div
                className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-zinc-200 px-5 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_120px_120px]"
                key={user.id}
              >
                <span className="grid gap-1">
                  <strong className="text-xs">{user.name}</strong>
                  <small className="text-[0.6875rem] text-zinc-500">
                    {user.email}
                  </small>
                </span>
                <span className="text-[0.625rem] font-bold tracking-[0.08em] text-zinc-600 uppercase">
                  {user.role === "ADMIN" ? "Administrador" : "Usuário"}
                </span>
                <span className="hidden text-[0.6875rem] text-zinc-500 sm:block">
                  Desde {formatDate(user.createdAt)}
                </span>
              </div>
            ))}
          </section>
          <section className={`${ui.panel} xl:col-start-2`}>
            <header className={ui.panelHeader}>
              <div>
                <p className={ui.eyebrow}>Aguardando ativação</p>
                <h2 className="mt-2 mb-0 text-lg">Convites</h2>
              </div>
              <span className={ui.moduleStatus}>{invitations.length} convites</span>
            </header>
            {invitations.length === 0 && (
              <div className={ui.empty}>Nenhum convite pendente.</div>
            )}
            {invitations.map((invitation) => (
              <div
                className="grid gap-3 border-b border-zinc-200 px-5 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_110px_150px_auto] sm:items-center"
                key={invitation.id}
              >
                <span className="grid gap-1">
                  <strong className="text-xs">{invitation.name}</strong>
                  <small className="text-[0.6875rem] text-zinc-500">{invitation.email}</small>
                </span>
                <span className="text-[0.625rem] font-bold uppercase text-zinc-600">
                  {invitation.role === "ADMIN" ? "Administrador" : "Usuário"}
                </span>
                <span className="grid gap-1 text-[0.6875rem] text-zinc-500">
                  <strong className="text-[0.625rem] uppercase">
                    {invitation.status === "PENDING" ? "Pendente" : invitation.status === "DELIVERY_FAILED" ? "Falha no envio" : invitation.status === "EXPIRED" ? "Expirado" : "Enviando"}
                  </strong>
                  <span>Validade {formatDate(invitation.expiresAt)}</span>
                </span>
                <button
                  className={ui.secondaryAction}
                  type="button"
                  disabled={resendingInvitationId !== null}
                  onClick={() => void resendInvitation(invitation)}
                >
                  {resendingInvitationId === invitation.id ? "Reenviando..." : "Reenviar"}
                </button>
              </div>
            ))}
          </section>
        </div>
      )}

      {!loading && section === "pricing" && (
        <div className="grid gap-6">
          <p className="m-0 max-w-3xl text-sm leading-relaxed text-zinc-600">
            As alterações valem para novos orçamentos e recálculos explícitos.
            Orçamentos já finalizados preservam os valores registrados.
          </p>
          <div
            className="flex flex-wrap border-b border-zinc-300"
            role="tablist"
            aria-label="Tipo de aplicação"
          >
            {pricingApplications.map((applicationType) => (
              <button
                className={`min-h-11 cursor-pointer border-0 border-b-2 bg-transparent px-5 text-[0.625rem] font-bold tracking-[0.1em] uppercase ${pricingApplication === applicationType ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-500 hover:text-zinc-950"}`}
                type="button"
                role="tab"
                aria-selected={pricingApplication === applicationType}
                key={applicationType}
                onClick={() => setPricingApplication(applicationType)}
              >
                {accentedLabel(labelFromEnum(applicationType))}
              </button>
            ))}
          </div>
          {Object.entries(pricingGroups).map(([category, configs]) => {
            return (
              <section className={ui.panel} key={category}>
                <header className={ui.panelHeader}>
                  <div>
                    <p className={ui.eyebrow}>
                      {accentedLabel(labelFromEnum(pricingApplication))}
                    </p>
                    <h2 className="mt-2 mb-0 text-lg">
                      {accentedLabel(labelFromEnum(category))}
                    </h2>
                  </div>
                  <span className={ui.moduleStatus}>
                    {configs.length} valores
                  </span>
                </header>
                {configs.map((config) => (
                  <div
                    className="grid items-center gap-4 border-b border-zinc-200 px-5 py-4 last:border-b-0 md:grid-cols-[minmax(220px,1fr)_170px_120px]"
                    key={config.id}
                  >
                    <span className="grid gap-1">
                      <strong className="text-xs">
                        {accentedLabel(config.name)}
                      </strong>
                      <small className="text-[0.625rem] tracking-wide text-zinc-400">
                        {config.code}
                      </small>
                    </span>
                    <label className={ui.field}>
                      <span className="sr-only">
                        Valor de {accentedLabel(config.name)}
                      </span>
                      <div className="flex items-end gap-2">
                        <input
                          className={ui.input}
                          aria-label={`Valor de ${accentedLabel(config.name)}`}
                          type="number"
                          min={
                            config.configType === "MULTIPLIER" ? "0.0001" : "0"
                          }
                          max={
                            config.configType === "PERCENTAGE"
                              ? "100"
                              : undefined
                          }
                          step="0.0001"
                          value={config.configType ===
                            "MULTIPLIER" || config.configType === "PERCENTAGE"
                            ? Number(draftValues[config.id] ?? "").toFixed(1).toString()
                            : Number(draftValues[config.id] ?? "").toFixed(2).toString()}
                          onChange={(event) =>
                            setDraftValues((current) => ({
                              ...current,
                              [config.id]: event.target.value,
                            }))
                          }
                        />
                        <span className="pb-2 text-[0.625rem] text-zinc-500">
                          {config.configType === "MULTIPLIER"
                            ? "×"
                            : config.configType === "PERCENTAGE"
                              ? "%"
                              : "R$"}
                        </span>
                      </div>
                    </label>
                    <button
                      className={ui.secondaryAction}
                      type="button"
                      disabled={
                        savingPricingId !== null ||
                        draftValues[config.id] === config.value
                      }
                      onClick={() => void savePricing(config)}
                    >
                      {savingPricingId === config.id ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
