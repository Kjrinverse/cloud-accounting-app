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
  TextField,
  Button,
  TablePagination,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import apiService from '../services/api';
import { LedgerEntry, Account } from '../types';

const GeneralLedger: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fiscalPeriods, setFiscalPeriods] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalEntries, setTotalEntries] = useState(0);
  const [filters, setFilters] = useState({
    accountId: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    fiscalPeriodId: ''
  });
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accountBalance, setAccountBalance] = useState({
    openingBalance: 0,
    closingBalance: 0
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

  // Fetch accounts and fiscal periods when organization is selected
  useEffect(() => {
    if (selectedOrgId) {
      fetchAccounts();
      fetchFiscalPeriods();
    }
  }, [selectedOrgId]);

  // Fetch ledger entries when filters change
  useEffect(() => {
    if (selectedOrgId) {
      fetchLedgerEntries();
    }
  }, [selectedOrgId, page, rowsPerPage, filters.accountId, filters.fiscalPeriodId]);

  const fetchAccounts = async () => {
    if (!selectedOrgId) return;
    
    try {
      const response = await apiService.accounts.getAll(selectedOrgId, { active: true });
      if (response.success && response.data) {
        setAccounts(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error('Failed to load accounts', err);
    }
  };

  const fetchFiscalPeriods = async () => {
    if (!selectedOrgId) return;
    
    // This is a placeholder - in a real app, you would have an API endpoint for fiscal periods
    setFiscalPeriods([
      { id: 1, name: 'Q1 2025', startDate: '2025-01-01', endDate: '2025-03-31', isClosed: false },
      { id: 2, name: 'Q2 2025', startDate: '2025-04-01', endDate: '2025-06-30', isClosed: false }
    ]);
  };

  const fetchLedgerEntries = async () => {
    if (!selectedOrgId) return;
    
    try {
      setLoading(true);
      
      const params: any = {
        page: page + 1,
        limit: rowsPerPage
      };
      
      if (filters.accountId) {
        params.accountId = filters.accountId;
      }
      
      if (filters.startDate) {
        params.startDate = filters.startDate.toISOString().split('T')[0];
      }
      
      if (filters.endDate) {
        params.endDate = filters.endDate.toISOString().split('T')[0];
      }
      
      if (filters.fiscalPeriodId) {
        params.fiscalPeriodId = filters.fiscalPeriodId;
      }
      
      let response;
      
      if (filters.accountId) {
        // Fetch ledger entries for a specific account
        response = await apiService.generalLedger.getAccountEntries(
          selectedOrgId, 
          parseInt(filters.accountId as string),
          params
        );
        
        // Set selected account
        const account = accounts.find(a => a.id === parseInt(filters.accountId as string));
        setSelectedAccount(account || null);
        
        // Fetch account balance
        const balanceResponse = await apiService.generalLedger.getAccountBalances(
          selectedOrgId,
          { accountId: filters.accountId, fiscalPeriodId: filters.fiscalPeriodId || undefined }
        );
        
        if (balanceResponse.success && balanceResponse.data) {
          const accountBalances = Array.isArray(balanceResponse.data) ? balanceResponse.data : [];
          const accountBalance = accountBalances.find(
            (b: any) => b.accountId === parseInt(filters.accountId as string)
          );
          
          if (accountBalance) {
            setAccountBalance({
              openingBalance: accountBalance.openingBalance,
              closingBalance: accountBalance.closingBalance
            });
          }
        }
      } else {
        // Fetch all ledger entries
        response = await apiService.generalLedger.getEntries(selectedOrgId, params);
        setSelectedAccount(null);
      }
      
      if (response.success && response.data) {
        const responseData = response.data as any;
        setLedgerEntries(responseData.ledgerEntries || []);
        setTotalEntries(responseData.pagination?.total || 0);
      } else {
        setError(response.error?.message || 'Failed to load general ledger entries');
      }
    } catch (err) {
      setError('Failed to load general ledger entries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0); // Reset to first page when changing filters
  };

  const handleSearch = () => {
    fetchLedgerEntries();
  };

  const handleClearFilters = () => {
    setFilters({
      accountId: '',
      startDate: null,
      endDate: null,
      fiscalPeriodId: ''
    });
    setPage(0);
  };

  if (loading && ledgerEntries.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        General Ledger
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
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
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="account-select-label">Account</InputLabel>
              <Select
                labelId="account-select-label"
                value={filters.accountId}
                label="Account"
                onChange={(e) => handleFilterChange('accountId', e.target.value)}
              >
                <MenuItem value="">All Accounts</MenuItem>
                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="fiscal-period-label">Fiscal Period</InputLabel>
              <Select
                labelId="fiscal-period-label"
                value={filters.fiscalPeriodId}
                label="Fiscal Period"
                onChange={(e) => handleFilterChange('fiscalPeriodId', e.target.value)}
              >
                <MenuItem value="">All Periods</MenuItem>
                {fiscalPeriods.map((period) => (
                  <MenuItem key={period.id} value={period.id}>
                    {period.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns as any}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns as any}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              fullWidth
            >
              Search
            </Button>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              fullWidth
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {selectedAccount && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Account Details
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Account
                  </Typography>
                  <Typography variant="h6">
                    {selectedAccount.code} - {selectedAccount.name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Opening Balance
                  </Typography>
                  <Typography variant="h6">
                    {accountBalance.openingBalance.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Closing Balance
                  </Typography>
                  <Typography variant="h6">
                    {accountBalance.closingBalance.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {ledgerEntries.length === 0 ? (
        <Alert severity="info">
          No general ledger entries found for the selected criteria.
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  {!filters.accountId && <TableCell>Account</TableCell>}
                  <TableCell>Description</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Credit</TableCell>
                  <TableCell align="right">Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ledgerEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.transactionDate).toLocaleDateString()}</TableCell>
                    {!filters.accountId && (
                      <TableCell>{entry.accountCode} - {entry.accountName}</TableCell>
                    )}
                    <TableCell>{entry.description || '-'}</TableCell>
                    <TableCell>{entry.journalEntryReference || '-'}</TableCell>
                    <TableCell align="right">{entry.debitAmount > 0 ? entry.debitAmount.toFixed(2) : '-'}</TableCell>
                    <TableCell align="right">{entry.creditAmount > 0 ? entry.creditAmount.toFixed(2) : '-'}</TableCell>
                    <TableCell align="right">{entry.balance.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={totalEntries}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </>
      )}
    </Box>
  );
};

export default GeneralLedger;
