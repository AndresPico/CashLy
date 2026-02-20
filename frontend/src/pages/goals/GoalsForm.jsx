import { useState } from 'react';

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

export default function GoalsForm({
  accounts,
  initialData,
  isEditing,
  submitting,
  onSubmit,
  onCancel
}) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    target_amount: initialData?.target_amount ? formatCopAmount(initialData.target_amount) : '',
    target_date: initialData?.target_date || '',
    frequency: initialData?.frequency || 'monthly',
    account_id: initialData?.account_id || '',
    description: initialData?.description || '',
    status: initialData?.status === 'paused' ? 'paused' : 'active'
  });
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const normalizedName = form.name.trim();
    const targetAmount = parseCopAmount(form.target_amount);

    if (!normalizedName) {
      setError('El nombre es obligatorio.');
      return;
    }

    if (!targetAmount || targetAmount <= 0) {
      setError('El monto objetivo debe ser mayor a cero.');
      return;
    }

    const payload = {
      name: normalizedName,
      target_amount: targetAmount,
      frequency: form.frequency,
      status: form.status
    };

    if (form.target_date) payload.target_date = form.target_date;
    if (form.account_id) payload.account_id = form.account_id;
    if (form.description.trim()) payload.description = form.description.trim();

    await onSubmit(payload);
  };

  return (
    <form className="goals-form" onSubmit={handleSubmit}>
      <label>
        Nombre de la meta
        <input
          type="text"
          maxLength={120}
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          disabled={submitting}
          placeholder="Ej: Fondo de emergencia"
        />
      </label>

      <label>
        Monto objetivo
        <input
          type="text"
          inputMode="numeric"
          value={form.target_amount}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, target_amount: formatCopAmount(event.target.value) }))
          }
          disabled={submitting}
          placeholder="Ej: 5.000.000"
        />
      </label>

      <label>
        Fecha objetivo (opcional)
        <input
          type="date"
          value={form.target_date}
          onChange={(event) => setForm((prev) => ({ ...prev, target_date: event.target.value }))}
          disabled={submitting}
        />
      </label>

      <label>
        Frecuencia de aporte
        <select
          value={form.frequency}
          onChange={(event) => setForm((prev) => ({ ...prev, frequency: event.target.value }))}
          disabled={submitting}
        >
          <option value="weekly">Semanal</option>
          <option value="biweekly">Quincenal</option>
          <option value="monthly">Mensual</option>
          <option value="custom">Personalizada</option>
        </select>
      </label>

      <label>
        Cuenta asociada (opcional)
        <select
          value={form.account_id}
          onChange={(event) => setForm((prev) => ({ ...prev, account_id: event.target.value }))}
          disabled={submitting}
        >
          <option value="">Sin cuenta fija</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </label>

      {isEditing && (
        <label>
          Estado
          <select
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            disabled={submitting}
          >
            <option value="active">Activa</option>
            <option value="paused">Pausada</option>
          </select>
        </label>
      )}

      <label>
        Descripcion (opcional)
        <textarea
          maxLength={255}
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          disabled={submitting}
          rows={3}
          placeholder="Contexto o detalles de esta meta"
        />
      </label>

      {error ? <p className="page-error">{error}</p> : null}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Guardando...' : isEditing ? 'Actualizar meta' : 'Crear meta'}
        </button>
      </div>
    </form>
  );
}
