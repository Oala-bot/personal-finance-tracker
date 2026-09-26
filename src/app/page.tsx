import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">THE BIG PICTURE</p>
        <h1>Your money, at a glance.</h1>
        <p className="text-secondary mb-0">
          A little clarity for your everyday decisions.
        </p>
      </header>
      <div className="row g-3 mb-4">
        {['Total balance', 'Monthly income', 'Monthly expenses'].map(
          (label, index) => (
            <div className="col-12 col-md-4" key={label}>
              <section
                className={`card summary-card h-100${index === 0 ? ' balance-card' : ''}`}
                aria-label={label}
              >
                <div className="card-body">
                  <h2 className="summary-label">{label}</h2>
                  <p className="summary-value" aria-label="Not available">
                    —
                  </p>
                  <p className="small mb-0">
                    Available after you add your data
                  </p>
                </div>
              </section>
            </div>
          ),
        )}
      </div>
      <div className="row g-4">
        <div className="col-12 col-xl-8">
          <section className="card h-100">
            <div className="card-body p-4">
              <h2 className="h5">Spending overview</h2>
              <p className="text-secondary small">See where your money goes.</p>
              <div className="chart-empty">
                <span className="empty-mark" aria-hidden="true">
                  ▥
                </span>
                <h3 className="h5 mt-3">Your story starts here</h3>
                <p className="text-secondary mb-0">
                  Category breakdowns and trends will appear here
                  <br className="d-none d-sm-block" /> once transactions are
                  available.
                </p>
              </div>
            </div>
          </section>
        </div>
        <div className="col-12 col-xl-4">
          <section className="card h-100">
            <div className="card-body p-4">
              <h2 className="h5">Explore your workspace</h2>
              <p className="small text-secondary mb-4">
                Everything has its place.
              </p>
              {[
                {
                  href: '/accounts',
                  title: 'Accounts',
                  description: 'Keep your balances together.',
                },
                {
                  href: '/transactions',
                  title: 'Transactions',
                  description: 'Follow money in and money out.',
                },
                {
                  href: '/budgets',
                  title: 'Monthly budgets',
                  description: 'Make room for what matters.',
                },
              ].map((item) => (
                <Link
                  href={item.href}
                  className="workspace-shortcut"
                  key={item.href}
                >
                  <span>
                    <span className="d-block fw-semibold">{item.title}</span>
                    <span className="small text-secondary">
                      {item.description}
                    </span>
                  </span>
                  <span aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
