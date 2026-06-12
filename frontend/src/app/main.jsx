import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Toaster } from 'react-hot-toast';
import App from '@/app/App.jsx';
import '@/app/index.css';
import rootReducer from './store/rootReducer';
import { setupAxiosInterceptors } from "@/shared/services/api/apiConnector";
import { setToken } from "@/entities/auth/model/authSlice";
import { setUser } from "@/entities/user/model/userSlice";
import { resetCart } from "@/entities/cart/model/cartSlice";

const store = configureStore({
  reducer: rootReducer
});

setupAxiosInterceptors();

// When the browser unfreezes a background tab, sync Redux with localStorage.
// If another tab logged out (removing localStorage.token), clear Redux state here
// so the user isn't in a stale "logged-in" state that will fail every API call.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const storedToken = localStorage.getItem('token');
  const currentToken = store.getState().auth.token;
  if (!storedToken && currentToken !== null) {
    store.dispatch(setToken(null));
    store.dispatch(setUser(null));
    store.dispatch(resetCart());
  }
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





