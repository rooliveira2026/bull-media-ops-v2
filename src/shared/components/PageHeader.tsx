interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  meta?: string;
}

export function PageHeader({ eyebrow, title, description, meta }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <span className="page-header__eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {meta ? <div className="page-header__meta">{meta}</div> : null}
    </header>
  );
}
