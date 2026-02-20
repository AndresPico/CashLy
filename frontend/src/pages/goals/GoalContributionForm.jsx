import { useState } from 'react';

const today = () => new Date().toISOString().slice(0, 10);

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

export default function GoalContributionForm({
  accounts,
  initialData,
  submitting,
  onSubmit,
  onCancel
}) {
  const [form, setForm] = useState({
    account_id: initialData?.account_id || '',
    amount: initialData?.amount ? formatCopAmount(initialData.amount) : '',
    date: initialData?.date || today(),
    description: initialData?.description || ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const amount = parseCopAmount(form.amount);

    if (!form.account_id) {
      setError('Debes seleccionar una cuenta.');
      return;
    }

    if (!amount || amount <= 0) {
      setError('El aporte debe ser mayor a cero.');
      return;
    }

    const payload = {
      account_id: form.account_id,
      amount,
      date: form.date
    };

    if (form.description.trim()) {
      payload.description = form.description.trim();
    }

    await onSubmit(payload);
  };

  return (
    <form className="goals-form" onSubmit={handleSubmit}>
      <label>
        Cuenta origen
        <select
          value={form.account_id}
          onChange={(event) => setForm((prev) => ({ ...prev, account_id: event.target.value }))}
          disabled={submitting}
        >
          <option value="">Selecciona una cuenta</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Monto del aporte
        <input
          type="text"
          inputMode="numeric"
          value={form.amount}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, amount: formatCopAmount(event.target.value) }))
          }
          disabled={submitting}
          placeholder="Ej: 150.000"
        />
      </label>

      <label>
        Fecha
        <input
          type="date"
          value={form.date}
          onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
          disabled={submitting}
        />
      </label>

      <label>
        Descripcion (opcional)
        <textarea
          rows={2}
          maxLength={255}
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          disabled={submitting}
          placeholder="Ej: Transferencia semanal"
        />
      </label>

      {error ? <p className="page-error">{error}</p> : null}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Guardando...' : initialData ? 'Actualizar aporte' : 'Registrar aporte'}
        </button>
      </div>
    </form>
  );
}
