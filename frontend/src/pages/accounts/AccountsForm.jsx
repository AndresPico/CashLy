import { useState } from 'react';
import '../../assets/css/AccountForm.css';

const banks = [
  { id: 'bbva', name: 'BBVA', logo: '/logos/bbva_logo.png' },
  { id: 'bancolombia', name: 'Bancolombia', logo: '/logos/bancolombia.png' },
  { id: 'daviplata', name: 'Daviplata', logo: '/logos/Daviplata.png' },
  { id: 'lulobank', name: 'LuloBank', logo: '/logos/Lulobank_logo.png' },
  { id: 'nequi', name: 'Nequi', logo: '/logos/nequi_logo.png' },
  { id: 'nubank', name: 'Nubank', logo: '/logos/NU.png' },
  { id: 'other', name: 'Otro Banco', logo: '/logos/other.png' }
];

const REQUIRES_BANK_TYPES = new Set(['bank', 'credit_card']);

const requiresBank = (accountType) => REQUIRES_BANK_TYPES.has(accountType);
const normalizeTypeForForm = (accountType) =>
  accountType === 'credit' ? 'credit_card' : (accountType || 'cash');
const normalizeTypeForBackend = (accountType) => accountType;

export default function AccountsForm({ onSubmit, onCancel, initialData = {}, isEditing = false }) {
  const formatNumber = (value) => {
    if (!value) return '';
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    return parseInt(numericValue, 10).toLocaleString('es-CO');
  };

  const parseBalance = (formattedValue) => {
    if (!formattedValue) return 0;
    const numericString = formattedValue.replace(/\./g, '');
    const number = parseInt(numericString, 10);

    if (Number.isNaN(number)) {
      return 0;
    }

    return number;
  };

  const resolveInitialBankData = () => {
    const initialType = normalizeTypeForForm(initialData.type);
    const incomingBankName = initialData.bank_name || '';

    if (!requiresBank(initialType) || !incomingBankName) {
      return { selectedBank: '', bankName: '' };
    }

    const foundBank = banks.find(
      (bank) =>
        bank.name.toLowerCase() === incomingBankName.toLowerCase() ||
        bank.id === incomingBankName.toLowerCase()
    );

    if (foundBank) {
      return { selectedBank: foundBank.id, bankName: foundBank.name };
    }

    return { selectedBank: 'other', bankName: incomingBankName };
  };

  const initialBankData = resolveInitialBankData();

  const [name, setName] = useState(initialData.name || '');
  const [balance, setBalance] = useState(
    initialData.balance !== undefined && initialData.balance !== null
      ? formatNumber(String(initialData.balance))
      : ''
  );
  const [type, setType] = useState(normalizeTypeForForm(initialData.type));
  const [bankName, setBankName] = useState(initialBankData.bankName);
  const [selectedBank, setSelectedBank] = useState(initialBankData.selectedBank);
  const [customType, setCustomType] = useState(initialData.custom_type || '');
  const [formError, setFormError] = useState('');

  const showBankSelect = requiresBank(type);
  const isCreditCardType = type === 'credit_card';
  const showCustomTypeInput = type === 'other';

  const handleBalanceChange = (event) => {
    const value = event.target.value;
    setBalance(formatNumber(value));
  };

  const handleBankSelect = (bankId) => {
    const bank = banks.find((item) => item.id === bankId);
    if (!bank) return;

    setFormError('');
    setSelectedBank(bankId);

    if (bankId === 'other') {
      setBankName('');
      return;
    }

    setBankName(bank.name);
  };

  const clearBankState = () => {
    setSelectedBank('');
    setBankName('');
  };

  const ensureDefaultBank = () => {
    if (selectedBank) return;
    const firstBank = banks[0];
    setSelectedBank(firstBank.id);
    setBankName(firstBank.name);
  };

  const handleTypeChange = (nextType) => {
    setType(nextType);
    setFormError('');

    if (requiresBank(nextType)) {
      ensureDefaultBank();
      return;
    }

    clearBankState();

    if (nextType !== 'other') {
      setCustomType('');
    }
  };

  const validateCustomType = (value) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return 'Escribe el tipo de cuenta.';
    }

    if (trimmed.length < 3) {
      return 'El tipo debe tener al menos 3 caracteres.';
    }

    if (trimmed.length > 40) {
      return 'El tipo no puede superar 40 caracteres.';
    }

    if (!/^[a-zA-Z0-9 ]+$/.test(trimmed)) {
      return 'Usa solo letras, numeros y espacios.';
    }

    return '';
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError('');

    if (showBankSelect) {
      if (!selectedBank) {
        setFormError('Selecciona una entidad financiera para este tipo de cuenta.');
        return;
      }

      if (selectedBank === 'other' && !bankName.trim()) {
        setFormError('Escribe el nombre de la entidad financiera.');
        return;
      }
    }

    if (showCustomTypeInput) {
      const customTypeError = validateCustomType(customType);
      if (customTypeError) {
        setFormError(customTypeError);
        return;
      }
    }

    let finalBankName = null;
    if (showBankSelect) {
      const bank = banks.find((item) => item.id === selectedBank);
      finalBankName = selectedBank === 'other' ? bankName.trim() : (bank?.name || null);
    }

    const accountData = {
      name: name.trim(),
      type: normalizeTypeForBackend(type),
      balance: parseBalance(balance),
      bank_name: finalBankName || null,
      custom_type: showCustomTypeInput ? customType.trim() : null
    };

    onSubmit(accountData);

    if (!isEditing) {
      setName('');
      setBalance('');
      setType('cash');
      clearBankState();
      setCustomType('');
      setFormError('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="account-form">
      <div className="form-section">
        <h4 className="section-title">Informacion basica</h4>

        <div className="form-group">
          <label htmlFor="name" className="form-label">
            <span className="label-icon">🏷️</span>
            Nombre de la cuenta
          </label>
          <input
            id="name"
            type="text"
            placeholder="Ej: Cuenta Principal, Tarjeta de Credito"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="type" className="form-label">
            <span className="label-icon">🗂️</span>
            Tipo de cuenta
          </label>
          <select
            id="type"
            value={type}
            onChange={(event) => handleTypeChange(event.target.value)}
            className="form-select"
          >
            <option value="cash">💵 Efectivo</option>
            <option value="bank">🏦 Cuenta bancaria</option>
            <option value="credit_card">💳 Tarjeta de credito</option>
            <option value="other">📁 Otra</option>
          </select>
        </div>
      </div>

      {showCustomTypeInput && (
        <div className="form-section">
          <h4 className="section-title">Tipo personalizado</h4>
          <div className="form-group">
            <label htmlFor="customType" className="form-label">
              <span className="label-icon">✍️</span>
              Especifica el tipo de cuenta
            </label>
            <input
              id="customType"
              type="text"
              placeholder="Ej: Billetera digital, Fondo comun, Caja menor"
              value={customType}
              onChange={(event) => {
                setCustomType(event.target.value);
                if (formError) setFormError('');
              }}
              className="form-input"
              maxLength={40}
              required
            />
            <div className="input-hint">Minimo 3 caracteres. Solo letras, numeros y espacios.</div>
          </div>
        </div>
      )}

      {showBankSelect && (
        <div className="form-section">
          <h4 className="section-title">🏦 Entidad financiera</h4>

          <div className={`bank-selection ${formError ? 'invalid' : ''}`}>
            <div className="bank-grid">
              {banks.map((bank) => (
                <div
                  key={bank.id}
                  className={`bank-option ${selectedBank === bank.id ? 'selected' : ''}`}
                  onClick={() => handleBankSelect(bank.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleBankSelect(bank.id);
                    }
                  }}
                >
                  <div className="bank-logo">
                    <img
                      src={bank.logo}
                      alt={bank.name}
                      onError={(event) => {
                        event.target.style.display = 'none';
                        if (event.target.nextElementSibling) {
                          event.target.nextElementSibling.style.display = 'flex';
                        }
                      }}
                    />
                    <div className="bank-fallback">{bank.name.charAt(0)}</div>
                  </div>
                  <span className="bank-name">{bank.name}</span>
                </div>
              ))}
            </div>
          </div>

          {selectedBank === 'other' && (
            <div className="form-group">
              <label htmlFor="customBank" className="form-label">
                <span className="label-icon">🏢</span>
                Nombre de la entidad
              </label>
              <input
                id="customBank"
                type="text"
                placeholder="Escribe el nombre de tu banco"
                value={bankName}
                onChange={(event) => {
                  setBankName(event.target.value);
                  if (formError) setFormError('');
                }}
                className="form-input"
                required={selectedBank === 'other'}
              />
            </div>
          )}

          {formError ? <p className="form-error">{formError}</p> : null}
        </div>
      )}

      <div className="form-section">
        <h4 className="section-title">Detalles de la cuenta</h4>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="balance" className="form-label">
              <span className="label-icon">{isCreditCardType ? '💳' : '💰'}</span>
              {isCreditCardType ? 'Cupo maximo (COP)' : `Balance ${isEditing ? 'actual' : 'inicial'} (COP)`}
            </label>
            <div className="input-with-symbol">
              <input
                id="balance"
                type="text"
                placeholder="0"
                value={balance}
                onChange={handleBalanceChange}
                className="form-input"
                required
              />
              <span className="input-symbol">$</span>
            </div>
            <div className="input-hint">Valor en pesos colombianos (sin decimales)</div>
          </div>
        </div>
      </div>

      <div className="form-actions">
        {!showBankSelect && formError ? <p className="form-error">{formError}</p> : null}
        {onCancel && (
          <button type="button" onClick={onCancel} className="cancel-btn">
            <span className="btn-icon">✖</span>
            Cancelar
          </button>
        )}
        <button type="submit" className="submit-btn">
          <span className="btn-icon">{isEditing ? '💾' : '➕'}</span>
          {isEditing ? 'Guardar cambios' : 'Crear cuenta'}
        </button>
      </div>
    </form>
  );
}
