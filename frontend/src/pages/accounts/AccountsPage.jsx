import { useEffect, useState } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import {
  getAccounts,
  createAccount,
  deleteAccount,
  updateAccount
} from '../../services/accounts.service';
import { useFeedback } from '../../context/FeedbackContext';
import AccountsForm from './AccountsForm';
import '../../assets/css/AccountPage.css';

export default function AccountsPage() {
  const {token, user, loading: authLoading } = useAuthContext();
  const feedback = useFeedback();
  const [accounts, setAccounts] = useState([]);
  const [editingAccount, setEditingAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Funcion para formatear numeros con separadores de miles
  const formatNumber = (number) => {
    if (typeof number !== 'number') return '0';
    // Formatear sin decimales
    return number.toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // Funcion para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      const date = new Date(dateString);
      // Verificar si la fecha es valida
      if (isNaN(date.getTime())) {
        return 'Fecha invalida';
      }
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha invalida';
    }
  };

  // Cargar accounts cuando el token este listo
  useEffect(() => {
    if (authLoading) return;
    if (!token) return;

    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, token]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAccounts(token);
      setAccounts(
        Array.isArray(data)
          ? data.map((account) => ({
              ...account,
              type: account.type === 'credit' ? 'credit_card' : account.type
            }))
          : []
      );
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error cargando cuentas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (accountData) => {
    try {
      const payload = {
        ...accountData,
        userId: user.id // CLAVE
      };

      console.log('Payload final al backend:', payload);

      await createAccount(payload, token);
      await loadAccounts();
      setShowForm(false);
      feedback.success('Cuenta creada correctamente.');
    } catch (err) {
      console.error(err);
      feedback.error(err.message || 'Error al crear la cuenta.');
    }
  };

  const handleDelete = async (accountId) => {
    const shouldDelete = await feedback.confirm({
      title: 'Eliminar cuenta',
      message: 'Estas seguro de eliminar esta cuenta?',
      note: 'Esta accion no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger'
    });

    if (!shouldDelete) return;
    
    try {
      await deleteAccount(accountId, token);
      // Actualizar el estado local inmediatamente
      setAccounts(prevAccounts => prevAccounts.filter(account => account.id !== accountId));
      feedback.success('Cuenta eliminada correctamente.');
    } catch (err) {
      console.error(err);
      feedback.error(err.message || 'Error al eliminar la cuenta.');
    }
  };

  const handleUpdate = async (updatedData) => {
    try {
      console.log('=== ACTUALIZANDO CUENTA ===');
      console.log('ID a actualizar:', editingAccount.id);
      console.log('Datos recibidos del formulario:', updatedData);
      console.log('===========================');
      
      // Aqui solo pasamos los datos del formulario, NO el ID
      await updateAccount(editingAccount.id, updatedData, token);
      await loadAccounts(); // Recargar para obtener datos actualizados
      setEditingAccount(null);
      feedback.success('Cuenta actualizada correctamente.');
    } catch (err) {
      console.error(err);
      feedback.error(err.message || 'Error al actualizar la cuenta.');
    }
  };

  const getAccountIcon = (type) => {
    const icons = {
      cash: '💵',
      bank: '🏦',
      credit_card: '💳',
      other: '📁'
    };
    return icons[type] || '📊';
  };

  const getAccountTypeName = (type) => {
    const names = {
      cash: 'Efectivo',
      bank: 'Banco',
      credit_card: 'Tarjeta de Credito',
      other: 'Otro'
    };
    return names[type] || 'Otro';
  };

  const isInstitutionLinkedType = (type) => ['bank', 'credit_card'].includes(type);

  if (authLoading || loading) {
    return (
      <div className="accounts-loading">
        <div className="spinner"></div>
        <p>Cargando cuentas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="accounts-error">
        <div className="error-icon">⚠️</div>
        <h3>Error al cargar las cuentas</h3>
        <p>{error}</p>
        <button onClick={loadAccounts} className="retry-button">
          Reintentar
        </button>
      </div>
    );
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  return (
    <div className="accounts-page">
      <div className="accounts-header">
        <div className="header-content">
          <h1>🏦 Mis Cuentas</h1>
          <p className="total-balance">
            Balance Total: <span className="balance-amount">${formatNumber(totalBalance)}</span>
          </p>
        </div>
        
        <button 
          className="add-account-btn"
          onClick={() => setShowForm(true)}
        >
          <span className="btn-icon">+</span>
          Nueva Cuenta
        </button>
      </div>

      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <div className="form-header">
              <h3>Agregar Nueva Cuenta</h3>
              <button 
                className="close-form"
                onClick={() => setShowForm(false)}
              >
                ✖
              </button>
            </div>
            <AccountsForm 
              onSubmit={handleCreate} 
              onCancel={() => setShowForm(false)}
              isEditing={false}
            />
          </div>
        </div>
      )}

      {editingAccount && (
        <div className="form-overlay">
          <div className="form-container">
            <div className="form-header">
              <h3>Editar Cuenta</h3>
              <button 
                className="close-form"
                onClick={() => setEditingAccount(null)}
              >
                ✖
              </button>
            </div>
            <AccountsForm
              initialData={editingAccount}
              onSubmit={handleUpdate}
              onCancel={() => setEditingAccount(null)}
              isEditing={true}
            />
          </div>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="empty-accounts">
          <div className="empty-icon">🏦</div>
          <h3>No tienes cuentas registradas</h3>
          <p>Comienza agregando tu primera cuenta para gestionar tus finanzas</p>
          <button 
            className="create-first-btn"
            onClick={() => setShowForm(true)}
          >
            Crear Primera Cuenta
          </button>
        </div>
      ) : (
        <div className="accounts-grid">
          {accounts.map((account) => (
            <div 
              key={account.id} 
              className={`account-card ${selectedAccount === account.id ? 'selected' : ''}`}
              onClick={() => setSelectedAccount(account.id === selectedAccount ? null : account.id)}
            >
              <div className="account-header">
                <div className="account-icon">
                  {getAccountIcon(account.type)}
                </div>
                <div className="account-info">
                  <h3 className="account-name">{account.name}</h3>
                  <span className="account-type">{getAccountTypeName(account.type)}</span>
                </div>
                <div className="account-balance">
                  <span className="balance-label">Balance</span>
                  <span className="balance-amount">${formatNumber(account.balance || 0)}</span>
                </div>
              </div>
              
              {selectedAccount === account.id && (
                <div className="account-details">
                  {isInstitutionLinkedType(account.type) && (
                    <div className="detail-item">
                      <span className="detail-label">Banco:</span>
                      <span className="detail-value">{account.bank_name || 'Banco no asignado'}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Fecha creacion:</span>
                    <span className="detail-value">
                      {formatDate(account.created_at || account.createdAt)}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="account-actions">
                <button 
                  className="action-btn edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingAccount(account);
                  }}
                >
                  ✏️ Editar
                </button>
                <button 
                  className="action-btn delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(account.id);
                  }}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

