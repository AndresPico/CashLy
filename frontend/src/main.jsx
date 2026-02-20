import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { FeedbackProvider } from './context/FeedbackContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/Feedback.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <FeedbackProvider>
        <App />
      </FeedbackProvider>
    </AuthProvider>
  </React.StrictMode>
);
