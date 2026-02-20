import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { getBudgets } from '../../services/budgets.service';
import { getGoals } from '../../services/goals.service';
import { getTransactions } from '../../services/transactions.service';
import '../../assets/css/home.css';

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1).toISOString().slice(0, 10);
  const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  return { start, end, monthKey };
};

const quickLinks = [
  { to: '/transactions', title: 'Registrar transaccion', detail: 'Captura ingresos y gastos del dia.' },
  { to: '/budgets', title: 'Revisar presupuestos', detail: 'Controla limites antes de excederte.' },
  { to: '/goals', title: 'Avanzar en metas', detail: 'Revisa y registra aportes de ahorro.' },
  { to: '/reports', title: 'Abrir reportes', detail: 'Analiza tendencia y distribucion financiera.' },
  { to: '/accounts', title: 'Gestionar cuentas', detail: 'Actualiza tus saldos y cuentas activas.' },
  { to: '/categories', title: 'Organizar categorias', detail: 'Mantiene ordenada tu clasificacion.' }
];

export default function Home() {
  const { user, token, loading: authLoading } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [budgetsCount, setBudgetsCount] = useState(0);
  const [activeGoalsCount, setActiveGoalsCount] = useState(0);

  const monthRange = useMemo(() => getCurrentMonthRange(), []);

  useEffect(() => {
    if (authLoading || !token) return;

    const loadHomeData = async () => {
      setLoading(true);
      setError('');

      const [transactionsResult, budgetsResult, goalsResult] = await Promise.allSettled([
        getTransactions(token, {
          date_from: monthRange.start,
          date_to: monthRange.end
        }),
        getBudgets(token, monthRange.monthKey),
        getGoals(token)
      ]);

      if (transactionsResult.status === 'fulfilled') {
        setTransactions(Array.isArray(transactionsResult.value) ? transactionsResult.value : []);
      } else {
        setTransactions([]);
        setError('No se pudo cargar el resumen rapido del mes.');
      }

      if (budgetsResult.status === 'fulfilled') {
        setBudgetsCount(Array.isArray(budgetsResult.value.items) ? budgetsResult.value.items.length : 0);
      } else {
        setBudgetsCount(0);
      }

      if (goalsResult.status === 'fulfilled') {
        const goals = Array.isArray(goalsResult.value) ? goalsResult.value : [];
        setActiveGoalsCount(goals.filter((goal) => goal.status === 'active').length);
      } else {
        setActiveGoalsCount(0);
      }

      setLoading(false);
    };

    loadHomeData();
  }, [authLoading, monthRange.end, monthRange.monthKey, monthRange.start, token]);

  const monthSummary = useMemo(() => {
    const income = transactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const expense = transactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      income,
      expense,
      net: income - expense,
      movements: transactions.length
    };
  }, [transactions]);

  return (
    <section className="home-page">
      <header className="home-hero">
        <div>
          <h1>Panel principal</h1>
          <p>
            Bienvenido{user?.email ? `, ${user.email}` : ''}. Aqui tienes una vista rapida de este mes.
          </p>
        </div>
        <Link to="/reports" className="home-primary-action">
          Ir a Reportes
        </Link>
      </header>

      <section className="home-kpi-grid">
        <article>
          <span>Ingresos del mes</span>
          <strong className="positive">{formatCurrency(monthSummary.income)}</strong>
        </article>
        <article>
          <span>Gastos del mes</span>
          <strong className="negative">{formatCurrency(monthSummary.expense)}</strong>
        </article>
        <article>
          <span>Balance mensual</span>
          <strong className={monthSummary.net >= 0 ? 'positive' : 'negative'}>
            {formatCurrency(monthSummary.net)}
          </strong>
        </article>
        <article>
          <span>Movimientos registrados</span>
          <strong>{monthSummary.movements}</strong>
        </article>
        <article>
          <span>Presupuestos activos</span>
          <strong>{budgetsCount}</strong>
        </article>
        <article>
          <span>Metas activas</span>
          <strong>{activeGoalsCount}</strong>
        </article>
      </section>

      {loading ? <p className="home-info">Cargando resumen del mes...</p> : null}
      {error ? <p className="home-error">{error}</p> : null}

      <section className="home-shortcuts">
        <div className="shortcuts-header">
          <h2>Atajos</h2>
          <p>Accede rapido a las acciones que mas se usan.</p>
        </div>

        <div className="shortcuts-grid">
          {quickLinks.map((link) => (
            <Link key={link.to} to={link.to} className="shortcut-card">
              <strong>{link.title}</strong>
              <span>{link.detail}</span>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
