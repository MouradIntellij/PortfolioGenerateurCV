import type { Portfolio, Section } from "../../shared/schema";
import { labels, sections } from "../../shared/schema";
import { ArrowUpRight, MapPin, Mail, Download, Layers } from "lucide-react";
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">f.</span>folio
      <span className="brand-dot">.</span>
    </span>
  );
}
export function Status({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  return (
    <>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="notice success" role="status">
          {message}
        </div>
      )}
    </>
  );
}
export function PortfolioView({
  data,
  onDownload,
  preview = false,
}: {
  data: Portfolio;
  onDownload?: () => void;
  preview?: boolean;
}) {
  const p = data.profile;
  return (
    <div className="portfolio-page">
      <nav className="public-nav">
        <Brand />
        <div>
          <a href="#projects">Projets</a>
          <a href="#experiences">Parcours</a>
          {p.email && (
            <a href={`mailto:${p.email}`}>
              Contact <ArrowUpRight size={14} />
            </a>
          )}
        </div>
      </nav>
      {preview && (
        <div className="demo-banner">
          Profil fictif · Découvrez le rendu de votre futur portfolio
        </div>
      )}
      <section className="public-hero">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> PORTFOLIO PROFESSIONNEL
          </div>
          <h1>{p.full_name}</h1>
          <h2>{p.headline || "Un parcours à découvrir."}</h2>
          <p className="bio">{p.bio}</p>
          <div className="meta">
            <MapPin size={16} />
            {p.city || "Localisation non renseignée"}
            {p.phone && (
              <a href={"tel:" + p.phone.replace(/[^+0-9]/g, "")}>{p.phone}</a>
            )}
          </div>
          <div className="actions">
            {onDownload && (
              <button className="primary" onClick={onDownload}>
                <Download size={16} />
                Télécharger mon CV
              </button>
            )}
            {p.email && (
              <a className="button secondary" href={`mailto:${p.email}`}>
                <Mail size={16} />
                Me contacter
              </a>
            )}
          </div>
          <div className="socials">
            {[
              ["LinkedIn", p.linkedin_url],
              ["GitHub", p.github_url],
              ["Site web", p.website_url],
            ].map(
              ([label, url]) =>
                url && (
                  <a key={label} href={url} target="_blank" rel="noreferrer">
                    {label} ↗
                  </a>
                ),
            )}
          </div>
        </div>
        <div className="portrait">
          {p.photo_url ? (
            <img
              src={p.photo_url}
              alt={p.full_name}
              referrerPolicy="no-referrer"
            />
          ) : (
            <>
              <div className="portrait-grid" />
              <span>
                {p.full_name
                  .split(" ")
                  .map((x) => x[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <small>CONSTRUIRE. APPRENDRE. CRÉER.</small>
            </>
          )}
          <div className="portrait-label">
            <Layers size={18} />
            {p.headline || "Mon portfolio"}
          </div>
        </div>
      </section>
      <section id="projects" className="public-section">
        <div className="section-heading">
          <span className="eyebrow">01 / RÉALISATIONS</span>
          <h2>Quelques idées devenues projets.</h2>
        </div>
        <div className="project-grid">
          {data.projects.length ? (
            data.projects.map((x, i) => (
              <article className="project-card" key={x.id}>
                <div className={`project-art art-${i % 3}`}>
                  {x.image_url ? (
                    <img
                      src={x.image_url}
                      alt={x.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <>
                      <span className="art-number">0{i + 1}</span>
                      <Layers size={58} />
                      <strong>{x.title}</strong>
                    </>
                  )}
                </div>
                <div className="project-body">
                  <h3>{x.title}</h3>
                  <p>{x.description}</p>
                  <div className="tags">
                    {x.technologies.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <div className="socials">
                    {x.repo_url && (
                      <a href={x.repo_url} target="_blank" rel="noreferrer">
                        Code source ↗
                      </a>
                    )}
                    {x.demo_url && (
                      <a href={x.demo_url} target="_blank" rel="noreferrer">
                        Voir le projet ↗
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="muted">Les projets seront présentés ici.</p>
          )}
        </div>
      </section>
      <div className="journey-grid">
        {(["experiences", "education"] as Section[]).map((s) => (
          <section className="public-section" id={s} key={s}>
            <span className="eyebrow">
              {s === "experiences" ? "02 / SUR LE TERRAIN" : "03 / APPRENDRE"}
            </span>
            <h2>{labels[s]}</h2>
            <div className="timeline">
              {data[s].map((x) => (
                <article key={x.id}>
                  <small>
                    {x.start_date.slice(0, 7)}
                    {x.start_date && " — "}
                    {x.end_date.slice(0, 7) ||
                      (x.start_date ? "Aujourd’hui" : "")}
                  </small>
                  <h3>{x.title}</h3>
                  <strong>{x.subtitle}</strong>
                  <p>{x.description}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      <section className="public-section skill-section">
        <span className="eyebrow">04 / MA BOÎTE À OUTILS</span>
        <h2>Compétences & savoir-faire</h2>
        <div className="skill-grid">
          {data.skills.map((x) => (
            <div className="skill-card" key={x.id}>
              <small>{x.category}</small>
              <strong>{x.title}</strong>
              <div
                className="skill-meter"
                role="img"
                aria-label={`Niveau ${x.level} sur 5`}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <i key={n} className={n <= x.level ? "filled" : ""} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <footer className="public-footer">
        <Brand />
        <span>Un parcours unique. Une histoire à partager.</span>
        <span>
          {sections.reduce((n, s) => n + data[s].length, 0)} éléments de
          parcours
        </span>
      </footer>
    </div>
  );
}
