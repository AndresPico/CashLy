import { useState } from 'react';

export default function AccountsForm({ onSubmit }) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState(0);
  const [type, setType] = useState('cash');

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit({
      name,
      type,
      balance: Number(balance)
    });

    setName('');
    setBalance(0);
    setType('cash');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Nueva cuenta</h3>

      <input
        type="text"
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="cash">Efectivo</option>
        <option value="bank">Banco</option>
        <option value="credit">Crédito</option>
        <option value="savings">Ahorros</option>
      </select>

      <input
        type="number"
        placeholder="Balance inicial"
        value={balance}
        onChange={(e) => setBalance(e.target.value)}
        min="0"
      />

      <button type="submit">Crear</button>
    </form>
  );
}
