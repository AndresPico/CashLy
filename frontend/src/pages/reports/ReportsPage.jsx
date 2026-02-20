import { useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { getAccounts } from '../../services/accounts.service';
import { getBudgets } from '../../services/budgets.service';
import { getCategories } from '../../services/categories.service';
import { getGoalContributions, getGoals } from '../../services/goals.service';
import { getTransactions } from '../../services/transactions.service';
import '../../assets/css/ReportsPage.css';

const MONTH_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' }
];

const CHART_COLORS = [
  '#2563eb',
  '#16a34a',
  '#ea580c',
  '#9333ea',
  '#0891b2',
  '#dc2626',
  '#ca8a04',
  '#0d9488'
];

const emptyFilters = {
  date_from: '',
  date_to: '',
  month: '',
  year: '',
  account_id: '',
  category_id: '',
  type: ''
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;
const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const monthToLabel = (monthKey) => {
  if (!monthKey) return '-';
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long'
  });
};

const normalizeTransaction = (transaction, accountNameById, categoryNameById) => ({
  id: transaction.id,
  date: transaction.date || '',
  type: transaction.type || 'expense',
  amount: Number(transaction.amount || 0),
  account_id: transaction.account_id || '',
  account_name:
    transaction.accounts?.name ||
    transaction.account?.name ||
    accountNameById.get(transaction.account_id) ||
    'Cuenta',
  category_id: transaction.category_id || '',
  category_name:
    transaction.categories?.name ||
    transaction.category?.name ||
    categoryNameById.get(transaction.category_id) ||
    'Sin categoria'
});

const getMonthKey = (dateValue) => (dateValue ? dateValue.slice(0, 7) : '');

const buildConicGradient = (items, total) => {
  if (!items.length || total <= 0) return 'conic-gradient(#cbd5e1 0deg 360deg)';

  let start = 0;
  const chunks = items.map((item, index) => {
    const angle = (item.amount / total) * 360;
    const color = CHART_COLORS[index % CHART_COLORS.length];
    const chunk = `${color} ${start}deg ${start + angle}deg`;
    start += angle;
    return chunk;
  });

  return `conic-gradient(${chunks.join(', ')})`;
};

