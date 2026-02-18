import { useMemo, useState } from 'react';

const currentMonth = () => new Date().toISOString().slice(0, 7);
const formatCopAmount = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('es-CO');
};
const parseCopAmount = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return 0;
  return Number(digits);
};

export default function BudgetsForm({
  categories,
  initialData,
  isEditing,
  submitting,
  onSubmit,
  onCancel
}) {
  const [form, setForm] = useState({
    category_id: initialData?.category_id || '',
    amount: initialData?.amount ? formatCopAmount(initialData.amount) : '',
    period: initialData?.period || 'monthly',
    month: initialData?.period_start?.slice(0, 7) || currentMonth()
  });
  const [error, setError] = useState('');

  const selectableCategories = useMemo(
    () => categories.filter((category) => category.type === 'expense'),
    [categories]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!isEditing && !form.category_id) {
      setError('Debes seleccionar una categoria de gasto.');
      return;
    }

    const numericAmount = parseCopAmount(form.amount);

    if (!numericAmount || numericAmount <= 0) {
      setError('El monto debe ser mayor que cero.');
      return;
    }

    if (!form.month) {
      setError('Selecciona un mes para el presupuesto.');
      return;
    }

    const payload = {
      amount: numericAmount,
      period: 'monthly',
      month: form.month
    };

    if (!isEditing) {
      payload.category_id = form.category_id;
    }

    await onSubmit(payload);
  };

  return (
    <form className="budgets-form" onSubmit={handleSubmit}>
      {!isEditing && (
        <label>
          Categoria (gasto)
          <select
            value={form.category_id}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, category_id: event.target.value }))
            }
            disabled={submitting}
          >
            <option value="">Selecciona una categoria</option>
            {selectableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label>
        Monto maximo
        <input
          type="text"
          inputMode="numeric"
          value={form.amount}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, amount: formatCopAmount(event.target.value) }))
          }
          placeholder="Ej: 500.000"
          disabled={submitting}
        />
      </label>

      <label>
        Periodo
        <select value={form.period} disabled>
          <option value="monthly">Mensual</option>
        </select>
      </label>

      <label>
        Mes
        <input
          type="month"
          value={form.month}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, month: event.target.value }))
          }
          disabled={submitting}
        />
      </label>

      {error ? <p className="page-error">{error}</p> : null}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear presupuesto'}
        </button>
      </div>
    </form>
  );
}
