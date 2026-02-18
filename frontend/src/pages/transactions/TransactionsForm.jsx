import { useMemo, useState } from 'react';

const getToday = () => new Date().toISOString().slice(0, 10);
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

export default function TransactionsForm({
  accounts,
  categories,
  initialData,
  isEditing,
  onSubmit,
  onCancel
}) {
  const [accountId, setAccountId] = useState(initialData?.account_id || '');
  const [type, setType] = useState(initialData?.type || 'expense');
  const [amount, setAmount] = useState(
    initialData?.amount != null ? formatCopAmount(initialData.amount) : ''
  );
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [date, setDate] = useState(initialData?.date || getToday());
  const [description, setDescription] = useState(initialData?.description || '');
  const [error, setError] = useState('');

  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.type === type &&
          (category.status === undefined || category.status === 'active')
      ),
    [categories, type]
  );

  const handleTypeChange = (nextType) => {
    setType(nextType);

    const firstForType = categories.find((category) => category.type === nextType);
    setCategoryId(firstForType?.id || '');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const numericAmount = parseCopAmount(amount);

    if (!isEditing && !accountId) {
      setError('Selecciona una cuenta.');
      return;
    }

    if (!categoryId) {
      setError('Selecciona una categoria.');
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      setError('El monto debe ser mayor a cero.');
      return;
    }

    const payload = {
      type,
      amount: numericAmount,
      category_id: categoryId,
      date,
      description: description.trim() || undefined
    };

    if (!isEditing) {
      payload.account_id = accountId;
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="transactions-form">
      {!isEditing && (
        <div className="field-group">
          <label htmlFor="transaction-account">Cuenta</label>
          <select
            id="transaction-account"
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            required
          >
            <option value="">Selecciona una cuenta</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="field-row">
        <div className="field-group">
          <label htmlFor="transaction-type">Tipo</label>
          <select
            id="transaction-type"
            value={type}
            onChange={(event) => handleTypeChange(event.target.value)}
          >
            <option value="income">Ingreso</option>
            <option value="expense">Gasto</option>
          </select>
        </div>

        <div className="field-group">
          <label htmlFor="transaction-amount">Monto</label>
          <input
            id="transaction-amount"
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(formatCopAmount(event.target.value))}
            placeholder="Ej: 1.250.000"
            required
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label htmlFor="transaction-category">Categoria</label>
          <select
            id="transaction-category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            required
          >
            <option value="">Selecciona una categoria</option>
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label htmlFor="transaction-date">Fecha</label>
          <input
            id="transaction-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="transaction-description">Descripcion (opcional)</label>
        <input
          id="transaction-description"
          type="text"
          maxLength={255}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Ej: Pago de internet"
        />
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary">
          {isEditing ? 'Guardar cambios' : 'Guardar transaccion'}
        </button>
      </div>
    </form>
  );
}