const getLinePath = (values, maxValue, height) => {
  if (!values.length || maxValue <= 0) return '';

  const step = values.length > 1 ? 100 / (values.length - 1) : 0;
  return values
    .map((value, index) => {
      const x = index * step;
      const y = height - (value / maxValue) * height;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
};

const matchesDateFilters = (dateValue, filters) => {
  if (!dateValue) return false;

  if (filters.date_from && dateValue < filters.date_from) return false;
  if (filters.date_to && dateValue > filters.date_to) return false;

  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());

  if (filters.month && month !== filters.month) return false;
  if (filters.year && year !== filters.year) return false;

  return true;
};

export default function ReportsPage() {
  const { token, loading: authLoading } = useAuthContext();

  const [filters, setFilters] = useState(emptyFilters);

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [budgets, setBudgets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [budgetsLoading, setBudgetsLoading] = useState(true);
  const [error, setError] = useState('');
  const [budgetsError, setBudgetsError] = useState('');
  const [goalsError, setGoalsError] = useState('');

  const accountNameById = useMemo(() => {
    const map = new Map();
    accounts.forEach((account) => {
      map.set(account.id, account.name);
    });
    return map;
  }, [accounts]);

  const categoryNameById = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => {
      map.set(category.id, category.name);
    });
    return map;
  }, [categories]);

  const referenceMonth = useMemo(() => {
    if (filters.year && filters.month) return `${filters.year}-${filters.month}`;
    if (filters.date_from) return filters.date_from.slice(0, 7);
    if (filters.date_to) return filters.date_to.slice(0, 7);
    return new Date().toISOString().slice(0, 7);
  }, [filters.date_from, filters.date_to, filters.month, filters.year]);

  useEffect(() => {
    if (authLoading || !token) return;

    const loadData = async () => {
      setLoading(true);
      setError('');
      setGoalsError('');

      try {
        const [accountsData, categoriesData, transactionsData] = await Promise.all([
          getAccounts(token),
          getCategories(token),
          getTransactions(token)
        ]);

        const accountMap = new Map();
        accountsData.forEach((account) => {
          accountMap.set(account.id, account.name);
        });

        const categoryMap = new Map();
        categoriesData.forEach((category) => {
          categoryMap.set(category.id, category.name);
        });

        setAccounts(accountsData);
        setCategories(categoriesData);
        setTransactions(
          transactionsData.map((item) =>
            normalizeTransaction(item, accountMap, categoryMap)
          )
        );
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los reportes');
      }

      try {
        const goalsData = await getGoals(token);
        setGoals(goalsData);

        const contributionResults = await Promise.allSettled(
          goalsData.map((goal) => getGoalContributions(goal.id, token))
        );

        const allContributions = [];
        contributionResults.forEach((result, index) => {
          if (result.status !== 'fulfilled') return;

          const goal = goalsData[index];
          result.value.forEach((contribution) => {
            allContributions.push({
              ...contribution,
              goal_id: goal.id,
              goal_name: goal.name
            });
          });
        });

        setContributions(allContributions);
      } catch (err) {
        setGoalsError(err.message || 'No se pudo cargar informacion de metas');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authLoading, token]);

  useEffect(() => {
    if (authLoading || !token) return;

    const loadBudgets = async () => {
      setBudgetsLoading(true);
      setBudgetsError('');

      try {
        const budgetData = await getBudgets(token, referenceMonth);
        setBudgets(Array.isArray(budgetData.items) ? budgetData.items : []);
      } catch (err) {
        setBudgets([]);
        setBudgetsError(err.message || 'No se pudieron cargar presupuestos');
      } finally {
        setBudgetsLoading(false);
      }
    };

    loadBudgets();
  }, [authLoading, referenceMonth, token]);

  const normalizedTransactions = useMemo(
    () =>
      transactions.map((item) =>
        normalizeTransaction(item, accountNameById, categoryNameById)
      ),
    [accountNameById, categoryNameById, transactions]
  );

  const filteredTransactions = useMemo(
    () =>
      normalizedTransactions.filter((transaction) => {
        if (filters.account_id && transaction.account_id !== filters.account_id) return false;
        if (filters.category_id && transaction.category_id !== filters.category_id) return false;
        if (filters.type && transaction.type !== filters.type) return false;
        return matchesDateFilters(transaction.date, filters);
      }),
    [filters, normalizedTransactions]
  );

  const filteredContributions = useMemo(
    () =>
      contributions.filter((item) => {
        if (filters.account_id && item.account_id !== filters.account_id) return false;
        return matchesDateFilters(item.date, filters);
      }),
    [contributions, filters]
  );

  const availableYears = useMemo(() => {
    const years = new Set();
    normalizedTransactions.forEach((item) => {
      if (!item.date) return;
      years.add(item.date.slice(0, 4));
    });
    return [...years].sort((a, b) => Number(b) - Number(a));
  }, [normalizedTransactions]);

  const financialSummary = useMemo(() => {
    const income = filteredTransactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0);

    const expense = filteredTransactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);

    let periodDays = 0;
    if (filteredTransactions.length > 0) {
      const allDates = filteredTransactions
        .map((item) => item.date)
        .filter(Boolean)
        .sort();

      const firstDate = filters.date_from || allDates[0];
      const lastDate = filters.date_to || allDates[allDates.length - 1];

      const first = new Date(`${firstDate}T00:00:00`);
      const last = new Date(`${lastDate}T00:00:00`);
      const diff = Math.floor((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
      periodDays = Number.isFinite(diff) && diff >= 0 ? diff + 1 : 0;
    }

    const expensesByCategory = filteredTransactions
      .filter((item) => item.type === 'expense')
      .reduce((map, item) => {
        const current = map.get(item.category_name) || 0;
        map.set(item.category_name, current + item.amount);
        return map;
      }, new Map());

    const topCategory = [...expensesByCategory.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)[0];

    const movementsByAccount = filteredTransactions.reduce((map, item) => {
      const key = item.account_id || 'unknown';
      const current =
        map.get(key) ||
        {
          account_id: key,
          account_name: item.account_name || 'Cuenta',
          movement: 0,
          income: 0,
          expense: 0,
          net: 0,
          transactions: 0
        };

      current.movement += Math.abs(item.amount);
      current.net += item.type === 'income' ? item.amount : -item.amount;
      current.transactions += 1;
      if (item.type === 'income') current.income += item.amount;
      if (item.type === 'expense') current.expense += item.amount;

      map.set(key, current);
      return map;
    }, new Map());

    const topAccount = [...movementsByAccount.values()].sort((a, b) => b.movement - a.movement)[0];

    return {
      income,
      expense,
      net: income - expense,
      averageDailyExpense: periodDays > 0 ? expense / periodDays : 0,
      topCategory,
      topAccount
    };
  }, [filteredTransactions, filters.date_from, filters.date_to]);

  const monthlySeries = useMemo(() => {
    const grouped = filteredTransactions.reduce((map, item) => {
      const monthKey = getMonthKey(item.date);
      const current = map.get(monthKey) || { month: monthKey, income: 0, expense: 0, net: 0 };
      if (item.type === 'income') current.income += item.amount;
      if (item.type === 'expense') current.expense += item.amount;
      current.net = current.income - current.expense;
      map.set(monthKey, current);
      return map;
    }, new Map());

    return [...grouped.values()].sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredTransactions]);

  const expenseDistribution = useMemo(() => {
    const grouped = filteredTransactions
      .filter((item) => item.type === 'expense')
      .reduce((map, item) => {
        const key = item.category_id || item.category_name;
        const current = map.get(key) || { key, category: item.category_name, amount: 0 };
        current.amount += item.amount;
        map.set(key, current);
        return map;
      }, new Map());

    const list = [...grouped.values()].sort((a, b) => b.amount - a.amount);
    const total = list.reduce((sum, item) => sum + item.amount, 0);
    return {
      total,
      items: list.map((item) => ({
        ...item,
        percentage: total > 0 ? (item.amount / total) * 100 : 0
      }))
    };
  }, [filteredTransactions]);

  const accountReport = useMemo(() => {
    const grouped = filteredTransactions.reduce((map, item) => {
      const key = item.account_id || 'unknown';
      const current =
        map.get(key) ||
        {
          account_id: key,
          account_name: item.account_name || 'Cuenta',
          income: 0,
          expense: 0,
          movement: 0,
          net: 0,
          transactions: 0
        };

      if (item.type === 'income') current.income += item.amount;
      if (item.type === 'expense') current.expense += item.amount;
      current.net = current.income - current.expense;
      current.movement += Math.abs(item.amount);
      current.transactions += 1;

      map.set(key, current);
      return map;
    }, new Map());

    return [...grouped.values()]
      .map((item) => {
        const account = accounts.find((accountItem) => accountItem.id === item.account_id);
        const currentBalance = Number(account?.balance || 0);
        return {
          ...item,
          currentBalance,
          estimatedInitialBalance: currentBalance - item.net
        };
      })
      .sort((a, b) => b.movement - a.movement);
  }, [accounts, filteredTransactions]);

  const budgetsStatus = useMemo(() => {
    const currentMonthExpenses = filteredTransactions
      .filter((item) => item.type === 'expense' && getMonthKey(item.date) === referenceMonth)
      .reduce((map, item) => {
        const current = map.get(item.category_id) || 0;
        map.set(item.category_id, current + item.amount);
        return map;
      }, new Map());

    const comparisons = budgets.map((budget) => {
      const spent = currentMonthExpenses.get(budget.category_id) || 0;
      const limit = Number(budget.amount || 0);
      return {
        id: budget.id,
        categoryName: budget.category?.name || budget.category_name || 'Categoria',
        limit,
        spent,
        difference: limit - spent,
        exceeded: spent > limit
      };
    });

    return {
      month: referenceMonth,
      items: comparisons,
      exceeded: comparisons.filter((item) => item.exceeded)
    };
  }, [budgets, filteredTransactions, referenceMonth]);

  const goalsInsight = useMemo(() => {
    const totals = goals.reduce(
      (acc, goal) => {
        acc.target += Number(goal.target_amount || 0);
        acc.saved += Number(goal.saved_amount || 0);
        return acc;
      },
      { target: 0, saved: 0 }
    );

    const contributionTotal = filteredContributions.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const incomeForPeriod = financialSummary.income;
    const incomeToSavings = incomeForPeriod > 0 ? (contributionTotal / incomeForPeriod) * 100 : 0;

    return {
      target: totals.target,
      saved: totals.saved,
      progress: totals.target > 0 ? (totals.saved / totals.target) * 100 : 0,
      contributionTotal,
      contributionsCount: filteredContributions.length,
      incomeToSavings
    };
  }, [filteredContributions, financialSummary.income, goals]);

  const maxSeriesValue = useMemo(() => {
    const values = monthlySeries.flatMap((item) => [item.income, item.expense, Math.abs(item.net)]);
    return Math.max(...values, 0);
  }, [monthlySeries]);

  const seriesHeight = 120;
  const incomePath = getLinePath(
    monthlySeries.map((item) => item.income),
    maxSeriesValue,
    seriesHeight
  );
  const expensePath = getLinePath(
    monthlySeries.map((item) => item.expense),
    maxSeriesValue,
    seriesHeight
  );
  const netPath = getLinePath(
    monthlySeries.map((item) => Math.max(item.net, 0)),
    maxSeriesValue,
    seriesHeight
  );

  const setFilter = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'type' && next.category_id) {
        const category = categories.find((item) => item.id === next.category_id);
        if (category && value && category.type !== value) next.category_id = '';
      }
      return next;
    });
  };

  const handleExportPdf = () => {
    const reportWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!reportWindow) return;

    const now = new Date().toLocaleString('es-CO');
    const periodLabel = `${filters.date_from || 'Inicio'} a ${filters.date_to || 'Hoy'}`;

    const categoriesRows = expenseDistribution.items
      .slice(0, 10)
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.category)}</td>
            <td>${formatCurrency(item.amount)}</td>
            <td>${formatPercent(item.percentage)}</td>
          </tr>
        `
      )
      .join('');

    const accountsRows = accountReport
      .slice(0, 10)
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.account_name)}</td>
            <td>${formatCurrency(item.income)}</td>
            <td>${formatCurrency(item.expense)}</td>
            <td>${formatCurrency(item.currentBalance)}</td>
          </tr>
        `
      )
      .join('');

    reportWindow.document.write(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>CashLy Reportes</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
            h1, h2 { margin: 0 0 8px; }
            p { margin: 4px 0; }
            .meta { color: #475569; margin-bottom: 16px; }
            .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 14px 0 18px; }
            .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; }
            .label { font-size: 12px; color: #64748b; }
            .value { font-size: 16px; font-weight: 700; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f8fafc; }
            .section { margin-top: 18px; }
            @media print { body { margin: 10mm; } }
          </style>
        </head>
        <body>
          <h1>CashLy - Reporte Financiero</h1>
          <p class="meta">Generado: ${now}</p>
          <p class="meta">Periodo: ${escapeHtml(periodLabel)}</p>

          <div class="grid">
            <div class="card"><div class="label">Total ingresos</div><div class="value">${formatCurrency(financialSummary.income)}</div></div>
            <div class="card"><div class="label">Total gastos</div><div class="value">${formatCurrency(financialSummary.expense)}</div></div>
            <div class="card"><div class="label">Balance neto</div><div class="value">${formatCurrency(financialSummary.net)}</div></div>
            <div class="card"><div class="label">Promedio diario gasto</div><div class="value">${formatCurrency(financialSummary.averageDailyExpense)}</div></div>
            <div class="card"><div class="label">Categoria top gasto</div><div class="value">${escapeHtml(financialSummary.topCategory?.name || '-')}</div></div>
            <div class="card"><div class="label">Cuenta mayor movimiento</div><div class="value">${escapeHtml(financialSummary.topAccount?.account_name || '-')}</div></div>
          </div>

          <div class="section">
            <h2>Distribucion de gastos por categoria</h2>
            <table>
              <thead><tr><th>Categoria</th><th>Monto</th><th>Porcentaje</th></tr></thead>
              <tbody>${categoriesRows || '<tr><td colspan="3">Sin datos</td></tr>'}</tbody>
            </table>
          </div>

          <div class="section">
            <h2>Reporte por cuenta</h2>
            <table>
              <thead><tr><th>Cuenta</th><th>Ingresos</th><th>Gastos</th><th>Balance actual</th></tr></thead>
              <tbody>${accountsRows || '<tr><td colspan="4">Sin datos</td></tr>'}</tbody>
            </table>
          </div>
        </body>
      </html>
    `);

    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };

  if (authLoading || loading) {
    return (
      <div className="reports-loading">
        <div className="spinner" />
        <p>Cargando reportes...</p>
      </div>
    );
  }

  return (
    <section className="reports-page">
      <header className="reports-hero">
        <div>
          <h1>Reports</h1>
          <p>Analitica financiera basada en transacciones para decisiones informadas.</p>
        </div>
        <div className="reports-hero-actions">
          <button type="button" className="btn-secondary" onClick={handleExportPdf}>
            Exportar PDF
          </button>
        </div>
      </header>

      <section className="reports-filters-card">
        <div className="filters-grid">
          <label>
            Desde
            <input
              type="date"
              value={filters.date_from}
              onChange={(event) => setFilter('date_from', event.target.value)}
            />
          </label>

          <label>
            Hasta
            <input
              type="date"
              value={filters.date_to}
              onChange={(event) => setFilter('date_to', event.target.value)}
            />
          </label>

          <label>
            Mes
            <select value={filters.month} onChange={(event) => setFilter('month', event.target.value)}>
              {MONTH_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Ano
            <select value={filters.year} onChange={(event) => setFilter('year', event.target.value)}>
              <option value="">Todos</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label>
            Cuenta
            <select
              value={filters.account_id}
              onChange={(event) => setFilter('account_id', event.target.value)}
            >
              <option value="">Todas</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Categoria
            <select
              value={filters.category_id}
              onChange={(event) => setFilter('category_id', event.target.value)}
            >
              <option value="">Todas</option>
              {categories
                .filter((item) => !filters.type || item.type === filters.type)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </label>

          <label>
            Tipo
            <select value={filters.type} onChange={(event) => setFilter('type', event.target.value)}>
              <option value="">Todos</option>
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
            </select>
          </label>
        </div>

        <button type="button" className="btn-link" onClick={() => setFilters(emptyFilters)}>
          Limpiar filtros
        </button>
      </section>

      {error ? <p className="page-error">{error}</p> : null}

      <section className="reports-summary-grid">
        <article>
          <span>Total ingresos</span>
          <strong className="income">{formatCurrency(financialSummary.income)}</strong>
        </article>
        <article>
          <span>Total gastos</span>
          <strong className="expense">{formatCurrency(financialSummary.expense)}</strong>
        </article>
        <article>
          <span>Balance neto</span>
          <strong className={financialSummary.net >= 0 ? 'income' : 'expense'}>
            {formatCurrency(financialSummary.net)}
          </strong>
        </article>
        <article>
          <span>Promedio diario de gasto</span>
          <strong>{formatCurrency(financialSummary.averageDailyExpense)}</strong>
        </article>
        <article>
          <span>Categoria con mayor gasto</span>
          <strong>{financialSummary.topCategory?.name || '-'}</strong>
          <small>{formatCurrency(financialSummary.topCategory?.amount || 0)}</small>
        </article>
        <article>
          <span>Cuenta con mayor movimiento</span>
          <strong>{financialSummary.topAccount?.account_name || '-'}</strong>
          <small>{formatCurrency(financialSummary.topAccount?.movement || 0)}</small>
        </article>
      </section>

      <section className="reports-grid two-columns">
        <article className="report-card">
          <header>
            <h2>Ingresos vs gastos</h2>
            <small>Comparacion mensual y deteccion de sobre gasto</small>
          </header>

          {monthlySeries.length === 0 ? (
            <p className="empty-inline">No hay datos para el periodo seleccionado.</p>
          ) : (
            <div className="comparison-bars">
              {monthlySeries.map((item) => {
                const max = Math.max(item.income, item.expense, 1);
                const incomeWidth = (item.income / max) * 100;
                const expenseWidth = (item.expense / max) * 100;
                const overspend = item.expense > item.income;

                return (
                  <div key={item.month} className="comparison-row">
                    <div className="comparison-header">
                      <strong>{monthToLabel(item.month)}</strong>
                      {overspend ? <span className="warning-chip">Sobre gasto</span> : null}
                    </div>
                    <div className="bar-pair">
                      <div className="bar-track">
                        <div className="bar-fill income" style={{ width: `${incomeWidth}%` }} />
                      </div>
                      <small>{formatCurrency(item.income)}</small>
                    </div>
                    <div className="bar-pair">
                      <div className="bar-track">
                        <div className="bar-fill expense" style={{ width: `${expenseWidth}%` }} />
                      </div>
                      <small>{formatCurrency(item.expense)}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="report-card">
          <header>
            <h2>Distribucion por categoria</h2>
            <small>Participacion porcentual y ranking de gastos</small>
          </header>

          {expenseDistribution.items.length === 0 ? (
            <p className="empty-inline">No hay gastos para graficar.</p>
          ) : (
            <div className="category-distribution">
              <div
                className="donut-chart"
                style={{
                  background: buildConicGradient(expenseDistribution.items, expenseDistribution.total)
                }}
                aria-label="Distribucion de gastos por categoria"
              >
                <div className="donut-center">
                  <span>Total</span>
                  <strong>{formatCurrency(expenseDistribution.total)}</strong>
                </div>
              </div>

              <ul className="ranking-list">
                {expenseDistribution.items.map((item, index) => (
                  <li key={item.key}>
                    <span className="dot" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
                    <p>
                      <strong>{item.category}</strong>
                      <small>{formatPercent(item.percentage)}</small>
                    </p>
                    <strong>{formatCurrency(item.amount)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      </section>

      <section className="reports-grid">
        <article className="report-card">
          <header>
            <h2>Evolucion mensual</h2>
            <small>Linea de ingresos, gastos y balance neto positivo</small>
          </header>

          {monthlySeries.length === 0 ? (
            <p className="empty-inline">No hay datos para mostrar tendencia.</p>
          ) : (
            <>
              <svg viewBox="0 0 100 130" className="trend-chart" role="img" aria-label="Tendencia mensual">
                <path d={incomePath} className="line-income" />
                <path d={expensePath} className="line-expense" />
                <path d={netPath} className="line-net" />
              </svg>

              <div className="trend-legend">
                <span className="legend income">Ingresos</span>
                <span className="legend expense">Gastos</span>
                <span className="legend net">Balance neto positivo</span>
              </div>

              <ul className="variation-list">
                {monthlySeries.map((item, index) => {
                  const previous = monthlySeries[index - 1];
                  const variation =
                    previous && previous.net !== 0
                      ? ((item.net - previous.net) / Math.abs(previous.net)) * 100
                      : 0;

                  return (
                    <li key={item.month}>
                      <div>
                        <strong>{monthToLabel(item.month)}</strong>
                        <small>
                          Neto: {formatCurrency(item.net)} | Ingresos: {formatCurrency(item.income)} | Gastos:{' '}
                          {formatCurrency(item.expense)}
                        </small>
                      </div>
                      <span className={variation >= 0 ? 'positive' : 'negative'}>
                        {previous ? formatPercent(variation) : 'Base'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </article>
      </section>

      <section className="reports-grid">
        <article className="report-card">
          <header>
            <h2>Reporte por cuenta</h2>
            <small>Movimientos, ingresos, gastos y balance estimado</small>
          </header>

          {accountReport.length === 0 ? (
            <p className="empty-inline">No hay movimientos para cuentas en este periodo.</p>
          ) : (
            <div className="accounts-table-wrapper">
              <table className="accounts-table">
                <thead>
                  <tr>
                    <th>Cuenta</th>
                    <th>Ingresos</th>
                    <th>Gastos</th>
                    <th>Movimientos</th>
                    <th>Balance estimado inicial</th>
                    <th>Balance actual</th>
                  </tr>
                </thead>
                <tbody>
                  {accountReport.map((item) => (
                    <tr key={item.account_id}>
                      <td>{item.account_name}</td>
                      <td className="income">{formatCurrency(item.income)}</td>
                      <td className="expense">{formatCurrency(item.expense)}</td>
                      <td>{item.transactions}</td>
                      <td>{formatCurrency(item.estimatedInitialBalance)}</td>
                      <td>{formatCurrency(item.currentBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      <section className="reports-grid two-columns">
        <article className="report-card">
          <header>
            <h2>Integracion con budgets</h2>
            <small>
              Presupuestos de {monthToLabel(budgetsStatus.month)} vs gasto real en el periodo filtrado
            </small>
          </header>

          {budgetsLoading ? (
            <p className="empty-inline">Cargando presupuestos...</p>
          ) : budgetsError ? (
            <p className="page-error">{budgetsError}</p>
          ) : budgetsStatus.items.length === 0 ? (
            <p className="empty-inline">No hay presupuestos configurados para este mes.</p>
          ) : (
            <>
              <div className="budget-kpis">
                <p>
                  <span>Presupuestos excedidos</span>
                  <strong className={budgetsStatus.exceeded.length > 0 ? 'expense' : 'income'}>
                    {budgetsStatus.exceeded.length}
                  </strong>
                </p>
                <p>
                  <span>Categorias en control</span>
                  <strong>{budgetsStatus.items.length - budgetsStatus.exceeded.length}</strong>
                </p>
              </div>

              <ul className="budget-list">
                {budgetsStatus.items.map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>{item.categoryName}</strong>
                      <small>
                        Limite: {formatCurrency(item.limit)} | Gasto real: {formatCurrency(item.spent)}
                      </small>
                    </div>
                    <span className={item.exceeded ? 'negative' : 'positive'}>
                      {item.exceeded ? '-' : '+'}
                      {formatCurrency(Math.abs(item.difference))}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </article>

        <article className="report-card">
          <header>
            <h2>Integracion con goals</h2>
            <small>Aportes del periodo y eficiencia de ahorro sobre ingresos</small>
          </header>

          {goalsError ? <p className="page-error">{goalsError}</p> : null}

          <div className="goals-kpis">
            <p>
              <span>Aportes en periodo</span>
              <strong>{formatCurrency(goalsInsight.contributionTotal)}</strong>
            </p>
            <p>
              <span>Progreso global metas</span>
              <strong>{formatPercent(goalsInsight.progress)}</strong>
            </p>
            <p>
              <span>Ingreso destinado a ahorro</span>
              <strong>{formatPercent(goalsInsight.incomeToSavings)}</strong>
            </p>
            <p>
              <span>Aportes registrados</span>
              <strong>{goalsInsight.contributionsCount}</strong>
            </p>
          </div>

          <div className="goals-progress-track">
            <div
              className="goals-progress-fill"
              style={{ width: `${Math.min(100, Math.max(0, goalsInsight.progress))}%` }}
            />
          </div>

          <p className="goals-total">
            Ahorrado {formatCurrency(goalsInsight.saved)} de {formatCurrency(goalsInsight.target)}
          </p>
        </article>
      </section>
    </section>
  );
}
