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
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { useFormik } from 'formik';
import * as yup from 'yup';
import apiService from '../services/api';
import { Account, AccountType, AccountCategory } from '../types';

// Validation schema for account form
const validationSchema = yup.object({
  code: yup.string().required('Account code is required'),
  name: yup.string().required('Account name is required'),
  accountTypeId: yup.number().required('Account type is required'),
  accountCategoryId: yup.number().required('Account category is required'),
});

const ChartOfAccounts: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [accountCategories, setAccountCategories] = useState<AccountCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);

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

  // Fetch accounts when organization is selected
  useEffect(() => {
    if (selectedOrgId) {
      fetchAccounts();
      fetchAccountTypes();
      fetchAccountCategories();
    }
  }, [selectedOrgId]);

  const fetchAccounts = async () => {
    if (!selectedOrgId) return;
    
    try {
      setLoading(true);
      const response = await apiService.accounts.getAll(selectedOrgId);
      if (response.success && response.data) {
        // Update to directly use response.data as Account[]
        setAccounts(Array.isArray(response.data) ? response.data : []);
      } else {
        setError(response.error?.message || 'Failed to load accounts');
      }
    } catch (err) {
      setError('Failed to load accounts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountTypes = async () => {
    if (!selectedOrgId) return;
    
    try {
      const response = await apiService.accounts.getTypes(selectedOrgId);
      if (response.success && response.data) {
        setAccountTypes(response.data);
      }
    } catch (err) {
      console.error('Failed to load account types', err);
    }
  };

  const fetchAccountCategories = async () => {
    if (!selectedOrgId) return;
    
    try {
      const response = await apiService.accounts.getCategories(selectedOrgId);
      if (response.success && response.data) {
        setAccountCategories(response.data);
      }
    } catch (err) {
      console.error('Failed to load account categories', err);
    }
  };

  const handleOpenDialog = (account: Account | null = null) => {
    setEditingAccount(account);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAccount(null);
    formik.resetForm();
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // Form handling
  const formik = useFormik({
    initialValues: {
      code: '',
      name: '',
      description: '',
      accountTypeId: 0,
      accountCategoryId: 0,
      parentAccountId: null as number | null,
      isActive: true,
      isBankAccount: false,
      bankAccountDetails: null
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!selectedOrgId) return;
      
      try {
        let response;
        
        if (editingAccount) {
          // Update existing account
          response = await apiService.accounts.update(
            selectedOrgId,
            editingAccount.id,
            values
          );
        } else {
          // Create new account
          response = await apiService.accounts.create(selectedOrgId, values);
        }
        
        if (response.success) {
          showSnackbar(
            editingAccount 
              ? 'Account updated successfully' 
              : 'Account created successfully',
            'success'
          );
          handleCloseDialog();
          fetchAccounts(); // Refresh accounts list
        } else {
          showSnackbar(
            response.error?.message || 'Operation failed',
            'error'
          );
        }
      } catch (err) {
        showSnackbar('An error occurred', 'error');
        console.error(err);
      }
    },
  });

  // Set form values when editing an account
  useEffect(() => {
    if (editingAccount) {
      formik.setValues({
        code: editingAccount.code || '',
        name: editingAccount.name || '',
        description: editingAccount.description || '',
        accountTypeId: editingAccount.accountTypeId || 0,
        accountCategoryId: editingAccount.accountCategoryId || 0,
        parentAccountId: editingAccount.parentAccountId || null,
        isActive: editingAccount.isActive,
        isBankAccount: editingAccount.isBankAccount,
        bankAccountDetails: editingAccount.bankAccountDetails || null
      });
    }
  }, [editingAccount]);

  // Filter account categories based on selected account type
  const filteredCategories = accountCategories.filter(
    category => !formik.values.accountTypeId || category.accountTypeId === formik.values.accountTypeId
  );

  if (loading && accounts.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Chart of Accounts
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
          onClick={() => handleOpenDialog()}
          disabled={!selectedOrgId}
        >
          Add Account
        </Button>
      </Box>
      
      {accounts.length === 0 ? (
        <Alert severity="info">
          No accounts found. Create your first account to get started.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{account.code}</TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>{account.accountTypeName}</TableCell>
                  <TableCell>{account.accountCategoryName}</TableCell>
                  <TableCell>
                    <Chip 
                      label={account.isActive ? 'Active' : 'Inactive'} 
                      color={account.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog(account)}
                      aria-label="edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Account Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle>
            {editingAccount ? 'Edit Account' : 'Create New Account'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid sx={{ gridColumn: '1 / 7', gridRow: '1' }}>
                  <TextField
                    fullWidth
                    id="code"
                    name="code"
                    label="Account Code"
                    value={formik.values.code}
                    onChange={formik.handleChange}
                    error={formik.touched.code && Boolean(formik.errors.code)}
                    helperText={formik.touched.code && formik.errors.code}
                  />
                </Grid>
                <Grid sx={{ gridColumn: '7 / 13', gridRow: '1' }}>
                  <TextField
                    fullWidth
                    id="name"
                    name="name"
                    label="Account Name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                  />
                </Grid>
                <Grid sx={{ gridColumn: '1 / 13', gridRow: '2' }}>
                  <TextField
                    fullWidth
                    id="description"
                    name="description"
                    label="Description"
                    multiline
                    rows={2}
                    value={formik.values.description}
                    onChange={formik.handleChange}
                  />
                </Grid>
                <Grid sx={{ gridColumn: '1 / 7', gridRow: '3' }}>
                  <FormControl fullWidth error={formik.touched.accountTypeId && Boolean(formik.errors.accountTypeId)}>
                    <InputLabel id="account-type-label">Account Type</InputLabel>
                    <Select
                      labelId="account-type-label"
                      id="accountTypeId"
                      name="accountTypeId"
                      value={formik.values.accountTypeId || ''}
                      label="Account Type"
                      onChange={formik.handleChange}
                    >
                      <MenuItem value={0} disabled>Select Account Type</MenuItem>
                      {accountTypes.map((type) => (
                        <MenuItem key={type.id} value={type.id}>
                          {type.name} ({type.normalBalance})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid sx={{ gridColumn: '7 / 13', gridRow: '3' }}>
                  <FormControl fullWidth error={formik.touched.accountCategoryId && Boolean(formik.errors.accountCategoryId)}>
                    <InputLabel id="account-category-label">Account Category</InputLabel>
                    <Select
                      labelId="account-category-label"
                      id="accountCategoryId"
                      name="accountCategoryId"
                      value={formik.values.accountCategoryId || ''}
                      label="Account Category"
                      onChange={formik.handleChange}
                      disabled={!formik.values.accountTypeId}
                    >
                      <MenuItem value={0} disabled>Select Account Category</MenuItem>
                      {filteredCategories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid sx={{ gridColumn: '1 / 7', gridRow: '4' }}>
                  <FormControl fullWidth>
                    <InputLabel id="parent-account-label">Parent Account (Optional)</InputLabel>
                    <Select
                      labelId="parent-account-label"
                      id="parentAccountId"
                      name="parentAccountId"
                      value={formik.values.parentAccountId || ''}
                      label="Parent Account (Optional)"
                      onChange={formik.handleChange}
                    >
                      <MenuItem value="">None</MenuItem>
                      {accounts.map((account) => (
                        <MenuItem 
                          key={account.id} 
                          value={account.id}
                          disabled={account.id === editingAccount?.id}
                        >
                          {account.code} - {account.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid sx={{ gridColumn: '7 / 10', gridRow: '4' }}>
                  <FormControl fullWidth>
                    <InputLabel id="is-active-label">Status</InputLabel>
                    <Select
                      labelId="is-active-label"
                      id="isActive"
                      name="isActive"
                      value={formik.values.isActive ? "true" : "false"}
                      label="Status"
                      onChange={(e) => {
                        formik.setFieldValue('isActive', e.target.value === "true");
                      }}
                    >
                      <MenuItem value="true">Active</MenuItem>
                      <MenuItem value="false">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid sx={{ gridColumn: '10 / 13', gridRow: '4' }}>
                  <FormControl fullWidth>
                    <InputLabel id="is-bank-account-label">Bank Account</InputLabel>
                    <Select
                      labelId="is-bank-account-label"
                      id="isBankAccount"
                      name="isBankAccount"
                      value={formik.values.isBankAccount ? "true" : "false"}
                      label="Bank Account"
                      onChange={(e) => {
                        formik.setFieldValue('isBankAccount', e.target.value === "true");
                      }}
                    >
                      <MenuItem value="true">Yes</MenuItem>
                      <MenuItem value="false">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingAccount ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
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

export default ChartOfAccounts;
