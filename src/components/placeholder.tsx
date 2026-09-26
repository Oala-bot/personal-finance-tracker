export function Placeholder({
  title,
  description,
  emptyTitle,
  children,
}: {
  title: string;
  description: string;
  emptyTitle: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h1>{title}</h1>
        <p className="text-secondary mb-0">{description}</p>
      </header>
      <section className="card empty-panel" aria-label={`${title} preview`}>
        <div className="card-body text-center">
          <span className="empty-mark" aria-hidden="true">
            ＋
          </span>
          <h2 className="h4 mt-4">{emptyTitle}</h2>
          <p className="text-secondary empty-copy mx-auto">{children}</p>
          <span className="preview-label">Coming soon</span>
        </div>
      </section>
    </>
  );
}
