import React, { useEffect, useState } from 'react';
import { 
  Typography, 
  Paper, 
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import apiService from '../services/api';
import { AccountBalance } from '../types';

const TrialBalance: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [fiscalPeriods, setFiscalPeriods] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedFiscalPeriodId, setSelectedFiscalPeriodId] = useState<string>('');
  const [fiscalPeriod, setFiscalPeriod] = useState<any>(null);
  const [totals, setTotals] = useState({
    totalDebit: 0,
    totalCredit: 0,
    difference: 0
  });

  // Fetch data on component mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await apiService.organizations.getAll();
        if (response.success && response.data) {
          setOrganizations(response.data);
          if (response.data.length > 0) {
            setSelectedOrgId(response.data[0].id);
          }
        }
      } catch (err) {
        setError('Failed to load organizations');
        console.error(err);
      }
    };

    fetchOrganizations();
  }, []);

  // Fetch fiscal periods when organization is selected
  useEffect(() => {
    if (selectedOrgId) {
      fetchFiscalPeriods();
    }
  }, [selectedOrgId]);

  // Fetch trial balance when fiscal period is selected
  useEffect(() => {
    if (selectedOrgId && selectedFiscalPeriodId) {
      fetchTrialBalance();
    }
  }, [selectedOrgId, selectedFiscalPeriodId]);

  const fetchFiscalPeriods = async () => {
    if (!selectedOrgId) return;
    
    // This is a placeholder - in a real app, you would have an API endpoint for fiscal periods
    setFiscalPeriods([
      { id: 1, name: 'Q1 2025', startDate: '2025-01-01', endDate: '2025-03-31', isClosed: false },
      { id: 2, name: 'Q2 2025', startDate: '2025-04-01', endDate: '2025-06-30', isClosed: false }
    ]);
  };

  const fetchTrialBalance = async () => {
    if (!selectedOrgId || !selectedFiscalPeriodId) return;
    
    try {
      setLoading(true);
      
      const response = await apiService.generalLedger.getTrialBalance(
        selectedOrgId, 
        parseInt(selectedFiscalPeriodId)
      );
      
      if (response.success && response.data) {
        const responseData = response.data as any;
        setAccountBalances(responseData.accountBalances || []);
        setFiscalPeriod(responseData.fiscalPeriod || null);
        
        // Calculate totals
        const totalDebit = responseData.totals?.totalDebit || 0;
        const totalCredit = responseData.totals?.totalCredit || 0;
        
        setTotals({
          totalDebit,
          totalCredit,
          difference: totalDebit - totalCredit
        });
      } else {
        setError(response.error?.message || 'Failed to load trial balance');
      }
    } catch (err) {
      setError('Failed to load trial balance');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Group account balances by account type
  const groupedBalances = accountBalances.reduce((acc, balance) => {
    const accountType = balance.accountTypeName;
    if (!acc[accountType]) {
      acc[accountType] = [];
    }
    acc[accountType].push(balance);
    return acc;
  }, {} as Record<string, AccountBalance[]>);

  if (loading && accountBalances.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Trial Balance
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="organization-select-label">Organization</InputLabel>
              <Select
                labelId="organization-select-label"
                value={selectedOrgId || ''}
                label="Organization"
                onChange={(e) => setSelectedOrgId(e.target.value as number)}
              >
                {organizations.map((org) => (
                  <MenuItem key={org.id} value={org.id}>
                    {org.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="fiscal-period-label">Fiscal Period</InputLabel>
              <Select
                labelId="fiscal-period-label"
                value={selectedFiscalPeriodId}
                label="Fiscal Period"
                onChange={(e) => setSelectedFiscalPeriodId(e.target.value as string)}
              >
                <MenuItem value="" disabled>Select Fiscal Period</MenuItem>
                {fiscalPeriods.map((period) => (
                  <MenuItem key={period.id} value={period.id}>
                    {period.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              fullWidth
              disabled={accountBalances.length === 0}
            >
              Print Trial Balance
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {fiscalPeriod && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Trial Balance for {fiscalPeriod.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Period: {new Date(fiscalPeriod.startDate).toLocaleDateString()} - {new Date(fiscalPeriod.endDate).toLocaleDateString()}
          </Typography>
        </Paper>
      )}
      
      {accountBalances.length === 0 ? (
        <Alert severity="info">
          {selectedFiscalPeriodId 
            ? 'No account balances found for the selected fiscal period.' 
            : 'Please select a fiscal period to view the trial balance.'}
        </Alert>
      ) : (
        <Box className="print-container">
          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Debits
                  </Typography>
                  <Typography variant="h6">
                    {totals.totalDebit.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Credits
                  </Typography>
                  <Typography variant="h6">
                    {totals.totalCredit.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Difference
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color={Math.abs(totals.difference) > 0.01 ? 'error' : 'inherit'}
                  >
                    {totals.difference.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Trial Balance Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Account Code</TableCell>
                  <TableCell>Account Name</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Credit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(groupedBalances).map(([accountType, balances]) => (
                  <React.Fragment key={accountType}>
                    {/* Account Type Header */}
                    <TableRow>
                      <TableCell 
                        colSpan={4} 
                        sx={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          fontWeight: 'bold'
                        }}
                      >
                        {accountType}
                      </TableCell>
                    </TableRow>
                    
                    {/* Account Balances */}
                    {balances.map((balance) => (
                      <TableRow key={balance.accountId}>
                        <TableCell>{balance.accountCode}</TableCell>
                        <TableCell>{balance.accountName}</TableCell>
                        <TableCell align="right">
                          {balance.normalBalance === 'debit' && balance.closingBalance > 0
                            ? balance.closingBalance.toFixed(2)
                            : balance.normalBalance === 'credit' && balance.closingBalance < 0
                            ? Math.abs(balance.closingBalance).toFixed(2)
                            : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {balance.normalBalance === 'credit' && balance.closingBalance > 0
                            ? balance.closingBalance.toFixed(2)
                            : balance.normalBalance === 'debit' && balance.closingBalance < 0
                            ? Math.abs(balance.closingBalance).toFixed(2)
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Account Type Subtotal */}
                    <TableRow>
                      <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>
                        {accountType} Total:
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {balances
                          .filter(b => 
                            (b.normalBalance === 'debit' && b.closingBalance > 0) || 
                            (b.normalBalance === 'credit' && b.closingBalance < 0)
                          )
                          .reduce((sum, b) => 
                            sum + (b.normalBalance === 'debit' ? b.closingBalance : Math.abs(b.closingBalance)), 
                            0
                          )
                          .toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {balances
                          .filter(b => 
                            (b.normalBalance === 'credit' && b.closingBalance > 0) || 
                            (b.normalBalance === 'debit' && b.closingBalance < 0)
                          )
                          .reduce((sum, b) => 
                            sum + (b.normalBalance === 'credit' ? b.closingBalance : Math.abs(b.closingBalance)), 
                            0
                          )
                          .toFixed(2)}
                      </TableCell>
                    </TableRow>
                    
                    {/* Spacer Row */}
                    <TableRow>
                      <TableCell colSpan={4} sx={{ height: '8px', padding: 0 }} />
                    </TableRow>
                  </React.Fragment>
                ))}
                
                {/* Grand Total */}
                <TableRow>
                  <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>
                    Grand Total:
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {totals.totalDebit.toFixed(2)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {totals.totalCredit.toFixed(2)}
                  </TableCell>
                </TableRow>
                
                {/* Difference Row (if any) */}
                {Math.abs(totals.difference) > 0.01 && (
                  <TableRow>
                    <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                      Difference:
                    </TableCell>
                    <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                      {totals.difference.toFixed(2)}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Print-only styles */}
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .print-container, .print-container * {
                visibility: visible;
              }
              .print-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
            }
          `}</style>
        </Box>
      )}
    </Box>
  );
};

export default TrialBalance;
