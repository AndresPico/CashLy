import { useState } from 'react';
import '../../assets/css/AccountForm.css';

// Lista de bancos fuera del componente para evitar recreación
const banks = [
  { id: 'bbva', name: 'BBVA', logo: '/logos/bbva_logo.png' },
  { id: 'bancolombia', name: 'Bancolombia', logo: '/logos/bancolombia.png' },
  { id: 'daviplata', name: 'Daviplata', logo: '/logos/Daviplata.png' },
  { id: 'lulobank', name: 'LuloBank', logo: '/logos/Lulobank_logo.png' },
  { id: 'nequi', name: 'Nequi', logo: '/logos/nequi_logo.png' },
  { id: 'nubank', name: 'Nubank', logo: '/logos/NU.png' },
  { id: 'other', name: 'Otro Banco', logo: '/logos/other.png' }
];

export default function AccountsForm({ onSubmit, onCancel, initialData = {}, isEditing = false }) {
  // Formatear número con separadores de miles
  const formatNumber = (value) => {
    if (!value) return '';
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    return parseInt(numericValue, 10).toLocaleString('es-CO');
  };

  // Convertir balance formateado a número
  const parseBalance = (formattedValue) => {
    if (!formattedValue) return 0;
    const numericString = formattedValue.replace(/\./g, '');
    const number = parseInt(numericString, 10);
    
    if (isNaN(number)) {
      console.error('Balance no es un número válido:', formattedValue);
      return 0;
    }
    
    return number;
  };

  const resolveInitialBankData = () => {
    const initialType = initialData.type || 'cash';
    const incomingBankName = initialData.bank_name || '';

    if (initialType !== 'bank' || !incomingBankName) {
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

  // Estados
  const [name, setName] = useState(initialData.name || '');
  const [balance, setBalance] = useState(
    initialData.balance !== undefined && initialData.balance !== null
      ? formatNumber(String(initialData.balance))
      : ''
  );
  const [type, setType] = useState(initialData.type || 'cash');
  const [bankName, setBankName] = useState(initialBankData.bankName);
  const [selectedBank, setSelectedBank] = useState(initialBankData.selectedBank);
  const showBankSelect = type === 'bank';

  const handleBalanceChange = (e) => {
    const value = e.target.value;
    const formattedValue = formatNumber(value);
    setBalance(formattedValue);
  };

  const handleBankSelect = (bankId) => {
    const bank = banks.find(b => b.id === bankId);
    if (bank) {
      setSelectedBank(bankId);
      if (bankId === 'other') {
        setBankName('');
      } else {
        setBankName(bank.name);
      }
    }
  };

  const handleTypeChange = (nextType) => {
    setType(nextType);

    if (nextType === 'bank') {
      if (!selectedBank) {
        const firstBank = banks[0];
        setSelectedBank(firstBank.id);
        setBankName(firstBank.name);
      }
      return;
    }

    setSelectedBank('');
    setBankName('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let finalBankName = null;
    if (type === 'bank') {
      const bankId = selectedBank || banks[0].id;
      const bank = banks.find((b) => b.id === bankId);

      if (bankId === 'other') {
        finalBankName = bankName.trim() || null;
      } else {
        finalBankName = bank?.name || null;
      }
    }

    const accountData = {
      name: name.trim(),
      type,
      balance: parseBalance(balance),
      bank_name: finalBankName ?? null
    };

    console.log('📤 Datos finales al Page:', accountData);

    onSubmit(accountData);

    if (!isEditing) {
      setName('');
      setBalance('');
      setType('cash');
      setBankName('');
      setSelectedBank('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="account-form">
      <div className="form-section">
        <h4 className="section-title">Información Básica</h4>
        
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            <span className="label-icon">🏷️</span>
            Nombre de la Cuenta
          </label>
          <input
            id="name"
            type="text"
            placeholder="Ej: Cuenta Principal, Tarjeta de Crédito"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="type" className="form-label">
            <span className="label-icon">📁</span>
            Tipo de Cuenta
          </label>
          <select 
            id="type"
            value={type} 
            onChange={(e) => handleTypeChange(e.target.value)}
            className="form-select"
          >
            <option value="cash">💵 Efectivo</option>
            <option value="bank">🏦 Cuenta Bancaria</option>
            <option value="credit">💳 Tarjeta de Crédito</option>
            <option value="other">📂 Otra</option>
          </select>
        </div>
      </div>

      {showBankSelect && (
        <div className="form-section">
          <h4 className="section-title">Seleccionar Banco</h4>
          
          <div className="bank-selection">
            <div className="bank-grid">
              {banks.map((bank) => (
                <div 
                  key={bank.id}
                  className={`bank-option ${selectedBank === bank.id ? 'selected' : ''}`}
                  onClick={() => handleBankSelect(bank.id)}
                >
                  <div className="bank-logo">
                    <img 
                      src={bank.logo} 
                      alt={bank.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextElementSibling) {
                          e.target.nextElementSibling.style.display = 'flex';
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
                <span className="label-icon">🏦</span>
                Nombre del Banco
              </label>
              <input
                id="customBank"
                type="text"
                placeholder="Escribe el nombre de tu banco"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="form-input"
              />
            </div>
          )}
        </div>
      )}

      <div className="form-section">
        <h4 className="section-title">Detalles de la Cuenta</h4>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="balance" className="form-label">
              <span className="label-icon">💰</span>
              Balance {isEditing ? 'Actual' : 'Inicial'} (COP)
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
            <div className="input-hint">
              Valor en pesos colombianos (sin decimales)
            </div>
          </div>
        </div>
      </div>

      <div className="form-actions">
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            className="cancel-btn"
          >
            Cancelar
          </button>
        )}
        <button type="submit" className="submit-btn">
          <span className="btn-icon">{isEditing ? '💾' : '+'}</span>
          {isEditing ? 'Guardar Cambios' : 'Crear Cuenta'}
        </button>
      </div>
    </form>
  );
}
