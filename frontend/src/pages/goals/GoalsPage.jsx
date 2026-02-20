import { useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { getAccounts } from '../../services/accounts.service';
import {
  createGoal,
  createGoalContribution,
  deleteGoal,
  deleteGoalContribution,
  getGoalContributions,
  getGoals,
  updateGoal,
  updateGoalContribution
} from '../../services/goals.service';
import GoalsForm from './GoalsForm';
import GoalContributionForm from './GoalContributionForm';
import '../../assets/css/GoalsPage.css';

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const statusLabel = {
  active: 'Activa',
  completed: 'Completada',
  paused: 'Pausada'
};

export default function GoalsPage() {
  const { token, loading: authLoading } = useAuthContext();

  const [accounts, setAccounts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [contributions, setContributions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const [selectedGoalForContribution, setSelectedGoalForContribution] = useState(null);
  const [editingContribution, setEditingContribution] = useState(null);

  const loadPageData = async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const [goalsData, accountsData] = await Promise.all([
        getGoals(token),
        getAccounts(token)
      ]);

      setGoals(goalsData);
      setAccounts(accountsData);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las metas');
    } finally {
      setLoading(false);
    }
  };

  const loadGoalContributions = async (goalId) => {
    if (!token || !goalId) return;

    try {
      const data = await getGoalContributions(goalId, token);
      setContributions(data);
    } catch (err) {
      setContributions([]);
      setError(err.message || 'No se pudieron cargar los aportes');
    }
  };

  useEffect(() => {
    if (authLoading || !token) return;
    loadPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, token]);

  const totals = useMemo(() => {
    return goals.reduce(
      (acc, goal) => {
        acc.target += Number(goal.target_amount || 0);
        acc.saved += Number(goal.saved_amount || 0);
        return acc;
      },
      { target: 0, saved: 0 }
    );
  }, [goals]);

  const handleCreateGoal = async (payload) => {
    setSubmitting(true);
    setError('');

    try {
      await createGoal(payload, token);
      setShowCreateModal(false);
      await loadPageData();
    } catch (err) {
      setError(err.message || 'No se pudo crear la meta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditGoal = async (payload) => {
    if (!editingGoal) return;

    setSubmitting(true);
    setError('');

    try {
      await updateGoal(editingGoal.id, payload, token);
      setEditingGoal(null);
      await loadPageData();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la meta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goal) => {
    if (!window.confirm(`Eliminar la meta "${goal.name}"?`)) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await deleteGoal(goal.id, token);
      await loadPageData();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la meta');
    } finally {
      setSubmitting(false);
    }
  };

  const openContributionModal = async (goal) => {
    setSelectedGoalForContribution(goal);
    setEditingContribution(null);
    await loadGoalContributions(goal.id);
  };

  const closeContributionModal = () => {
    setSelectedGoalForContribution(null);
    setEditingContribution(null);
    setContributions([]);
  };

  const handleCreateContribution = async (payload) => {
    if (!selectedGoalForContribution) return;

    setSubmitting(true);
    setError('');

    try {
      await createGoalContribution(selectedGoalForContribution.id, payload, token);
      await Promise.all([
        loadPageData(),
        loadGoalContributions(selectedGoalForContribution.id)
      ]);
    } catch (err) {
      setError(err.message || 'No se pudo registrar el aporte');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditContribution = async (payload) => {
    if (!selectedGoalForContribution || !editingContribution) return;

    setSubmitting(true);
    setError('');

    try {
      await updateGoalContribution(
        selectedGoalForContribution.id,
        editingContribution.id,
        payload,
        token
      );

      setEditingContribution(null);
      await Promise.all([
        loadPageData(),
        loadGoalContributions(selectedGoalForContribution.id)
      ]);
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el aporte');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContribution = async (contribution) => {
    if (!selectedGoalForContribution) return;

    if (!window.confirm('Eliminar este aporte y devolver fondos a la cuenta?')) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await deleteGoalContribution(selectedGoalForContribution.id, contribution.id, token);
      await Promise.all([
        loadPageData(),
        loadGoalContributions(selectedGoalForContribution.id)
      ]);
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el aporte');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="goals-loading">
        <div className="spinner" />
        <p>Cargando metas...</p>
      </div>
    );
  }

  return (
    <section className="goals-page">
      <header className="goals-header">
        <div>
          <h1>Goals</h1>
          <p>Planifica objetivos de ahorro reales y monitorea su cumplimiento.</p>
        </div>

        <button type="button" className="btn-primary" onClick={() => setShowCreateModal(true)}>
          Nueva meta
        </button>
      </header>

      <section className="goals-summary-grid">
        <article>
          <span>Total objetivo</span>
          <strong>{formatCurrency(totals.target)}</strong>
        </article>
        <article>
          <span>Total ahorrado</span>
          <strong>{formatCurrency(totals.saved)}</strong>
        </article>
        <article>
          <span>Restante global</span>
          <strong>{formatCurrency(totals.target - totals.saved)}</strong>
        </article>
      </section>

      {error ? <p className="page-error">{error}</p> : null}

      {goals.length === 0 ? (
        <section className="empty-state">
          <h3>Aun no tienes metas de ahorro</h3>
          <p>Crea una meta y empieza a construir disciplina financiera.</p>
          <button type="button" className="btn-primary" onClick={() => setShowCreateModal(true)}>
            Crear meta
          </button>
        </section>
      ) : (
        <section className="goals-grid">
          {goals.map((goal) => {
            const progress = Math.min(100, Math.max(0, Number(goal.progress_percentage || 0)));
            const remainingAmount = Number(goal.remaining_amount || 0);

            return (
              <article key={goal.id} className={`goal-card status-${goal.status || 'active'}`}>
                <header>
                  <div>
                    <h3>{goal.name}</h3>
                    <small>Fecha objetivo: {formatDate(goal.target_date)}</small>
                  </div>
                  <span className={`goal-status ${goal.status || 'active'}`}>
                    {statusLabel[goal.status] || statusLabel.active}
                  </span>
                </header>

                <div className="goal-progress-track">
                  <div className="goal-progress-bar" style={{ width: `${progress}%` }} />
                </div>

                <div className="goal-metrics">
                  <p>
                    <span>Objetivo</span>
                    <strong>{formatCurrency(goal.target_amount)}</strong>
                  </p>
                  <p>
                    <span>Ahorrado</span>
                    <strong>{formatCurrency(goal.saved_amount)}</strong>
                  </p>
                  <p>
                    <span>Restante</span>
                    <strong>{formatCurrency(remainingAmount)}</strong>
                  </p>
                </div>

                <p className="goal-progress-label">Progreso: {Math.round(progress)}%</p>

                {goal.description ? <p className="goal-description">{goal.description}</p> : null}

                <div className="card-actions">
                  <button type="button" className="btn-primary" onClick={() => openContributionModal(goal)}>
                    Aportar
                  </button>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => setEditingGoal(goal)}
                    disabled={submitting}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-link danger"
                    onClick={() => handleDeleteGoal(goal)}
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

      {(showCreateModal || editingGoal) && (
        <div className="modal-overlay" role="presentation">
          <div className="modal-card goals-modal">
            <div className="modal-header">
              <h3>{editingGoal ? 'Editar meta' : 'Nueva meta'}</h3>
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingGoal(null);
                }}
              >
                x
              </button>
            </div>

            <GoalsForm
              accounts={accounts}
              initialData={editingGoal}
              isEditing={Boolean(editingGoal)}
              submitting={submitting}
              onSubmit={editingGoal ? handleEditGoal : handleCreateGoal}
              onCancel={() => {
                setShowCreateModal(false);
                setEditingGoal(null);
              }}
            />
          </div>
        </div>
      )}

      {selectedGoalForContribution && (
        <div className="modal-overlay" role="presentation">
          <div className="modal-card contributions-modal">
            <div className="modal-header">
              <h3>
                {editingContribution ? 'Editar aporte' : 'Aportar a'} {selectedGoalForContribution.name}
              </h3>
              <button type="button" className="icon-button" onClick={closeContributionModal}>
                x
              </button>
            </div>

            <GoalContributionForm
              accounts={accounts}
              initialData={editingContribution}
              submitting={submitting}
              onSubmit={editingContribution ? handleEditContribution : handleCreateContribution}
              onCancel={() => {
                if (editingContribution) {
                  setEditingContribution(null);
                  return;
                }

                closeContributionModal();
              }}
            />

            <div className="contributions-list">
              <h4>Aportes registrados</h4>

              {contributions.length === 0 ? (
                <p className="empty-contributions">Sin aportes registrados para esta meta.</p>
              ) : (
                <ul>
                  {contributions.map((contribution) => {
                    const account = accounts.find((item) => item.id === contribution.account_id);
                    return (
                      <li key={contribution.id}>
                        <div>
                          <strong>{formatCurrency(contribution.amount)}</strong>
                          <span>
                            {account?.name || 'Cuenta'} | {formatDate(contribution.date)}
                          </span>
                          {contribution.description ? <small>{contribution.description}</small> : null}
                        </div>

                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn-link"
                            onClick={() => setEditingContribution(contribution)}
                            disabled={submitting}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn-link danger"
                            onClick={() => handleDeleteContribution(contribution)}
                            disabled={submitting}
                          >
                            Eliminar
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
