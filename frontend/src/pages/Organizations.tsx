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
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Organization } from '../types';

const Organizations: React.FC = () => {
  const { state } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    baseCurrency: 'USD'
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await apiService.organizations.getAll();
      if (response.success && response.data) {
        setOrganizations(response.data);
      } else {
        setError(response.error?.message || 'Failed to load organizations');
      }
    } catch (err) {
      setError('Failed to load organizations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (org: Organization | null = null) => {
    if (org) {
      setEditingOrg(org);
      setFormData({
        name: org.name,
        taxId: org.taxId || '',
        baseCurrency: org.baseCurrency || 'USD'
      });
    } else {
      setEditingOrg(null);
      setFormData({
        name: '',
        taxId: '',
        baseCurrency: 'USD'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (editingOrg) {
        // Update existing organization
        const response = await apiService.organizations.update(editingOrg.id, formData);
        if (response.success) {
          setOrganizations(prev => 
            prev.map(org => org.id === editingOrg.id ? { ...org, ...formData } : org)
          );
        } else {
          setError(response.error?.message || 'Failed to update organization');
        }
      } else {
        // Create new organization
        const response = await apiService.organizations.create(formData);
        if (response.success && response.data) {
          setOrganizations(prev => [...prev, response.data as Organization]);
        } else {
          setError(response.error?.message || 'Failed to create organization');
        }
      }
      handleCloseDialog();
    } catch (err) {
      setError('An error occurred while saving the organization');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      try {
        const response = await apiService.organizations.delete(id);
        if (response.success) {
          setOrganizations(prev => prev.filter(org => org.id !== id));
        } else {
          setError(response.error?.message || 'Failed to delete organization');
        }
      } catch (err) {
        setError('Failed to delete organization');
        console.error(err);
      }
    }
  };

  if (loading && organizations.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Organizations</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Organization
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {organizations.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No organizations found. Create your first organization to get started.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Tax ID</TableCell>
                <TableCell>Base Currency</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>{org.name}</TableCell>
                  <TableCell>{org.taxId || '-'}</TableCell>
                  <TableCell>{org.baseCurrency || 'USD'}</TableCell>
                  <TableCell>{org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog(org)}
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      color="error" 
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(org.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingOrg ? 'Edit Organization' : 'Create New Organization'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Organization Name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="taxId"
                label="Tax ID (Optional)"
                value={formData.taxId}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="currency-label">Base Currency</InputLabel>
                <Select
                  labelId="currency-label"
                  name="baseCurrency"
                  value={formData.baseCurrency}
                  label="Base Currency"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="USD">USD - US Dollar</MenuItem>
                  <MenuItem value="EUR">EUR - Euro</MenuItem>
                  <MenuItem value="GBP">GBP - British Pound</MenuItem>
                  <MenuItem value="CAD">CAD - Canadian Dollar</MenuItem>
                  <MenuItem value="AUD">AUD - Australian Dollar</MenuItem>
                  <MenuItem value="JPY">JPY - Japanese Yen</MenuItem>
                  <MenuItem value="CNY">CNY - Chinese Yuan</MenuItem>
                  <MenuItem value="INR">INR - Indian Rupee</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name || !formData.baseCurrency}
          >
            {editingOrg ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Organizations;
