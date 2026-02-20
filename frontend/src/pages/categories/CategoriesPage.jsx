import { useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory
} from '../../services/categories.service';
import { useFeedback } from '../../context/FeedbackContext';
import CategoriesForm from './CategoriesForm';
import '../../assets/css/CategoriesPage.css';

const emptyCategory = null;

export default function CategoriesPage() {
  const { token, loading: authLoading } = useAuthContext();
  const feedback = useFeedback();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(emptyCategory);

  const loadCategories = async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const data = await getCategories(token);
      setCategories(data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las categorias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !token) return;
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, token]);

  const groupedCategories = useMemo(() => {
    const income = categories.filter((category) => category.type === 'income');
    const expense = categories.filter((category) => category.type === 'expense');

    return { income, expense };
  }, [categories]);

  const totals = useMemo(() => ({
    total: categories.length,
    income: groupedCategories.income.length,
    expense: groupedCategories.expense.length
  }), [categories.length, groupedCategories.expense.length, groupedCategories.income.length]);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    setError('');

    try {
      await createCategory(payload, token);
      setShowCreateModal(false);
      await loadCategories();
      feedback.success('Categoria creada correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudo crear la categoria');
      feedback.error(err.message || 'No se pudo crear la categoria.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (payload) => {
    if (!editingCategory) return;

    setSubmitting(true);
    setError('');

    try {
      await updateCategory(editingCategory.id, payload, token);
      setEditingCategory(emptyCategory);
      await loadCategories();
      feedback.success('Categoria actualizada correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la categoria');
      feedback.error(err.message || 'No se pudo actualizar la categoria.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category) => {
    const usage = Number(category.transaction_count || 0);

    if (usage > 0) {
      setError('No puedes eliminar una categoria con transacciones asociadas.');
      feedback.error('No puedes eliminar una categoria con transacciones asociadas.');
      return;
    }

    const shouldDelete = await feedback.confirm({
      title: 'Eliminar categoria',
      message: `¿Eliminar la categoria "${category.name}"?`,
      note: 'Esta accion no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger'
    });

    if (!shouldDelete) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await deleteCategory(category.id, token);
      await loadCategories();
      feedback.success('Categoria eliminada correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la categoria');
      feedback.error(err.message || 'No se pudo eliminar la categoria.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderColumn = (type, title, list) => (
    <section className={`category-column ${type}`}>
      <header className="column-header">
        <h2>{title}</h2>
        <span>{list.length}</span>
      </header>

      {list.length === 0 ? (
        <div className="column-empty">
          <p>No hay categorias de {type === 'income' ? 'ingresos' : 'gastos'}.</p>
        </div>
      ) : (
        <div className="category-list">
          {list.map((category) => {
            const isInactive = category.status === 'inactive';

            return (
              <article key={category.id} className={`category-card ${isInactive ? 'inactive' : ''}`}>
                <div className="category-top">
                  <div className="category-identity">
                    <span
                      className="category-icon"
                      style={{ background: category.color || '#334155' }}
                    >
                      {category.icon || '??'}
                    </span>
                    <div>
                      <h3>{category.name}</h3>
                      <small>{type === 'income' ? 'Ingreso' : 'Gasto'}</small>
                    </div>
                  </div>
                  <span className={`status-dot ${isInactive ? 'inactive' : 'active'}`}>
                    {isInactive ? 'Inactiva' : 'Activa'}
                  </span>
                </div>

                <div className="category-meta">
                  <span>Color: {category.color || '-'}</span>
                  <span>Transacciones: {category.transaction_count || 0}</span>
                </div>

                <div className="card-actions">
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => setEditingCategory(category)}
                    disabled={submitting}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-link danger"
                    onClick={() => handleDelete(category)}
                    disabled={submitting}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  if (authLoading || loading) {
    return (
      <div className="categories-loading">
        <div className="spinner" />
        <p>Cargando categorias...</p>
      </div>
    );
  }

  return (
    <section className="categories-page">
      <header className="categories-header">
        <div>
          <h1>Categories</h1>
          <p>Organiza tus transacciones y prepara reportes, presupuestos y analitica.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowCreateModal(true)}>
          Nueva categoria
        </button>
      </header>

      <div className="summary-grid">
        <article>
          <span>Total</span>
          <strong>{totals.total}</strong>
        </article>
        <article>
          <span>Ingresos</span>
          <strong>{totals.income}</strong>
        </article>
        <article>
          <span>Gastos</span>
          <strong>{totals.expense}</strong>
        </article>
      </div>

      {error ? <p className="page-error">{error}</p> : null}

      <div className="columns-grid">
        {renderColumn('income', 'Categorias de Ingresos', groupedCategories.income)}
        {renderColumn('expense', 'Categorias de Gastos', groupedCategories.expense)}
      </div>

      {(showCreateModal || editingCategory) && (
        <div className="modal-overlay" role="presentation">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingCategory ? 'Editar categoria' : 'Nueva categoria'}</h3>
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCategory(emptyCategory);
                }}
              >
                x
              </button>
            </div>

            <CategoriesForm
              initialData={editingCategory}
              isEditing={Boolean(editingCategory)}
              onSubmit={editingCategory ? handleEdit : handleCreate}
              onCancel={() => {
                setShowCreateModal(false);
                setEditingCategory(emptyCategory);
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
