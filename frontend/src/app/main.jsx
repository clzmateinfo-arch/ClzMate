import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Toaster } from 'react-hot-toast';
import App from '@/app/App.jsx';
import '@/app/index.css';
import rootReducer from './store/rootReducer';

const store = configureStore({
  reducer: rootReducer
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Provider store={store}>
      <React.StrictMode>
        <App />
        <Toaster
          position="bottom-right"
          reverseOrder={false}
        />
      </React.StrictMode>
    </Provider>
  </BrowserRouter>
)





