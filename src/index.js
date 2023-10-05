import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { PageProvider } from './contexts/PageContext';

ReactDOM.render(
  <React.StrictMode>
    <PageProvider>
      <App />
    </PageProvider>
  </React.StrictMode>,
  document.getElementById('root')
);