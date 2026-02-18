import { useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { getCategories } from '../../services/categories.service';
import {
  createBudget,
  deleteBudget,
  getBudgets,
  updateBudget
} from '../../services/budgets.service';
import BudgetsForm from './BudgetsForm';
import '../../assets/css/BudgetsPage.css';

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

const currentMonth = () => new Date().toISOString().slice(0, 7);

const monthToLabel = (month) => {
  if (!month) return '';
  const [year, monthValue] = month.split('-').map(Number);
  return new Date(year, monthValue - 1, 1).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long'
  });
};

const stateLabels = {
  healthy: 'Bajo control',
  warning: 'Cerca del limite',
  exceeded: 'Excedido'
};

export default function BudgetsPage() {
  const { token, loading: authLoading } = useAuthContext();

  const [month, setMonth] = useState(currentMonth());
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const loadBudgets = async (nextMonth = month) => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const [budgetsResult, categoriesResult] = await Promise.allSettled([
        getBudgets(token, nextMonth),
        getCategories(token, 'expense')
      ]);

      if (categoriesResult.status === 'fulfilled') {
        setCategories(categoriesResult.value);
      } else {
        setCategories([]);
      }

      if (budgetsResult.status === 'fulfilled') {
        setBudgets(budgetsResult.value.items);
        setSummary(budgetsResult.value.summary);
      } else {
        setBudgets([]);
        setSummary(null);
        setError(budgetsResult.reason?.message || 'No se pudieron cargar los presupuestos');
      }
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los presupuestos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !token) return;
    loadBudgets(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, token, month]);

  const totals = useMemo(() => ({
    budgeted: Number(summary?.total_budgeted || 0),
    spent: Number(summary?.total_spent || 0),
    remaining: Number(summary?.total_remaining || 0)
  }), [summary]);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    setError('');

    try {
      await createBudget(payload, token);
      setShowCreateModal(false);
      await loadBudgets(month);
    } catch (err) {
      setError(err.message || 'No se pudo crear el presupuesto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (payload) => {
    if (!editingBudget) return;

    setSubmitting(true);
    setError('');

    try {
      await updateBudget(editingBudget.id, payload, token);
      setEditingBudget(null);
      await loadBudgets(month);
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el presupuesto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (budget) => {
    if (!window.confirm(`Eliminar presupuesto de "${budget.category?.name || 'categoria'}"?`)) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await deleteBudget(budget.id, token);
      await loadBudgets(month);
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el presupuesto');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="budgets-loading">
        <div className="spinner" />
        <p>Cargando presupuestos...</p>
      </div>
    );
  }

  return (
    <section className="budgets-page">
      <header className="budgets-header">
        <div>
          <h1>Budgets</h1>
          <p>Control mensual por categoria para mantener disciplina financiera.</p>
        </div>

        <div className="header-actions">
          <label className="month-filter">
            Mes
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          </label>

          <button type="button" className="btn-primary" onClick={() => setShowCreateModal(true)}>
            Nuevo presupuesto
          </button>
        </div>
      </header>

      <div className="summary-grid">
        <article>
          <span>Total presupuestado</span>
          <strong>{formatCurrency(totals.budgeted)}</strong>
        </article>
        <article>
          <span>Total gastado</span>
          <strong>{formatCurrency(totals.spent)}</strong>
        </article>
        <article className={totals.remaining < 0 ? 'negative' : ''}>
          <span>Diferencia restante</span>
          <strong>{formatCurrency(totals.remaining)}</strong>
        </article>
      </div>

      {error ? <p className="page-error">{error}</p> : null}

      {budgets.length === 0 ? (
        <section className="empty-state">
          <h3>No hay presupuestos para {monthToLabel(month)}</h3>
          <p>Crea tu primer presupuesto mensual por categoria de gasto.</p>
          <button type="button" className="btn-primary" onClick={() => setShowCreateModal(true)}>
            Crear presupuesto
          </button>
        </section>
      ) : (
        <section className="budgets-grid">
          {budgets.map((budget) => {
            const usage = Math.max(0, Number(budget.usage_percentage || 0));
            const progress = Math.min(usage, 100);
            const status = budget.status || 'healthy';

            return (
              <article key={budget.id} className={`budget-card ${status}`}>
                <header className="budget-top">
                  <div className="budget-category">
                    <span
                      className="category-icon"
                      style={{ background: budget.category?.color || '#334155' }}
                    >
                      {budget.category?.icon || '$'}
                    </span>
                    <div>
                      <h3>{budget.category?.name || 'Categoria'}</h3>
                      <small>{stateLabels[status] || stateLabels.healthy}</small>
                    </div>
                  </div>
                  <span className={`status-badge ${status}`}>
                    {Math.round(usage)}%
                  </span>
                </header>

                <div className="progress-track">
                  <div className={`progress-bar ${status}`} style={{ width: `${progress}%` }} />
                </div>

                <div className="budget-values">
                  <p>
                    <span>Limite</span>
                    <strong>{formatCurrency(budget.amount)}</strong>
                  </p>
                  <p>
                    <span>Gastado</span>
                    <strong>{formatCurrency(budget.current_spent)}</strong>
                  </p>
                  <p>
                    <span>Restante</span>
                    <strong className={Number(budget.remaining_amount) < 0 ? 'negative' : ''}>
                      {formatCurrency(budget.remaining_amount)}
                    </strong>
                  </p>
                </div>

                <p className="budget-period">
                  Periodo: {budget.period_start} al {budget.period_end}
                </p>

                <div className="card-actions">
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => setEditingBudget(budget)}
                    disabled={submitting}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-link danger"
                    onClick={() => handleDelete(budget)}
                    disabled={submitting}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {(showCreateModal || editingBudget) && (
        <div className="modal-overlay" role="presentation">
          <div className="modal-card budgets-modal">
            <div className="modal-header">
              <h3>{editingBudget ? 'Editar presupuesto' : 'Nuevo presupuesto'}</h3>
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingBudget(null);
                }}
              >
                x
              </button>
            </div>

            <BudgetsForm
              categories={categories}
              initialData={editingBudget}
              isEditing={Boolean(editingBudget)}
              submitting={submitting}
              onSubmit={editingBudget ? handleEdit : handleCreate}
              onCancel={() => {
                setShowCreateModal(false);
                setEditingBudget(null);
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
