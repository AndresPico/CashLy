import { useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  updateTransaction
} from '../../services/transactions.service';
import { getAccounts } from '../../services/accounts.service';
import { getCategories } from '../../services/categories.service';
import TransactionsForm from './TransactionsForm';
import '../../assets/css/TransactionsPage.css';

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

const getToday = () => new Date().toISOString().slice(0, 10);

const emptyFilters = {
  account_id: '',
  type: '',
  category_id: '',
  date_from: '',
  date_to: ''
};

export default function TransactionsPage() {
  const { token, loading: authLoading } = useAuthContext();

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadTransactions = async (nextFilters = filters) => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const data = await getTransactions(token, nextFilters);
      setTransactions(data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las transacciones');
    } finally {
      setLoading(false);
    }
  };

  const loadBaseData = async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const [accountsData, categoriesData] = await Promise.all([
        getAccounts(token),
        getCategories(token)
      ]);

      setAccounts(accountsData);
      setCategories(categoriesData);
      await loadTransactions(filters);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las transacciones');
      setLoading(false);
    } finally {
      // loadTransactions handles loading lifecycle
    }
  };

  useEffect(() => {
    if (authLoading || !token) return;
    loadBaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, token]);

  useEffect(() => {
    if (authLoading || !token) return;
    loadTransactions(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const totals = useMemo(() => {
    const income = transactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const expense = transactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      income,
      expense,
      net: income - expense
    };
  }, [transactions]);

  const accountNameById = useMemo(() => {
    const map = new Map();
    accounts.forEach((account) => {
      map.set(account.id, account.name);
    });
    return map;
  }, [accounts]);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    setError('');

    try {
      await createTransaction(payload, token);
      setShowCreateModal(false);
      await loadBaseData();
    } catch (err) {
      setError(err.message || 'No se pudo crear la transaccion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (payload) => {
    if (!editingTransaction) return;

    setSubmitting(true);
    setError('');

    try {
      await updateTransaction(editingTransaction.id, payload, token);
      setEditingTransaction(null);
      await loadBaseData();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la transaccion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (transactionId) => {
    if (!window.confirm('Esta accion eliminara la transaccion. Deseas continuar?')) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await deleteTransaction(transactionId, token);
      await loadBaseData();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la transaccion');
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
  };

  if (authLoading || loading) {
    return (
      <div className="transactions-loading">
        <div className="spinner" />
        <p>Cargando transacciones...</p>
      </div>
    );
  }

  return (
    <section className="transactions-page">
      <header className="transactions-header">
        <div>
          <h1>Transactions</h1>
          <p>Gestiona ingresos y gastos con impacto automatico en balances.</p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          Nueva transaccion
        </button>
      </header>

      <div className="totals-grid">
        <article className="total-card income">
          <span>Total ingresos</span>
          <strong>{formatCurrency(totals.income)}</strong>
        </article>
        <article className="total-card expense">
          <span>Total gastos</span>
          <strong>{formatCurrency(totals.expense)}</strong>
        </article>
        <article className={`total-card net ${totals.net >= 0 ? 'positive' : 'negative'}`}>
          <span>Balance neto</span>
          <strong>{formatCurrency(totals.net)}</strong>
        </article>
      </div>

      <section className="filters-card">
        <div className="filters-grid">
          <label>
            Cuenta
            <select
              value={filters.account_id}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, account_id: event.target.value }))
              }
            >
              <option value="">Todas</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tipo
            <select
              value={filters.type}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  type: event.target.value,
                  category_id:
                    prev.category_id &&
                    categories.find((c) => c.id === prev.category_id)?.type !==
                      event.target.value &&
                    event.target.value
                      ? ''
                      : prev.category_id
                }))
              }
            >
              <option value="">Todos</option>
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
            </select>
          </label>

          <label>
            Categoria
            <select
              value={filters.category_id}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, category_id: event.target.value }))
              }
            >
              <option value="">Todas</option>
              {categories
                .filter((category) => !filters.type || category.type === filters.type)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </label>

          <label>
            Desde
            <input
              type="date"
              value={filters.date_from}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, date_from: event.target.value }))
              }
            />
          </label>

          <label>
            Hasta
            <input
              type="date"
              value={filters.date_to}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, date_to: event.target.value }))
              }
            />
          </label>
        </div>

        <button type="button" className="btn-secondary" onClick={clearFilters}>
          Limpiar filtros
        </button>
      </section>

      {error ? <p className="page-error">{error}</p> : null}

      {transactions.length === 0 ? (
        <section className="empty-state">
          <h3>No hay transacciones para los filtros seleccionados</h3>
          <p>Registra tu primera transaccion para comenzar.</p>
          <button type="button" className="btn-primary" onClick={() => setShowCreateModal(true)}>
            Crear transaccion
          </button>
        </section>
      ) : (
        <section className="transactions-table-wrapper">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Descripcion</th>
                <th>Monto</th>
                <th>Tipo</th>
                <th>Cuenta</th>
                <th>Categoria</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.description || '-'}</td>
                  <td className={transaction.type === 'income' ? 'amount-income' : 'amount-expense'}>
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td>
                    <span className={`badge ${transaction.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                      {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                    </span>
                  </td>
                  <td>{transaction.accounts?.name || accountNameById.get(transaction.account_id) || '-'}</td>
                  <td>{transaction.categories?.name || '-'}</td>
                  <td>{formatDate(transaction.date)}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() =>
                          setEditingTransaction({
                            ...transaction,
                            amount: Number(transaction.amount),
                            date: transaction.date || getToday()
                          })
                        }
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-link danger"
                        onClick={() => handleDelete(transaction.id)}
                        disabled={submitting}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {(showCreateModal || editingTransaction) && (
        <div className="modal-overlay" role="presentation">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingTransaction ? 'Editar transaccion' : 'Nueva transaccion'}</h3>
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTransaction(null);
                }}
              >
                x
              </button>
            </div>

            <TransactionsForm
              accounts={accounts}
              categories={categories}
              initialData={editingTransaction}
              isEditing={Boolean(editingTransaction)}
              onSubmit={editingTransaction ? handleEdit : handleCreate}
              onCancel={() => {
                setShowCreateModal(false);
                setEditingTransaction(null);
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
