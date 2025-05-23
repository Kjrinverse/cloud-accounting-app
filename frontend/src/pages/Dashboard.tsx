import React, { useEffect, useState } from 'react';
import { 
  Typography, 
  Grid, 
  Paper, 
  Box, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { Organization, AccountBalance } from '../types';

const Dashboard: React.FC = () => {
  const { state } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [accountSummary, setAccountSummary] = useState<{
    assets: number;
    liabilities: number;
    equity: number;
    revenue: number;
    expenses: number;
  }>({
    assets: 0,
    liabilities: 0,
    equity: 0,
    revenue: 0,
    expenses: 0
  });
  const [recentEntries, setRecentEntries] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch organizations
        const orgResponse = await apiService.organizations.getAll();
        if (orgResponse.success && orgResponse.data) {
          setOrganizations(orgResponse.data);
          
          // Select the first organization by default
          if (orgResponse.data.length > 0) {
            const defaultOrg = orgResponse.data[0];
            setSelectedOrg(defaultOrg);
            
            // Fetch account balances for the selected organization
            if (defaultOrg.id) {
              const balancesResponse = await apiService.generalLedger.getAccountBalances(defaultOrg.id);
              if (balancesResponse.success && balancesResponse.data) {
                // Ensure data is an array before passing to calculateAccountSummary
                const balancesData = Array.isArray(balancesResponse.data) 
                  ? balancesResponse.data 
                  : [];
                calculateAccountSummary(balancesData);
              }
              
              // Fetch recent journal entries
              const entriesResponse = await apiService.journalEntries.getAll(defaultOrg.id, { 
                limit: 5, 
                page: 1 
              });
              if (entriesResponse.success && entriesResponse.data) {
                // Handle the case where data might be an array directly or have a journalEntries property
                const entriesData = Array.isArray(entriesResponse.data) 
                  ? entriesResponse.data 
                  : (entriesResponse.data as any).journalEntries || [];
                setRecentEntries(entriesData);
              }
            }
          }
        }
      } catch (err) {
        setError('Failed to load dashboard data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const calculateAccountSummary = (balances: AccountBalance[]) => {
    const summary = {
      assets: 0,
      liabilities: 0,
      equity: 0,
      revenue: 0,
      expenses: 0
    };
    
    balances.forEach(balance => {
      const amount = balance.baseClosingBalance;
      
      switch (balance.accountTypeName.toLowerCase()) {
        case 'asset':
          summary.assets += amount;
          break;
        case 'liability':
          summary.liabilities += amount;
          break;
        case 'equity':
          summary.equity += amount;
          break;
        case 'revenue':
          summary.revenue += amount;
          break;
        case 'expense':
          summary.expenses += amount;
          break;
      }
    });
    
    setAccountSummary(summary);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Typography variant="h6" gutterBottom>
        Welcome, {state.user?.firstName} {state.user?.lastName}!
      </Typography>
      
      {organizations.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          You don't have any organizations yet. Create one to get started.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {/* Financial Summary */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Financial Summary
                {selectedOrg && ` - ${selectedOrg.name}`}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardHeader title="Assets" sx={{ pb: 0 }} />
                    <CardContent>
                      <Typography variant="h5">
                        ${accountSummary.assets.toFixed(2)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardHeader title="Liabilities" sx={{ pb: 0 }} />
                    <CardContent>
                      <Typography variant="h5">
                        ${accountSummary.liabilities.toFixed(2)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardHeader title="Equity" sx={{ pb: 0 }} />
                    <CardContent>
                      <Typography variant="h5">
                        ${accountSummary.equity.toFixed(2)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardHeader title="Net Income" sx={{ pb: 0 }} />
                    <CardContent>
                      <Typography variant="h5">
                        ${(accountSummary.revenue - accountSummary.expenses).toFixed(2)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Recent Journal Entries */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Recent Journal Entries
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {recentEntries.length === 0 ? (
                <Typography variant="body1">
                  No journal entries found.
                </Typography>
              ) : (
                <List>
                  {recentEntries.map((entry) => (
                    <React.Fragment key={entry.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={entry.entryNo}
                          secondary={
                            <>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {new Date(entry.entryDate).toLocaleDateString()}
                              </Typography>
                              {` — ${entry.description || 'No description'}`}
                            </>
                          }
                        />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Status: {entry.status}
                          </Typography>
                        </Box>
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
          
          {/* Quick Links */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Quick Links
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                    onClick={() => window.location.href = '/chart-of-accounts'}
                  >
                    <CardContent>
                      <Typography variant="h6">Chart of Accounts</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                    onClick={() => window.location.href = '/journal-entries'}
                  >
                    <CardContent>
                      <Typography variant="h6">Journal Entries</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                    onClick={() => window.location.href = '/general-ledger'}
                  >
                    <CardContent>
                      <Typography variant="h6">General Ledger</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                    onClick={() => window.location.href = '/trial-balance'}
                  >
                    <CardContent>
                      <Typography variant="h6">Trial Balance</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;
