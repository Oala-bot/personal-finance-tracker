import type { Metadata } from 'next';
import Link from 'next/link';
import {
  TransactionForm,
  DeleteTransaction,
} from '@/components/transaction-form';
import { listAccounts } from '@/lib/data/accounts';
import { listCategories } from '@/lib/data/categories';
import { listTransactions, getTransaction } from '@/lib/data/transactions';
import {
  PAGE_SIZE,
  readFilters,
  transactionUrl,
  validId,
  sortOptions,
  transactionKinds,
  type SearchParams,
} from '@/lib/transactions';
import { formatUsd } from '@/lib/finance/money';

export const metadata: Metadata = {
  title: 'Transactions | Personal Finance Tracker',
};
const notices: Record<string, string> = {
  created: 'Transaction created. Active filters may hide it from this list.',
  updated: 'Transaction updated. Active filters may hide it from this list.',
  deleted: 'Transaction deleted.',
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const { filters, error: filterError } = readFilters(query);
  const edit = typeof query.edit === 'string' ? query.edit : '';
  const [accounts, categories, transactions, selected] = await Promise.all([
    listAccounts(),
    listCategories(),
    filterError
      ? Promise.resolve({ data: [], count: 0, error: null })
      : listTransactions(filters),
    validId(edit)
      ? getTransaction(edit)
      : Promise.resolve({ data: null, error: null }),
  ]);
  const failed =
    accounts.error || categories.error || transactions.error || selected.error;
  const returnTo = filterError ? '/transactions' : transactionUrl(filters);
  const total = transactions.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const accountName = (id: string) =>
    accounts.data?.find((a) => a.id === id)?.name ?? 'Unavailable account';
  const categoryName = (id: string | null) =>
    categories.data?.find((c) => c.id === id)?.name ?? '';
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h1>Transactions</h1>
        <p className="text-secondary mb-0">
          Track income, expenses, and transfers. All amounts are in USD.
        </p>
      </header>
      {typeof query.notice === 'string' &&
        Object.hasOwn(notices, query.notice) && (
          <p role="status" className="alert alert-success">
            {notices[query.notice]}
          </p>
        )}
      {failed ? (
        <p role="alert" className="alert alert-danger">
          Unable to load transactions.{' '}
          <Link href="/transactions">Try again</Link>.
        </p>
      ) : (
        <>
          <form
            key={returnTo}
            method="get"
            action="/transactions"
            className="card card-body p-4 mb-4"
            aria-label="Filter transactions"
          >
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label htmlFor="filter-q" className="form-label">
                  Search descriptions
                </label>
                <input
                  id="filter-q"
                  name="q"
                  type="search"
                  className="form-control"
                  maxLength={200}
                  defaultValue={filters.q}
                />
              </div>
              <div className="col-6 col-md-3">
                <label htmlFor="filter-kind" className="form-label">
                  Type
                </label>
                <select
                  id="filter-kind"
                  name="kind"
                  className="form-select"
                  defaultValue={filters.kind}
                >
                  <option value="">All types</option>
                  {Object.entries(transactionKinds).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-6 col-md-3">
                <label htmlFor="filter-sort" className="form-label">
                  Sort by
                </label>
                <select
                  id="filter-sort"
                  name="sort"
                  className="form-select"
                  defaultValue={filters.sort}
                >
                  {Object.entries(sortOptions).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-3">
                <label htmlFor="filter-account" className="form-label">
                  Filter by account
                </label>
                <select
                  id="filter-account"
                  name="account"
                  className="form-select"
                  defaultValue={filters.account}
                >
                  <option value="">All accounts</option>
                  {accounts.data?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                      {a.archived ? ' (archived)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-3">
                <label htmlFor="filter-category" className="form-label">
                  Filter by category
                </label>
                <select
                  id="filter-category"
                  name="category"
                  className="form-select"
                  defaultValue={filters.category}
                >
                  <option value="">All categories</option>
                  {categories.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.kind}){c.archived ? ' — archived' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-6 col-md-3">
                <label htmlFor="filter-from" className="form-label">
                  From date
                </label>
                <input
                  id="filter-from"
                  name="from"
                  type="date"
                  min="0001-01-01"
                  max="9999-12-31"
                  className="form-control"
                  defaultValue={filters.from}
                />
              </div>
              <div className="col-6 col-md-3">
                <label htmlFor="filter-to" className="form-label">
                  Through date
                </label>
                <input
                  id="filter-to"
                  name="to"
                  type="date"
                  min="0001-01-01"
                  max="9999-12-31"
                  className="form-control"
                  defaultValue={filters.to}
                />
              </div>
            </div>
            <div className="d-flex gap-3 mt-3 align-items-center">
              <button className="btn btn-outline-primary">Apply filters</button>
              <Link href="/transactions">Clear filters</Link>
            </div>
          </form>
          {filterError && (
            <p role="alert" className="alert alert-danger">
              {filterError}
            </p>
          )}
          {edit && !selected.data && (
            <p role="alert" className="alert alert-warning">
              That transaction is unavailable. Choose one from the list.
            </p>
          )}
          <div className="row g-4">
            <div className="col-12 col-xl-7">
              {!filterError && (
                <>
                  <p className="small text-secondary" role="status">
                    {total} matching transaction{total === 1 ? '' : 's'} · Page{' '}
                    {filters.page} of {pages}
                  </p>
                  {!transactions.data?.length ? (
                    <div className="card card-body p-4">
                      <h2 className="h5">
                        {filters.page > pages
                          ? 'This page is empty'
                          : 'No transactions to show'}
                      </h2>
                      <p className="text-secondary mb-0">
                        Add a transaction or adjust your filters.
                        {filters.page > pages && (
                          <>
                            {' '}
                            <Link href={transactionUrl(filters, { page: '1' })}>
                              Go to the first page
                            </Link>
                            .
                          </>
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="d-grid gap-3">
                      {transactions.data.map((t) => (
                        <article className="card" key={t.id}>
                          <div className="card-body p-4">
                            <div className="d-flex justify-content-between gap-3 flex-wrap">
                              <div className="text-break">
                                <h2 className="h6 mb-1">
                                  {t.description ||
                                    transactionKinds[
                                      t.kind as keyof typeof transactionKinds
                                    ]}
                                </h2>
                                <p className="small text-secondary mb-0">
                                  <time dateTime={t.transaction_date}>
                                    {new Intl.DateTimeFormat('en-US', {
                                      dateStyle: 'medium',
                                      timeZone: 'UTC',
                                    }).format(
                                      new Date(
                                        `${t.transaction_date}T00:00:00Z`,
                                      ),
                                    )}
                                  </time>{' '}
                                  ·{' '}
                                  {
                                    transactionKinds[
                                      t.kind as keyof typeof transactionKinds
                                    ]
                                  }
                                </p>
                              </div>
                              <span className="fw-semibold text-break">
                                {t.kind === 'expense'
                                  ? '−'
                                  : t.kind === 'income'
                                    ? '+'
                                    : ''}
                                {formatUsd(t.amount_cents)}
                              </span>
                            </div>
                            <p className="small mt-3 mb-2 text-break">
                              {accountName(t.account_id)}
                              {t.destination_account_id
                                ? ` → ${accountName(t.destination_account_id)}`
                                : ` · ${categoryName(t.category_id)}`}
                            </p>
                            <Link
                              href={
                                transactionUrl(filters, { edit: t.id }) +
                                '#transaction-form'
                              }
                              className="btn btn-outline-primary btn-sm"
                              aria-label={`Edit ${t.description || 'transaction'}`}
                            >
                              Edit
                            </Link>
                            <DeleteTransaction
                              transaction={t}
                              returnTo={returnTo}
                            />
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                  {pages > 1 && (
                    <nav
                      aria-label="Transaction pages"
                      className="d-flex gap-3 mt-4"
                    >
                      {filters.page > 1 && (
                        <Link
                          className="btn btn-outline-secondary"
                          href={transactionUrl(filters, {
                            page: String(filters.page - 1),
                          })}
                        >
                          Previous
                        </Link>
                      )}
                      {filters.page < pages && (
                        <Link
                          className="btn btn-outline-secondary"
                          href={transactionUrl(filters, {
                            page: String(filters.page + 1),
                          })}
                        >
                          Next
                        </Link>
                      )}
                    </nav>
                  )}
                </>
              )}
            </div>
            <div className="col-12 col-xl-5">
              {accounts.data?.some((a) => !a.archived) || selected.data ? (
                <TransactionForm
                  key={selected.data?.id ?? crypto.randomUUID()}
                  transaction={selected.data ?? undefined}
                  accounts={accounts.data ?? []}
                  categories={categories.data ?? []}
                  today={new Date().toISOString().slice(0, 10)}
                  returnTo={returnTo}
                />
              ) : (
                <div className="card card-body p-4">
                  <h2 className="h5">Start with an account</h2>
                  <p>Transactions need an active account.</p>
                  <Link href="/accounts">Add or restore an account</Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
