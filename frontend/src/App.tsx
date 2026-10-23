import { useState, useEffect, lazy, Suspense, type FormEvent } from "react";
import { Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Download,
  FileText,
  LayoutDashboard,
  UserRound,
  BriefcaseBusiness,
  GraduationCap,
  Code2,
  FolderKanban,
  Settings,
  LogOut,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  Globe,
  Eye,
  Menu,
  X,
  Save,
} from "lucide-react";
import { api, pdfRequest } from "./api";
import { Brand, Status, PortfolioView } from "./components";
import { demo } from "../../shared/demo";
import {
  labels,
  sections,
  emptyItem,
  type Portfolio,
  type Section,
  type Item,
  type ItemInput,
  type Profile,
  type CVOptions,
} from "../../shared/schema";
const PdfPreview = lazy(() => import("./PdfPreview"));
type Tab = "overview" | "profile" | Section | "cv" | "settings";
const icons = {
  overview: LayoutDashboard,
  profile: UserRound,
  experiences: BriefcaseBusiness,
  education: GraduationCap,
  skills: Code2,
  projects: FolderKanban,
  cv: FileText,
  settings: Settings,
};
const tabNames: Record<Tab, string> = {
  overview: "Vue d’ensemble",
  profile: "Mon profil",
  ...labels,
  cv: "Mon CV",
  settings: "Paramètres",
};
function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function cvName(name: string) {
  return (
    "CV_" +
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "") +
    ".pdf"
  );
}
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/connexion" element={<Auth />} />
      <Route path="/inscription" element={<Auth register />} />
      <Route path="/app" element={<Dashboard />} />
      <Route path="/demo" element={<PortfolioView data={demo} preview />} />
      <Route path="/p/:slug" element={<Public />} />
      <Route
        path="*"
        element={
          <div className="center">
            <h1>Page introuvable</h1>
            <Link to="/">Retour à l’accueil</Link>
          </div>
        }
      />
    </Routes>
  );
}
function Landing() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <Brand />
        <div>
          <Link to="/demo">
            Voir un portfolio <ArrowUpRight size={15} />
          </Link>
          <Link className="button secondary" to="/connexion">
            Se connecter
          </Link>
        </div>
      </nav>
      <main className="landing-main">
        <div className="landing-copy">
          <span className="eyebrow">
            <span className="live-dot" /> VOTRE PROCHAINE ÉTAPE COMMENCE ICI
          </span>
          <h1>
            Votre talent.
            <br />
            Votre histoire.
            <br />
            <em>Votre signature.</em>
          </h1>
          <p>
            Un portfolio qui vous ressemble. Un CV qui vous distingue.
            Rassemblez votre parcours, puis laissez Folio lui donner forme.
          </p>
          <div className="actions">
            <Link to="/inscription" className="button primary">
              Créer mon portfolio <ArrowRight size={18} />
            </Link>
            <Link to="/demo" className="text-link">
              Explorer un exemple ↗
            </Link>
          </div>
          <div className="landing-perks">
            <span>
              <Check size={15} />
              Portfolio public
            </span>
            <span>
              <Check size={15} />
              Deux modèles de CV
            </span>
            <span>
              <Check size={15} />
              Export PDF
            </span>
          </div>
        </div>
        <div className="landing-visual">
          <div className="float-badge">
            <span className="live-dot" />
            Votre parcours, prêt à partager
          </div>
          <div className="mini-browser">
            <div className="browser-bar">
              <i />
              <i />
              <i />
              <span>folio / camille-martin</span>
            </div>
            <div className="mini-content">
              <div className="eyebrow">BONJOUR, MOI C’EST</div>
              <h2>
                Camille Martin<span>.</span>
              </h2>
              <p>Développeuse web & créatrice d’expériences</p>
              <div className="mini-avatar">CM</div>
              <div className="tags">
                <span>React</span>
                <span>TypeScript</span>
                <span>Design</span>
              </div>
              <hr />
              <h3>Des idées. Du code. De l’impact.</h3>
              <div className="mini-projects">
                <div>
                  Agora <ArrowUpRight />
                </div>
                <div>
                  Équilibre <ArrowUpRight />
                </div>
              </div>
            </div>
          </div>
          <div className="mini-cv">
            <FileText size={23} />
            <strong>CAMILLE MARTIN</strong>
            <small>DÉVELOPPEUSE WEB</small>
            <i />
            <i />
            <i />
            <b>EXPÉRIENCES</b>
            <i />
            <i />
            <b>FORMATION</b>
            <i />
            <span>
              <Check size={14} /> CV prêt à télécharger
            </span>
          </div>
        </div>
      </main>
      <section className="landing-bottom">
        <span>UN PARCOURS. DEUX FAÇONS DE BRILLER.</span>
        <div>
          <strong>01</strong> Racontez votre parcours
        </div>
        <div>
          <strong>02</strong> Publiez votre portfolio
        </div>
        <div>
          <strong>03</strong> Générez votre CV
        </div>
      </section>
    </div>
  );
}
function Auth({ register = false }: { register?: boolean }) {
  const nav = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api(register ? "/auth/register" : "/auth/login", "POST", data);
      nav("/app");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <aside>
        <Link to="/">
          <Brand />
        </Link>
        <div>
          <span className="eyebrow">LA SUITE VOUS APPARTIENT</span>
          <h1>
            Faites place
            <br />à votre potentiel.
          </h1>
          <p>
            Votre parcours mérite mieux qu’un document oublié dans un dossier.
          </p>
        </div>
        <small>Portfolio · Parcours · CV professionnel</small>
      </aside>
      <main>
        <Link to="/" className="text-link">
          ← Retour à l’accueil
        </Link>
        <h1>
          {register
            ? "Votre histoire commence ici."
            : "Heureux de vous retrouver."}
        </h1>
        <p className="muted">
          {register
            ? "Créez votre espace personnel en quelques instants."
            : "Connectez-vous pour faire évoluer votre portfolio."}
        </p>
        <Status error={error} />
        <form onSubmit={submit}>
          {register && (
            <>
              <label>
                Nom complet
                <input
                  name="full_name"
                  required
                  minLength={2}
                  maxLength={160}
                  autoComplete="name"
                  placeholder="Camille Martin"
                />
              </label>
              <label>
                Adresse de votre portfolio
                <span className="input-hint">/p/mon-prenom-mon-nom</span>
                <input
                  name="slug"
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  minLength={3}
                  maxLength={80}
                  placeholder="camille-martin"
                />
              </label>
            </>
          )}
          <label>
            Courriel
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="vous@exemple.com"
            />
          </label>
          <label>
            Mot de passe
            <input
              name="password"
              type="password"
              required
              minLength={12}
              maxLength={72}
              autoComplete={register ? "new-password" : "current-password"}
            />
            <span className="input-hint">12 caractères minimum.</span>
          </label>
          <button className="primary full" disabled={busy}>
            {busy
              ? "Un instant…"
              : register
                ? "Créer mon compte"
                : "Me connecter"}
            <ArrowRight size={18} />
          </button>
        </form>
        <p>
          {register ? "Vous avez déjà un compte ?" : "Pas encore de compte ?"}{" "}
          <Link to={register ? "/connexion" : "/inscription"}>
            {register ? "Se connecter" : "Créer mon portfolio"}
          </Link>
        </p>
      </main>
    </div>
  );
}
function Public() {
  const { slug } = useParams();
  const [data, setData] = useState<Portfolio>();
  const [error, setError] = useState("");
  useEffect(() => {
    setData(undefined);
    setError("");
    api<Portfolio>("/public/" + encodeURIComponent(slug || ""))
      .then(setData)
      .catch((e) => setError(e.message));
  }, [slug]);
  async function download() {
    try {
      downloadBlob(
        await pdfRequest(
          "/api/public/" + encodeURIComponent(slug || "") + "/cv",
        ),
        cvName(data!.profile.full_name),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <Status error={error} />
      {data ? (
        <PortfolioView
          data={data}
          onDownload={data.user.allow_cv ? download : undefined}
        />
      ) : (
        <div className="center">
          {error ? (
            <Link to="/">Retour à l’accueil</Link>
          ) : (
            "Chargement du portfolio…"
          )}
        </div>
      )}
    </>
  );
}
function Dashboard() {
  const nav = useNavigate();
  const [data, setData] = useState<Portfolio>();
  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  async function load() {
    const d = await api<Portfolio>("/me");
    setData(d);
    return d;
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  async function action(
    fn: () => Promise<unknown>,
    success = "Modifications enregistrées.",
  ) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
      await load();
      setMessage(success);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function select(t: Tab) {
    setTab(t);
    setOpen(false);
    setMessage("");
    setError("");
  }
  if (!data)
    return (
      <div className="center">
        <Brand />
        <h2>
          {error
            ? "Connexion nécessaire ou service indisponible"
            : "Ouverture de votre espace…"}
        </h2>
        <Status error={error} />
        {error && (
          <>
            <Link to="/connexion">Se connecter</Link>
            <button onClick={() => load().catch((e) => setError(e.message))}>
              Réessayer
            </button>
          </>
        )}
      </div>
    );
  const count = sections.reduce((n, s) => n + data[s].length, 0);
  return (
    <div className="dashboard">
      <aside className={"sidebar " + (open ? "open" : "")}>
        <Link to="/">
          <Brand />
        </Link>
        <div className="workspace-label">ESPACE PERSONNEL</div>
        <nav>
          {(Object.keys(tabNames) as Tab[]).map((t) => {
            const Icon = icons[t];
            return (
              <button
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => select(t)}
              >
                <Icon size={18} />
                {tabNames[t]}
                {t === "cv" && <span className="new-pill">PDF</span>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="avatar-small">{data.profile.full_name.charAt(0)}</div>
          <div>
            <strong>{data.profile.full_name}</strong>
            <small>Votre espace créatif</small>
          </div>
          <button
            title="Se déconnecter"
            onClick={async () => {
              try {
                await api("/auth/logout", "POST");
                nav("/connexion");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <div className="dashboard-main">
        <header className="app-header">
          <button
            className="mobile-toggle"
            aria-label="Menu"
            onClick={() => setOpen(!open)}
          >
            <Menu />
          </button>
          <span>
            Mon espace <span className="muted">/ {tabNames[tab]}</span>
          </span>
          <button className="secondary" onClick={() => setPreview(true)}>
            <Eye size={16} />
            Aperçu du portfolio
          </button>
        </header>
        <main className="workspace">
          <Status error={error} message={message} />
          <div className="page-heading">
            <div>
              <span className="eyebrow">VOTRE PARCOURS PREND FORME</span>
              <h1>
                {tab === "overview"
                  ? `Bonjour, ${data.profile.full_name.split(" ")[0]}.`
                  : tabNames[tab]}
              </h1>
              <p className="muted">
                {tab === "overview"
                  ? "Chaque expérience compte. Donnez-lui la place qu’elle mérite."
                  : tab === "cv"
                    ? "Votre parcours se transforme en un CV prêt à envoyer."
                    : "Des informations à jour, pour une première impression réussie."}
              </p>
            </div>
            {sections.includes(tab as Section) && (
              <span className="count-badge">
                {data[tab as Section].length} éléments
              </span>
            )}
          </div>
          {tab === "overview" && (
            <>
              <div className="overview-hero">
                <div>
                  <span className="eyebrow">
                    DU PARCOURS AU PREMIER CONTACT
                  </span>
                  <h2>
                    La prochaine opportunité
                    <br />
                    commence avec vous.
                  </h2>
                  <p>
                    Un seul profil pour votre portfolio et votre CV.
                    <br />
                    Mettez-le à jour ici, partagez-le partout.
                  </p>
                  <button className="primary" onClick={() => select("cv")}>
                    Créer mon CV <ArrowRight size={17} />
                  </button>
                </div>
                <div className="hero-document">
                  <FileText size={34} />
                  <strong>{data.profile.full_name}</strong>
                  <span>
                    {data.profile.headline || "Votre titre professionnel"}
                  </span>
                  <i />
                  <i />
                  <i />
                  <i />
                  <small>VOTRE PROCHAIN CHAPITRE</small>
                </div>
              </div>
              <div className="stat-grid">
                <div>
                  <UserRound />
                  <strong>{count}</strong>
                  <span>éléments de parcours</span>
                </div>
                <div>
                  <Globe />
                  <strong>{data.user.is_public ? "Public" : "Privé"}</strong>
                  <span>visibilité du portfolio</span>
                </div>
                <div>
                  <FileText />
                  <strong>2 modèles</strong>
                  <span>de CV professionnels</span>
                </div>
              </div>
              <div className="overview-grid">
                <section className="panel">
                  <h2>Les prochaines étapes</h2>
                  {(["profile", "experiences", "projects", "cv"] as Tab[]).map(
                    (t, i) => (
                      <button
                        className="step"
                        key={t}
                        onClick={() => select(t)}
                      >
                        <span>0{i + 1}</span>
                        <div>
                          <strong>{tabNames[t]}</strong>
                          <small>
                            {
                              [
                                "Présentez-vous en quelques mots",
                                "Mettez en valeur votre expérience",
                                "Montrez ce que vous savez créer",
                                "Choisissez votre modèle et téléchargez",
                              ][i]
                            }
                          </small>
                        </div>
                        <ArrowRight size={17} />
                      </button>
                    ),
                  )}
                </section>
                <section className="panel share-panel">
                  <Globe size={30} />
                  <h2>Votre lien, votre signature.</h2>
                  <p>
                    Partagez votre portfolio avec les recruteurs et votre
                    réseau.
                  </p>
                  <code>/p/{data.user.slug}</code>
                  <button
                    className="secondary full"
                    onClick={() => select("settings")}
                  >
                    Gérer la publication <ArrowUpRight size={16} />
                  </button>
                  {data.user.is_public && (
                    <Link to={"/p/" + data.user.slug}>
                      Ouvrir le portfolio public ↗
                    </Link>
                  )}
                </section>
              </div>
            </>
          )}
          {tab === "profile" && (
            <ProfileForm
              profile={data.profile}
              busy={busy}
              onSave={(p) => action(() => api("/profile", "PUT", p))}
            />
          )}
          {sections.includes(tab as Section) && (
            <Items
              key={tab}
              section={tab as Section}
              data={data[tab as Section]}
              busy={busy}
              action={action}
            />
          )}
          {tab === "settings" && (
            <SettingsForm
              data={data}
              busy={busy}
              action={action}
              onExit={() => nav("/connexion")}
              onError={setError}
            />
          )}
          {tab === "cv" && <CVStudio data={data} />}
        </main>
        <footer className="app-footer">
          Folio · Un parcours unique, une présentation à votre image.
        </footer>
      </div>
      {preview && (
        <div className="preview-overlay">
          <div className="preview-toolbar">
            <strong>
              Aperçu ·{" "}
              {data.user.is_public ? "portfolio public" : "portfolio privé"}
            </strong>
            <button onClick={() => setPreview(false)}>
              <X size={18} />
              Fermer
            </button>
          </div>
          <PortfolioView data={data} />
        </div>
      )}
    </div>
  );
}
function ProfileForm({
  profile,
  busy,
  onSave,
}: {
  profile: Profile;
  busy: boolean;
  onSave: (p: Profile) => Promise<boolean>;
}) {
  const [value, setValue] = useState(profile);
  const names: Record<keyof Profile, string> = {
    full_name: "Nom complet",
    headline: "Titre professionnel",
    bio: "À propos de vous",
    email: "Courriel public",
    phone: "Téléphone",
    city: "Ville",
    linkedin_url: "LinkedIn",
    github_url: "GitHub",
    website_url: "Site personnel",
    photo_url: "Photo (URL publique)",
  };
  return (
    <form
      className="panel editor-form"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave(value);
      }}
    >
      <h2>Les présentations commencent ici.</h2>
      <p className="muted">
        Ces coordonnées seront visibles si vous publiez le portfolio. Le
        courriel de connexion ne change pas.
      </p>
      <div className="form-grid">
        {(Object.keys(names) as (keyof Profile)[]).map((k) => (
          <label className={k === "bio" ? "span-2" : ""} key={k}>
            {names[k]}
            {k === "bio" ? (
              <textarea
                rows={5}
                maxLength={3000}
                value={value[k]}
                onChange={(e) => setValue({ ...value, [k]: e.target.value })}
              />
            ) : (
              <input
                required={k === "full_name" || k === "email"}
                type={
                  k.endsWith("_url") ? "url" : k === "email" ? "email" : "text"
                }
                value={value[k]}
                onChange={(e) => setValue({ ...value, [k]: e.target.value })}
              />
            )}
          </label>
        ))}
      </div>
      <button className="primary" disabled={busy}>
        <Save size={16} />
        {busy ? "Enregistrement…" : "Enregistrer mon profil"}
      </button>
    </form>
  );
}
type Action = (
  fn: () => Promise<unknown>,
  success?: string,
) => Promise<boolean>;
function Items({
  section,
  data,
  busy,
  action,
}: {
  section: Section;
  data: Item[];
  busy: boolean;
  action: Action;
}) {
  const [edit, setEdit] = useState<ItemInput>();
  const [id, setId] = useState<number>();
  const [remove, setRemove] = useState<number>();
  const [formError, setFormError] = useState("");
  function add() {
    setId(undefined);
    setFormError("");
    setEdit({ ...emptyItem });
  }
  async function move(index: number, delta: number) {
    const ids = data.map((x) => x.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    await action(() => api("/" + section + "/order", "PUT", { ids }));
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (
      await action(() =>
        api("/" + section + (id ? "/" + id : ""), id ? "PUT" : "POST", {
          ...edit,
          technologies: edit?.technologies.map((t) => t.trim()).filter(Boolean),
        }),
      )
    )
      setEdit(undefined);
    else
      setFormError(
        "Enregistrement impossible. Vérifiez les champs, les dates et votre connexion.",
      );
  }
  const isSkill = section === "skills",
    isProject = section === "projects";
  return (
    <>
      <div className="list-toolbar">
        <span className="muted">
          L’ordre choisi est repris dans le portfolio et le CV.
        </span>
        <button className="primary" onClick={add}>
          <Plus size={17} />
          Ajouter
        </button>
      </div>
      {!data.length && (
        <div className="empty-state">
          <FolderKanban size={40} />
          <h2>Le début d’une belle histoire.</h2>
          <p>Ajoutez votre premier élément à cette section.</p>
          <button className="secondary" onClick={add}>
            Ajouter un élément
          </button>
        </div>
      )}
      <div className="item-list">
        {data.map((x, i) => (
          <article className="panel item-row" key={x.id}>
            <div className="item-index">{String(i + 1).padStart(2, "0")}</div>
            <div className="item-info">
              <h3>{x.title}</h3>
              <p>{isSkill ? `${x.category} · ${x.level}/5` : x.subtitle}</p>
              <small>
                {x.start_date.slice(0, 7)}
                {x.start_date && " — "}
                {x.end_date.slice(0, 7)}
              </small>
            </div>
            <div className="row-actions">
              <button
                aria-label={`Monter ${x.title}`}
                disabled={i === 0 || busy}
                onClick={() => move(i, -1)}
              >
                <ArrowUp size={16} />
              </button>
              <button
                aria-label={`Descendre ${x.title}`}
                disabled={i === data.length - 1 || busy}
                onClick={() => move(i, 1)}
              >
                <ArrowDown size={16} />
              </button>
              <button
                onClick={() => {
                  setId(x.id);
                  setFormError("");
                  setEdit(x);
                }}
              >
                Modifier
              </button>
              <button
                aria-label={`Supprimer ${x.title}`}
                onClick={() => setRemove(x.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
            {remove === x.id && (
              <div className="delete-confirm">
                Supprimer cet élément ?{" "}
                <button
                  disabled={busy}
                  className="danger"
                  onClick={async () => {
                    if (
                      await action(() =>
                        api("/" + section + "/" + x.id, "DELETE"),
                      )
                    )
                      setRemove(undefined);
                  }}
                >
                  Confirmer
                </button>
                <button onClick={() => setRemove(undefined)}>Annuler</button>
              </div>
            )}
          </article>
        ))}
      </div>
      {edit && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-title"
            onKeyDown={(e) => {
              if (e.key === "Escape") setEdit(undefined);
              if (e.key === "Tab") {
                const nodes = Array.from(
                  e.currentTarget.querySelectorAll<HTMLElement>(
                    "button:not(:disabled), input, textarea, select, a[href]",
                  ),
                );
                const first = nodes[0],
                  last = nodes[nodes.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last?.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first?.focus();
                }
              }
            }}
          >
            <div className="modal-header">
              <h2 id="editor-title">
                {id ? "Modifier" : "Ajouter"} · {labels[section]}
              </h2>
              <button aria-label="Fermer" onClick={() => setEdit(undefined)}>
                <X />
              </button>
            </div>
            <Status error={formError} />
            <form onSubmit={submit}>
              <div className="form-grid">
                <label className="span-2">
                  {isSkill
                    ? "Compétence"
                    : section === "education"
                      ? "Diplôme"
                      : isProject
                        ? "Titre du projet"
                        : "Poste"}
                  <input
                    autoFocus
                    required
                    maxLength={160}
                    value={edit.title}
                    onChange={(e) =>
                      setEdit({ ...edit, title: e.target.value })
                    }
                  />
                </label>
                {!isSkill && (
                  <>
                    <label className="span-2">
                      {section === "education"
                        ? "Établissement"
                        : isProject
                          ? "Sous-titre"
                          : "Entreprise"}
                      <input
                        maxLength={160}
                        value={edit.subtitle}
                        onChange={(e) =>
                          setEdit({ ...edit, subtitle: e.target.value })
                        }
                      />
                    </label>
                    {!isProject && (
                      <>
                        <label>
                          Date de début
                          <input
                            type="date"
                            value={edit.start_date}
                            onChange={(e) =>
                              setEdit({ ...edit, start_date: e.target.value })
                            }
                          />
                        </label>
                        <label>
                          Date de fin (vide = en cours)
                          <input
                            type="date"
                            min={edit.start_date}
                            value={edit.end_date}
                            onChange={(e) =>
                              setEdit({ ...edit, end_date: e.target.value })
                            }
                          />
                        </label>
                      </>
                    )}
                    <label className="span-2">
                      Description et réalisations
                      <textarea
                        rows={5}
                        maxLength={3000}
                        value={edit.description}
                        onChange={(e) =>
                          setEdit({ ...edit, description: e.target.value })
                        }
                      />
                    </label>
                  </>
                )}
                {isSkill && (
                  <>
                    <label>
                      Catégorie
                      <select
                        value={edit.category}
                        onChange={(e) =>
                          setEdit({
                            ...edit,
                            category: e.target.value as ItemInput["category"],
                          })
                        }
                      >
                        {[
                          "Langage",
                          "Framework",
                          "Outil",
                          "Langue",
                          "Savoir-être",
                        ].map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Niveau
                      <select
                        value={edit.level}
                        onChange={(e) =>
                          setEdit({ ...edit, level: Number(e.target.value) })
                        }
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n} / 5
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
                {isProject && (
                  <>
                    <label className="span-2">
                      Technologies (séparées par des virgules)
                      <input
                        value={edit.technologies.join(",")}
                        onChange={(e) =>
                          setEdit({
                            ...edit,
                            technologies: e.target.value.split(","),
                          })
                        }
                      />
                    </label>
                    {(["repo_url", "demo_url", "image_url"] as const).map(
                      (k) => (
                        <label key={k} className="span-2">
                          {
                            {
                              repo_url: "Dépôt Git",
                              demo_url: "Démonstration",
                              image_url: "Image du projet (URL)",
                            }[k]
                          }
                          <input
                            type="url"
                            value={edit[k]}
                            onChange={(e) =>
                              setEdit({ ...edit, [k]: e.target.value })
                            }
                          />
                        </label>
                      ),
                    )}
                  </>
                )}
              </div>
              <div className="actions">
                <button disabled={busy} className="primary">
                  {busy ? "Enregistrement…" : "Enregistrer"}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setEdit(undefined)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
function SettingsForm({
  data,
  busy,
  action,
  onExit,
  onError,
}: {
  data: Portfolio;
  busy: boolean;
  action: Action;
  onExit: () => void;
  onError: (s: string) => void;
}) {
  const [settings, setSettings] = useState(data.user);
  const [deleting, setDeleting] = useState(false);
  const [pending, setPending] = useState(false);
  async function security(e: FormEvent<HTMLFormElement>, remove = false) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    setPending(true);
    try {
      await api(
        remove ? "/account" : "/auth/password",
        remove ? "DELETE" : "PUT",
        body,
      );
      onExit();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="settings-stack">
      <form
        className="panel editor-form"
        onSubmit={(e) => {
          e.preventDefault();
          void action(() => api("/settings", "PUT", settings));
        }}
      >
        <h2>Votre présence en ligne</h2>
        <label>
          Adresse unique
          <input
            value={settings.slug}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            minLength={3}
            maxLength={80}
            onChange={(e) => setSettings({ ...settings, slug: e.target.value })}
          />
          <small>/p/{settings.slug}</small>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={settings.is_public}
            onChange={(e) =>
              setSettings({ ...settings, is_public: e.target.checked })
            }
          />
          <span>
            <strong>Publier mon portfolio</strong>
            <small>
              Votre profil, vos coordonnées et toutes vos sections deviennent
              accessibles à tous.
            </small>
          </span>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={settings.allow_cv}
            onChange={(e) =>
              setSettings({ ...settings, allow_cv: e.target.checked })
            }
          />
          <span>
            <strong>Autoriser le téléchargement public du CV</strong>
            <small>
              Le CV public moderne contient toutes les sections et vos
              coordonnées. Votre sélection privée ne le modifie pas.
            </small>
          </span>
        </label>
        <button className="primary" disabled={busy}>
          Enregistrer la visibilité
        </button>
      </form>
      <form className="panel editor-form" onSubmit={security}>
        <h2>Changer mon mot de passe</h2>
        <p className="muted">
          Toutes les sessions seront fermées après ce changement.
        </p>
        <label>
          Mot de passe actuel
          <input
            type="password"
            name="current_password"
            required
            minLength={12}
            autoComplete="current-password"
          />
        </label>
        <label>
          Nouveau mot de passe
          <input
            type="password"
            name="new_password"
            required
            minLength={12}
            maxLength={72}
            autoComplete="new-password"
          />
        </label>
        <button className="secondary" disabled={pending}>
          Changer le mot de passe
        </button>
      </form>
      <section className="panel editor-form danger-panel">
        <h2>Supprimer mon compte</h2>
        <p>
          Cette action supprime définitivement votre profil et tous les éléments
          de votre parcours.
        </p>
        {!deleting ? (
          <button className="danger" onClick={() => setDeleting(true)}>
            Supprimer mon compte…
          </button>
        ) : (
          <form onSubmit={(e) => security(e, true)}>
            <label>
              Confirmez avec votre mot de passe
              <input
                name="password"
                type="password"
                required
                minLength={12}
                autoComplete="current-password"
              />
            </label>
            <div className="actions">
              <button className="danger" disabled={pending}>
                Supprimer définitivement
              </button>
              <button type="button" onClick={() => setDeleting(false)}>
                Annuler
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
function CVStudio({ data }: { data: Portfolio }) {
  const [opts, setOpts] = useState<CVOptions>({
    template: "modern",
    language: "fr",
    sections: [...sections],
    ids: sections.flatMap((s) => data[s].map((x) => x.id)),
    includeContact: true,
  });
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [stale, setStale] = useState(true);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  function change(next: CVOptions) {
    setOpts(next);
    setStale(true);
    setUrl("");
  }
  async function generate(download = false) {
    setError("");
    setBusy(true);
    try {
      const blob = await pdfRequest(
        "/api/cv/" +
          (download ? "download" : "preview") +
          "?options=" +
          encodeURIComponent(JSON.stringify(opts)),
      );
      if (download) downloadBlob(blob, cvName(data.profile.full_name));
      else {
        setUrl(URL.createObjectURL(blob));
        setStale(false);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Status error={error} />
      <div className="cv-layout">
        <div className="cv-controls">
          <section className="panel">
            <h2>01. Votre style</h2>
            <div className="template-grid">
              {(["modern", "classic"] as const).map((t) => (
                <button
                  key={t}
                  className={
                    "template-option " + (opts.template === t ? "selected" : "")
                  }
                  onClick={() => change({ ...opts, template: t })}
                >
                  <div className={"template-thumb " + t}>
                    <b>VOTRE NOM</b>
                    <small>VOTRE TITRE</small>
                    <i />
                    <i />
                    <strong>EXPÉRIENCES</strong>
                    <i />
                    <i />
                    <i />
                    <strong>FORMATION</strong>
                    <i />
                  </div>
                  <span>
                    {t === "modern" ? "Moderne" : "Classique"}
                    {opts.template === t && <Check size={15} />}
                  </span>
                </button>
              ))}
            </div>
            <label>
              Langue des rubriques
              <select
                value={opts.language}
                onChange={(e) =>
                  change({ ...opts, language: e.target.value as "fr" | "en" })
                }
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
              <small>
                Les textes saisis ne sont pas traduits automatiquement.
              </small>
            </label>
          </section>
          <section className="panel">
            <h2>02. Votre contenu</h2>
            <label className="check-row">
              <input
                type="checkbox"
                checked={opts.includeContact}
                onChange={(e) =>
                  change({ ...opts, includeContact: e.target.checked })
                }
              />
              Inclure mes coordonnées
            </label>
            {sections.map((s) => (
              <div className="cv-section-choice" key={s}>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={opts.sections.includes(s)}
                    onChange={(e) =>
                      change({
                        ...opts,
                        sections: e.target.checked
                          ? sections.filter(
                              (x) => opts.sections.includes(x) || x === s,
                            )
                          : opts.sections.filter((x) => x !== s),
                      })
                    }
                  />
                  <strong>{labels[s]}</strong>
                </label>
                {opts.sections.includes(s) &&
                  data[s].map((x) => (
                    <label className="check-row item-check" key={x.id}>
                      <input
                        type="checkbox"
                        checked={opts.ids?.includes(x.id)}
                        onChange={(e) =>
                          change({
                            ...opts,
                            ids: e.target.checked
                              ? [...(opts.ids || []), x.id]
                              : opts.ids?.filter((id) => id !== x.id),
                          })
                        }
                      />
                      {x.title}
                    </label>
                  ))}
              </div>
            ))}
          </section>
          <button
            className="secondary full"
            disabled={busy}
            onClick={() => generate()}
          >
            <Eye size={17} />
            Actualiser l’aperçu
          </button>
          <button
            className="primary full"
            disabled={busy}
            onClick={() => generate(true)}
          >
            <Download size={17} />
            {busy ? "Génération…" : "Télécharger mon CV"}
          </button>
          <p className="muted small">
            PDF vectoriel · Texte sélectionnable · 1 à 2 pages
          </p>
        </div>
        <div className="cv-preview">
          <div className="cv-preview-bar">
            <span>
              <span className="live-dot" /> Aperçu du document
            </span>
            <small>
              {opts.template === "modern" ? "Moderne" : "Classique"} · A4
            </small>
          </div>
          {url && !stale ? (
            <>
              <Suspense fallback={<p className="center">Affichage du PDF…</p>}>
                <PdfPreview url={url} />
              </Suspense>
              <a
                className="text-link"
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                Ouvrir le PDF dans un nouvel onglet ↗
              </a>
            </>
          ) : (
            <div className="preview-placeholder">
              <FileText size={58} />
              <h2>
                Votre prochain chapitre,
                <br />
                sur papier.
              </h2>
              <p>
                Choisissez votre modèle et vos informations,
                <br />
                puis générez l’aperçu de votre CV.
              </p>
              <button
                className="primary"
                disabled={busy}
                onClick={() => generate()}
              >
                {busy ? "Création de votre CV…" : "Générer l’aperçu"}
                <ArrowRight size={17} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
