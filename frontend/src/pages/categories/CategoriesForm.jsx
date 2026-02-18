import { useState } from 'react';

const defaultColors = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899'
];

const incomeIcons = ['💼', '💰', '📈', '🎁', '🏆', '💵', '🏦', '🪙'];
const expenseIcons = ['🛒', '🍔', '🏠', '🚗', '💊', '🎓', '✈️', '🧾'];

export default function CategoriesForm({
  initialData,
  isEditing,
  onSubmit,
  onCancel
}) {
  const initialType = initialData?.type || 'expense';
  const initialIconFallback =
    initialType === 'income' ? incomeIcons[0] : expenseIcons[0];

  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState(initialType);
  const [color, setColor] = useState(initialData?.color || '#3b82f6');
  const [icon, setIcon] = useState(initialData?.icon || initialIconFallback);
  const [error, setError] = useState('');

  const availableIcons = type === 'income' ? incomeIcons : expenseIcons;

  const handleTypeChange = (nextType) => {
    setType(nextType);

    const nextIcons = nextType === 'income' ? incomeIcons : expenseIcons;
    if (!nextIcons.includes(icon)) {
      setIcon(nextIcons[0]);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('El nombre es obligatorio.');
      return;
    }

    if (!type) {
      setError('Selecciona un tipo.');
      return;
    }

    setError('');

    const payload = {
      name: trimmedName,
      color,
      icon: icon.trim() || undefined
    };

    if (!isEditing) payload.type = type;

    onSubmit(payload);
  };

  return (
    <form className="categories-form" onSubmit={handleSubmit}>
      <div className="field-group">
        <label htmlFor="category-name">Nombre</label>
        <input
          id="category-name"
          type="text"
          maxLength={50}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej: Alimentacion"
          required
        />
      </div>

      <div className="field-row">
        <div className="field-group">
          <label htmlFor="category-type">Tipo</label>
          <select
            id="category-type"
            value={type}
            onChange={(event) => handleTypeChange(event.target.value)}
            disabled={isEditing}
          >
            <option value="income">Ingreso</option>
            <option value="expense">Gasto</option>
          </select>
          {isEditing ? (
            <small>El tipo se bloquea al editar para evitar inconsistencias.</small>
          ) : null}
        </div>

        <div className="field-group">
          <label htmlFor="category-color">Color</label>
          <input
            id="category-color"
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
          />
        </div>
      </div>

      <div className="chips-row">
        {defaultColors.map((value) => (
          <button
            key={value}
            type="button"
            className={`color-chip ${color === value ? 'selected' : ''}`}
            style={{ background: value }}
            onClick={() => setColor(value)}
            aria-label={`Color ${value}`}
          />
        ))}
      </div>

      <div className="field-group">
        <label htmlFor="category-icon">Icono</label>
        <input
          id="category-icon"
          type="text"
          maxLength={10}
          value={icon}
          onChange={(event) => setIcon(event.target.value)}
          placeholder={availableIcons[0]}
        />
      </div>

      <div className="chips-row icons">
        {availableIcons.map((value) => (
          <button
            key={value}
            type="button"
            className={`icon-chip ${icon === value ? 'selected' : ''}`}
            onClick={() => setIcon(value)}
          >
            {value}
          </button>
        ))}
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary">
          {isEditing ? 'Guardar cambios' : 'Crear categoria'}
        </button>
      </div>
    </form>
  );
}
