import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './app/App';
import './styles.css';

const container = document.getElementById('app');

if (!container) {
  throw new Error('Missing #app root container');
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
