import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useAuth } from './contexts/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChartOfAccounts from './pages/ChartOfAccounts';
import JournalEntries from './pages/JournalEntries';
import GeneralLedger from './pages/GeneralLedger';
import TrialBalance from './pages/TrialBalance';
import Organizations from './pages/Organizations';

// Layouts
import MainLayout from './components/layouts/MainLayout';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  const { currentUser } = useAuth();

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (!currentUser) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/chart-of-accounts" element={
          <ProtectedRoute>
            <MainLayout>
              <ChartOfAccounts />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/journal-entries" element={
          <ProtectedRoute>
            <MainLayout>
              <JournalEntries />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/general-ledger" element={
          <ProtectedRoute>
            <MainLayout>
              <GeneralLedger />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/trial-balance" element={
          <ProtectedRoute>
            <MainLayout>
              <TrialBalance />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/organizations" element={
          <ProtectedRoute>
            <MainLayout>
              <Organizations />
            </MainLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
