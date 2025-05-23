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
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  Tabs,
  Tab,
  Divider,
  TablePagination
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PostAddIcon from '@mui/icons-material/PostAdd';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import apiService from '../services/api';
import { JournalEntry, JournalEntryItem, Account } from '../types';

// Validation schema for journal entry form
const validationSchema = yup.object({
  entryDate: yup.date().required('Entry date is required'),
  fiscalPeriodId: yup.number().required('Fiscal period is required'),
  items: yup.array().of(
    yup.object({
      accountId: yup.number().required('Account is required'),
      debitAmount: yup.number().min(0, 'Must be positive or zero'),
      creditAmount: yup.number().min(0, 'Must be positive or zero')
    })
  ).min(2, 'At least two items are required')
});

const JournalEntries: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fiscalPeriods, setFiscalPeriods] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalEntries, setTotalEntries] = useState(0);

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

  // Fetch journal entries when organization is selected
  useEffect(() => {
    if (selectedOrgId) {
      fetchJournalEntries();
      fetchAccounts();
      fetchFiscalPeriods();
    }
  }, [selectedOrgId, page, rowsPerPage, tabValue]);

  const fetchJournalEntries = async () => {
    if (!selectedOrgId) return;
    
    try {
      setLoading(true);
      const status = tabValue === 0 ? 'draft' : tabValue === 1 ? 'posted' : '';
      const response = await apiService.journalEntries.getAll(selectedOrgId, {
        status,
        page: page + 1,
        limit: rowsPerPage
      });
      
      if (response.success && response.data) {
        // Handle the case where data might be an array directly or have a journalEntries property
        const entriesData = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).journalEntries || [];
        setJournalEntries(entriesData);
        
        // Handle pagination data
        const paginationData = Array.isArray(response.data) 
          ? { total: entriesData.length } 
          : (response.data as any).pagination || { total: entriesData.length };
        setTotalEntries(paginationData.total || 0);
      } else {
        setError(response.error?.message || 'Failed to load journal entries');
      }
    } catch (err) {
      setError('Failed to load journal entries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    if (!selectedOrgId) return;
    
    try {
      const response = await apiService.accounts.getAll(selectedOrgId, { active: true });
      if (response.success && response.data) {
        // Ensure data is an array
        const accountsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).accounts || [];
        setAccounts(accountsData);
      }
    } catch (err) {
      console.error('Failed to load accounts', err);
    }
  };

  const fetchFiscalPeriods = async () => {
    if (!selectedOrgId) return;
    
    // This is a placeholder - in a real app, you would have an API endpoint for fiscal periods
    // For now, we'll create a dummy fiscal period
    setFiscalPeriods([
      { id: 1, name: 'Q1 2025', startDate: '2025-01-01', endDate: '2025-03-31', isClosed: false },
      { id: 2, name: 'Q2 2025', startDate: '2025-04-01', endDate: '2025-06-30', isClosed: false }
    ]);
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    formik.resetForm();
  };

  const handleViewEntry = async (entryId: number) => {
    if (!selectedOrgId) return;
    
    try {
      const response = await apiService.journalEntries.getById(selectedOrgId, entryId);
      if (response.success && response.data) {
        setCurrentEntry(response.data as JournalEntry);
        setViewDialog(true);
      } else {
        showSnackbar(response.error?.message || 'Failed to load journal entry', 'error');
      }
    } catch (err) {
      showSnackbar('An error occurred', 'error');
      console.error(err);
    }
  };

  const handleCloseViewDialog = () => {
    setViewDialog(false);
    setCurrentEntry(null);
  };

  const handlePostEntry = async (entryId: number) => {
    if (!selectedOrgId) return;
    
    try {
      const response = await apiService.journalEntries.post(selectedOrgId, entryId);
      if (response.success) {
        showSnackbar('Journal entry posted successfully', 'success');
        fetchJournalEntries(); // Refresh the list
      } else {
        showSnackbar(response.error?.message || 'Failed to post journal entry', 'error');
      }
    } catch (err) {
      showSnackbar('An error occurred', 'error');
      console.error(err);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0); // Reset to first page when changing tabs
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Initial form values
  const initialJournalEntry: JournalEntry = {
    entryDate: new Date().toISOString().split('T')[0],
    fiscalPeriodId: 0,
    description: '',
    reference: '',
    items: [
      { accountId: 0, description: '', debitAmount: 0, creditAmount: 0 },
      { accountId: 0, description: '', debitAmount: 0, creditAmount: 0 }
    ]
  };

  // Form handling
  const formik = useFormik({
    initialValues: initialJournalEntry,
    validationSchema,
    onSubmit: async (values) => {
      if (!selectedOrgId) return;
      
      // Validate that debits equal credits
      const totalDebits = values.items.reduce((sum, item) => sum + (item.debitAmount || 0), 0);
      const totalCredits = values.items.reduce((sum, item) => sum + (item.creditAmount || 0), 0);
      
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        showSnackbar('Total debits must equal total credits', 'error');
        return;
      }
      
      try {
        const response = await apiService.journalEntries.create(selectedOrgId, values);
        
        if (response.success) {
          showSnackbar('Journal entry created successfully', 'success');
          handleCloseDialog();
          fetchJournalEntries(); // Refresh the list
        } else {
          showSnackbar(response.error?.message || 'Failed to create journal entry', 'error');
        }
      } catch (err) {
        showSnackbar('An error occurred', 'error');
        console.error(err);
      }
    },
  });

  // Add a new journal entry item
  const addJournalEntryItem = () => {
    const newItems = [...formik.values.items, { accountId: 0, description: '', debitAmount: 0, creditAmount: 0 }];
    formik.setFieldValue('items', newItems);
  };

  // Remove a journal entry item
  const removeJournalEntryItem = (index: number) => {
    if (formik.values.items.length <= 2) {
      showSnackbar('Journal entry must have at least two items', 'error');
      return;
    }
    
    const newItems = [...formik.values.items];
    newItems.splice(index, 1);
    formik.setFieldValue('items', newItems);
  };

  // Calculate totals for the form
  const calculateTotals = () => {
    const totalDebits = formik.values.items.reduce((sum, item) => sum + (parseFloat(item.debitAmount.toString()) || 0), 0);
    const totalCredits = formik.values.items.reduce((sum, item) => sum + (parseFloat(item.creditAmount.toString()) || 0), 0);
    return { totalDebits, totalCredits, difference: totalDebits - totalCredits };
  };

  const { totalDebits, totalCredits, difference } = calculateTotals();

  if (loading && journalEntries.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Journal Entries
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 200 }}>
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
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          disabled={!selectedOrgId}
        >
          New Journal Entry
        </Button>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="journal entry tabs">
          <Tab label="Draft" />
          <Tab label="Posted" />
          <Tab label="All" />
        </Tabs>
      </Box>
      
      {journalEntries.length === 0 ? (
        <Alert severity="info">
          No journal entries found. Create your first journal entry to get started.
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Entry No</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {journalEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.entryNo}</TableCell>
                    <TableCell>{new Date(entry.entryDate).toLocaleDateString()}</TableCell>
                    <TableCell>{entry.description || '-'}</TableCell>
                    <TableCell>{entry.reference || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={entry.status} 
                        color={entry.status === 'posted' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewEntry(entry.id!)}
                        aria-label="view"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      {entry.status === 'draft' && (
                        <IconButton 
                          size="small" 
                          onClick={() => handlePostEntry(entry.id!)}
                          aria-label="post"
                          color="primary"
                        >
                          <PostAddIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
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
      
      {/* New Journal Entry Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle>Create New Journal Entry</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns as any}>
                    <DatePicker
                      label="Entry Date"
                      value={new Date(formik.values.entryDate)}
                      onChange={(date) => {
                        if (date) {
                          formik.setFieldValue('entryDate', date.toISOString().split('T')[0]);
                        }
                      }}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          fullWidth 
                          error={formik.touched.entryDate && Boolean(formik.errors.entryDate)}
                          helperText={formik.touched.entryDate && formik.errors.entryDate as string}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={formik.touched.fiscalPeriodId && Boolean(formik.errors.fiscalPeriodId)}>
                    <InputLabel id="fiscal-period-label">Fiscal Period</InputLabel>
                    <Select
                      labelId="fiscal-period-label"
                      id="fiscalPeriodId"
                      name="fiscalPeriodId"
                      value={formik.values.fiscalPeriodId || ''}
                      label="Fiscal Period"
                      onChange={formik.handleChange}
                    >
                      <MenuItem value={0} disabled>Select Fiscal Period</MenuItem>
                      {fiscalPeriods.map((period) => (
                        <MenuItem key={period.id} value={period.id} disabled={period.isClosed}>
                          {period.name} ({period.startDate} - {period.endDate})
                          {period.isClosed ? ' (Closed)' : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="description"
                    name="description"
                    label="Description"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="reference"
                    name="reference"
                    label="Reference"
                    value={formik.values.reference}
                    onChange={formik.handleChange}
                  />
                </Grid>
              </Grid>
              
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Journal Entry Items
              </Typography>
              
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Account</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Debit</TableCell>
                      <TableCell align="right">Credit</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formik.values.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <FormControl 
                            fullWidth 
                            error={
                              formik.touched.items && 
                              formik.touched.items[index] && 
                              (formik.touched.items[index] as any)?.accountId && 
                              Boolean((formik.errors.items && formik.errors.items[index] as any)?.accountId)
                            }
                            size="small"
                          >
                            <InputLabel id={`account-label-${index}`}>Account</InputLabel>
                            <Select
                              labelId={`account-label-${index}`}
                              id={`items[${index}].accountId`}
                              name={`items[${index}].accountId`}
                              value={item.accountId || ''}
                              label="Account"
                              onChange={formik.handleChange}
                            >
                              <MenuItem value={0} disabled>Select Account</MenuItem>
                              {accounts.map((account) => (
                                <MenuItem key={account.id} value={account.id}>
                                  {account.code} - {account.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            id={`items[${index}].description`}
                            name={`items[${index}].description`}
                            value={item.description}
                            onChange={formik.handleChange}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            id={`items[${index}].debitAmount`}
                            name={`items[${index}].debitAmount`}
                            value={item.debitAmount || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              formik.setFieldValue(`items[${index}].debitAmount`, value ? parseFloat(value) : 0);
                              if (value && parseFloat(value) > 0) {
                                formik.setFieldValue(`items[${index}].creditAmount`, 0);
                              }
                            }}
                            type="number"
                            inputProps={{ min: 0, step: 0.01 }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            id={`items[${index}].creditAmount`}
                            name={`items[${index}].creditAmount`}
                            value={item.creditAmount || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              formik.setFieldValue(`items[${index}].creditAmount`, value ? parseFloat(value) : 0);
                              if (value && parseFloat(value) > 0) {
                                formik.setFieldValue(`items[${index}].debitAmount`, 0);
                              }
                            }}
                            type="number"
                            inputProps={{ min: 0, step: 0.01 }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton 
                            size="small" 
                            onClick={() => removeJournalEntryItem(index)}
                            disabled={formik.values.items.length <= 2}
                          >
                            -
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Totals row */}
                    <TableRow>
                      <TableCell colSpan={2} align="right">
                        <Typography variant="subtitle2">Totals:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2">{totalDebits.toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2">{totalCredits.toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={addJournalEntryItem}>
                          +
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    
                    {/* Difference row */}
                    <TableRow>
                      <TableCell colSpan={2} align="right">
                        <Typography variant="subtitle2">Difference:</Typography>
                      </TableCell>
                      <TableCell colSpan={2} align="right">
                        <Typography 
                          variant="subtitle2" 
                          color={Math.abs(difference) < 0.01 ? 'success.main' : 'error.main'}
                        >
                          {difference.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              {formik.errors.items && typeof formik.errors.items === 'string' && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formik.errors.items}
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={Math.abs(difference) >= 0.01}
            >
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* View Journal Entry Dialog */}
      <Dialog open={viewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Journal Entry Details
          {currentEntry && (
            <Typography variant="subtitle1" color="text.secondary">
              {currentEntry.entryNo} - {new Date(currentEntry.entryDate).toLocaleDateString()}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {currentEntry && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Description</Typography>
                  <Typography variant="body1">{currentEntry.description || '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Reference</Typography>
                  <Typography variant="body1">{currentEntry.reference || '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={currentEntry.status} 
                    color={currentEntry.status === 'posted' ? 'success' : 'default'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Created By</Typography>
                  <Typography variant="body1">{currentEntry?.createdByName || '-'}</Typography>
                </Grid>
              </Grid>
              
              <Typography variant="h6" gutterBottom>
                Journal Entry Items
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Account</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Debit</TableCell>
                      <TableCell align="right">Credit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentEntry.items && currentEntry.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.accountCode} - {item.accountName}</TableCell>
                        <TableCell>{item.description || '-'}</TableCell>
                        <TableCell align="right">{item.debitAmount ? item.debitAmount.toFixed(2) : '-'}</TableCell>
                        <TableCell align="right">{item.creditAmount ? item.creditAmount.toFixed(2) : '-'}</TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Totals row */}
                    <TableRow>
                      <TableCell colSpan={2} align="right">
                        <Typography variant="subtitle2">Totals:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2">
                          {currentEntry.items && currentEntry.items.reduce((sum, item) => sum + (item.debitAmount || 0), 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2">
                          {currentEntry.items && currentEntry.items.reduce((sum, item) => sum + (item.creditAmount || 0), 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
          {currentEntry && currentEntry.status === 'draft' && (
            <Button 
              onClick={() => {
                handlePostEntry(currentEntry.id!);
                handleCloseViewDialog();
              }}
              variant="contained"
              color="primary"
              startIcon={<PostAddIcon />}
            >
              Post Entry
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default JournalEntries;
