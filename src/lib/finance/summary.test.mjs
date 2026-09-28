import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateSummary } from './summary.ts';

const range = { from: '2026-03-01', to: '2026-03-31' };
const account = (id, opening = 0, date = '2026-01-01') => ({
  id,
  opening_balance_cents: opening,
  opening_date: date,
});
const transaction = (id, kind, amount, options = {}) => ({
  id,
  kind,
  amount_cents: amount,
  account_id: 'checking',
  destination_account_id: null,
  category_id: kind === 'income' ? 'salary' : 'groceries',
  transaction_date: '2026-03-15',
  ...options,
});

test('empty data and opening balances, including debt and future accounts', () => {
  assert.deepEqual(calculateSummary([], [], range), {
    balanceCents: 0,
    incomeCents: 0,
    expenseCents: 0,
    netIncomeCents: 0,
    accountBalances: [],
    spendingByCategory: [],
  });
  const result = calculateSummary(
    [
      account('checking', 10000),
      account('credit', -2500),
      { ...account('archived', 250), archived: true },
      account('future', 99999, '2026-04-01'),
    ],
    [],
    range,
  );
  assert.equal(result.balanceCents, 7750);
  assert.equal(result.accountBalances.length, 3);
  assert.equal(result.incomeCents, 0);
});

test('inclusive period, prior history, exact cents, and category totals', () => {
  const result = calculateSummary(
    [account('checking', 10000)],
    [
      transaction('old', 'income', 2000, { transaction_date: '2026-02-28' }),
      transaction('start', 'income', 5000, { transaction_date: range.from }),
      transaction('small', 'expense', 29),
      transaction('end', 'expense', 71, { transaction_date: range.to }),
      transaction('rent', 'expense', 3000, { category_id: 'housing' }),
      transaction('future', 'expense', 99999, {
        transaction_date: '2026-04-01',
      }),
    ],
    range,
  );
  assert.equal(result.balanceCents, 13900);
  assert.equal(result.incomeCents, 5000);
  assert.equal(result.expenseCents, 3100);
  assert.equal(result.netIncomeCents, 1900);
  assert.deepEqual(result.spendingByCategory, [
    { categoryId: 'housing', amountCents: 3000 },
    { categoryId: 'groceries', amountCents: 100 },
  ]);
});

test('transfers move both balances without becoming income or spending', () => {
  const accounts = [account('checking', 10000), account('credit', -5000)];
  const result = calculateSummary(
    accounts,
    [
      transaction('payment', 'transfer', 2500, {
        destination_account_id: 'credit',
        category_id: null,
      }),
      transaction('purchase', 'expense', 100, { account_id: 'credit' }),
    ],
    range,
  );
  assert.deepEqual(result.accountBalances, [
    { accountId: 'checking', balanceCents: 7500 },
    { accountId: 'credit', balanceCents: -2600 },
  ]);
  assert.equal(result.balanceCents, 4900);
  assert.equal(result.incomeCents, 0);
  assert.equal(result.expenseCents, 100);
});

test('single-day leap date and account opening on the end date', () => {
  const leap = { from: '2024-02-29', to: '2024-02-29' };
  const result = calculateSummary(
    [account('checking', 100, leap.to)],
    [transaction('leap', 'expense', 29, { transaction_date: leap.to })],
    leap,
  );
  assert.equal(result.balanceCents, 71);
  assert.equal(result.expenseCents, 29);
  for (const date of ['2026-02-29', '2026-04-31', '0000-01-01', '03/01/2026']) {
    assert.throws(
      () => calculateSummary([], [], { from: date, to: date }),
      /valid date/,
    );
  }
  assert.throws(
    () => calculateSummary([], [], { from: range.to, to: range.from }),
    /start date/,
  );
});

test('rejects incomplete, duplicate, or inconsistent financial records', () => {
  const accounts = [account('checking')];
  const expense = transaction('one', 'expense', 100);
  assert.throws(
    () => calculateSummary(accounts, [expense, expense], range),
    /unique/,
  );
  assert.throws(
    () => calculateSummary([...accounts, ...accounts], [], range),
    /unique/,
  );
  assert.throws(
    () => calculateSummary([], [expense], range),
    /missing account/,
  );
  for (const changes of [
    { amount_cents: 0 },
    { amount_cents: -1 },
    { amount_cents: 1.5 },
    { amount_cents: Infinity },
    { category_id: null },
    { kind: 'unknown' },
    { destination_account_id: 'checking' },
    { transaction_date: '2025-12-31' },
    { kind: 'transfer', destination_account_id: 'checking', category_id: null },
    { kind: 'transfer', destination_account_id: 'missing', category_id: null },
  ])
    assert.throws(() =>
      calculateSummary(accounts, [{ ...expense, ...changes }], range),
    );
  assert.throws(
    () =>
      calculateSummary(
        [...accounts, account('late', 0, '2026-04-01')],
        [
          transaction('early', 'transfer', 100, {
            destination_account_id: 'late',
            category_id: null,
          }),
        ],
        range,
      ),
    /destination/,
  );
});

test('large sums remain exact regardless of row order; unsafe results fail', () => {
  const accounts = [account('checking')];
  const rows = [
    transaction('large', 'income', Number.MAX_SAFE_INTEGER),
    transaction('cent', 'income', 1, { transaction_date: '2026-02-01' }),
    transaction('offset', 'expense', 1, { transaction_date: '2026-02-01' }),
  ];
  assert.equal(
    calculateSummary(accounts, rows, range).balanceCents,
    Number.MAX_SAFE_INTEGER,
  );
  assert.deepEqual(
    calculateSummary(accounts, rows, range),
    calculateSummary(accounts, [...rows].reverse(), range),
  );
  assert.throws(
    () => calculateSummary(accounts, rows.slice(0, 2), range),
    /supported range/,
  );
  assert.throws(
    () =>
      calculateSummary(
        [account('a', Number.MAX_SAFE_INTEGER), account('b', 1)],
        [],
        range,
      ),
    /supported range/,
  );
  assert.throws(
    () =>
      calculateSummary([account('a', Number.MAX_SAFE_INTEGER + 1)], [], range),
    /safe integer/,
  );
});
