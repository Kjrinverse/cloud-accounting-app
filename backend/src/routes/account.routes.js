// Account routes
const express = require('express');
const router = express.Router({ mergeParams: true }); // To access orgId from parent router
const db = require('../db');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const Joi = require('joi');

// Apply authentication middleware to all routes
router.use(authenticate);

// Validation schemas
const createAccountSchema = Joi.object({
  code: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
  accountTypeId: Joi.number().integer().required(),
  accountCategoryId: Joi.number().integer().required(),
  parentAccountId: Joi.number().integer().allow(null),
  isActive: Joi.boolean().default(true),
  isBankAccount: Joi.boolean().default(false),
  bankAccountDetails: Joi.object().allow(null)
});

const updateAccountSchema = Joi.object({
  code: Joi.string(),
  name: Joi.string(),
  description: Joi.string().allow('', null),
  accountTypeId: Joi.number().integer(),
  accountCategoryId: Joi.number().integer(),
  parentAccountId: Joi.number().integer().allow(null),
  isActive: Joi.boolean(),
  isBankAccount: Joi.boolean(),
  bankAccountDetails: Joi.object().allow(null)
});

// Middleware to check organization access
const checkOrgAccess = async (req, res, next) => {
  try {
    const orgId = req.params.orgId;
    
    // Check if user has access to this organization
    const hasAccess = req.user.organizations.some(org => org.id === parseInt(orgId));
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this organization'
        }
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

router.use(checkOrgAccess);

// Get all accounts for an organization
router.get('/', async (req, res, next) => {
  try {
    const orgId = req.params.orgId;
    const { 
      type, category, active, search, 
      page = 1, limit = 20 
    } = req.query;
    
    // Build query
    let query = db('accounts')
      .join('account_types', 'accounts.account_type_id', 'account_types.id')
      .leftJoin('account_categories', 'accounts.account_category_id', 'account_categories.id')
      .where('accounts.organization_id', orgId)
      .select(
        'accounts.id',
        'accounts.code',
        'accounts.name',
        'accounts.description',
        'accounts.parent_account_id as parentAccountId',
        'accounts.is_active as isActive',
        'accounts.is_bank_account as isBankAccount',
        'account_types.id as accountTypeId',
        'account_types.name as accountTypeName',
        'account_types.normal_balance as normalBalance',
        'account_categories.id as accountCategoryId',
        'account_categories.name as accountCategoryName'
      );
    
    // Apply filters
    if (type) {
      query = query.where('account_types.id', type);
    }
    
    if (category) {
      query = query.where('account_categories.id', category);
    }
    
    if (active !== undefined) {
      query = query.where('accounts.is_active', active === 'true');
    }
    
    if (search) {
      query = query.where(function() {
        this.where('accounts.code', 'like', `%${search}%`)
            .orWhere('accounts.name', 'like', `%${search}%`);
      });
    }
    
    // Count total results
    const [{ count }] = await db('accounts')
      .where('organization_id', orgId)
      .count('id as count');
    
    // Pagination
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset);
    
    // Execute query
    const accounts = await query;
    
    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    
    res.json({
      success: true,
      data: {
        accounts,
        pagination: {
          total: parseInt(count),
          page: parseInt(page),
          limit: parseInt(limit),
          pages: totalPages
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create a new account
router.post('/', validate(createAccountSchema), async (req, res, next) => {
  try {
    const orgId = req.params.orgId;
    const { 
      code, name, description, accountTypeId, accountCategoryId,
      parentAccountId, isActive, isBankAccount, bankAccountDetails 
    } = req.body;
    
    // Check if account code already exists in this organization
    const existingAccount = await db('accounts')
      .where({ 
        organization_id: orgId,
        code
      })
      .first();
    
    if (existingAccount) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ACCOUNT_CODE_EXISTS',
          message: 'An account with this code already exists in this organization'
        }
      });
    }
    
    // Check if account type exists
    const accountType = await db('account_types')
      .where({ id: accountTypeId })
      .first();
    
    if (!accountType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ACCOUNT_TYPE',
          message: 'The specified account type does not exist'
        }
      });
    }
    
    // Check if account category exists and belongs to this organization
    const accountCategory = await db('account_categories')
      .where({ 
        id: accountCategoryId,
        organization_id: orgId
      })
      .first();
    
    if (!accountCategory) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ACCOUNT_CATEGORY',
          message: 'The specified account category does not exist or does not belong to this organization'
        }
      });
    }
    
    // If parent account is specified, check if it exists and belongs to this organization
    if (parentAccountId) {
      const parentAccount = await db('accounts')
        .where({ 
          id: parentAccountId,
          organization_id: orgId
        })
        .first();
      
      if (!parentAccount) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARENT_ACCOUNT',
            message: 'The specified parent account does not exist or does not belong to this organization'
          }
        });
      }
    }
    
    // Create account
    const [accountId] = await db('accounts').insert({
      code,
      name,
      description,
      account_type_id: accountTypeId,
      account_category_id: accountCategoryId,
      organization_id: orgId,
      parent_account_id: parentAccountId || null,
      is_active: isActive !== undefined ? isActive : true,
      is_bank_account: isBankAccount !== undefined ? isBankAccount : false,
      bank_account_details: bankAccountDetails ? JSON.stringify(bankAccountDetails) : null,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('id');
    
    // Get created account
    const account = await db('accounts')
      .join('account_types', 'accounts.account_type_id', 'account_types.id')
      .leftJoin('account_categories', 'accounts.account_category_id', 'account_categories.id')
      .where('accounts.id', accountId)
      .select(
        'accounts.id',
        'accounts.code',
        'accounts.name',
        'accounts.description',
        'accounts.parent_account_id as parentAccountId',
        'accounts.is_active as isActive',
        'accounts.is_bank_account as isBankAccount',
        'accounts.bank_account_details as bankAccountDetails',
        'account_types.id as accountTypeId',
        'account_types.name as accountTypeName',
        'account_types.normal_balance as normalBalance',
        'account_categories.id as accountCategoryId',
        'account_categories.name as accountCategoryName',
        'accounts.created_at as createdAt'
      )
      .first();
    
    // Parse bank account details if present
    if (account.bankAccountDetails) {
      account.bankAccountDetails = JSON.parse(account.bankAccountDetails);
    }
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: account
    });
  } catch (error) {
    next(error);
  }
});

// Get account by ID
router.get('/:id', async (req, res, next) => {
  try {
    const orgId = req.params.orgId;
    const accountId = req.params.id;
    
    // Get account
    const account = await db('accounts')
      .join('account_types', 'accounts.account_type_id', 'account_types.id')
      .leftJoin('account_categories', 'accounts.account_category_id', 'account_categories.id')
      .where({
        'accounts.id': accountId,
        'accounts.organization_id': orgId
      })
      .select(
        'accounts.id',
        'accounts.code',
        'accounts.name',
        'accounts.description',
        'accounts.parent_account_id as parentAccountId',
        'accounts.is_active as isActive',
        'accounts.is_bank_account as isBankAccount',
        'accounts.bank_account_details as bankAccountDetails',
        'account_types.id as accountTypeId',
        'account_types.name as accountTypeName',
        'account_types.normal_balance as normalBalance',
        'account_categories.id as accountCategoryId',
        'account_categories.name as accountCategoryName',
        'accounts.created_at as createdAt',
        'accounts.updated_at as updatedAt'
      )
      .first();
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Account not found'
        }
      });
    }
    
    // Parse bank account details if present
    if (account.bankAccountDetails) {
      account.bankAccountDetails = JSON.parse(account.bankAccountDetails);
    }
    
    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
});

// Update account
router.put('/:id', validate(updateAccountSchema), async (req, res, next) => {
  try {
    const orgId = req.params.orgId;
    const accountId = req.params.id;
    const { 
      code, name, description, accountTypeId, accountCategoryId,
      parentAccountId, isActive, isBankAccount, bankAccountDetails 
    } = req.body;
    
    // Check if account exists and belongs to this organization
    const existingAccount = await db('accounts')
      .where({ 
        id: accountId,
        organization_id: orgId
      })
      .first();
    
    if (!existingAccount) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Account not found'
        }
      });
    }
    
    // If code is being changed, check if new code already exists
    if (code && code !== existingAccount.code) {
      const duplicateCode = await db('accounts')
        .where({ 
          organization_id: orgId,
          code
        })
        .whereNot({ id: accountId })
        .first();
      
      if (duplicateCode) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'ACCOUNT_CODE_EXISTS',
            message: 'An account with this code already exists in this organization'
          }
        });
      }
    }
    
    // If account type is being changed, check if new type exists
    if (accountTypeId) {
      const accountType = await db('account_types')
        .where({ id: accountTypeId })
        .first();
      
      if (!accountType) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ACCOUNT_TYPE',
            message: 'The specified account type does not exist'
          }
        });
      }
    }
    
    // If account category is being changed, check if new category exists and belongs to this organization
    if (accountCategoryId) {
      const accountCategory = await db('account_categories')
        .where({ 
          id: accountCategoryId,
          organization_id: orgId
        })
        .first();
      
      if (!accountCategory) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ACCOUNT_CATEGORY',
            message: 'The specified account category does not exist or does not belong to this organization'
          }
        });
      }
    }
    
    // If parent account is being changed, check if new parent exists and belongs to this organization
    if (parentAccountId !== undefined) {
      if (parentAccountId === accountId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARENT_ACCOUNT',
            message: 'An account cannot be its own parent'
          }
        });
      }
      
      if (parentAccountId !== null) {
        const parentAccount = await db('accounts')
          .where({ 
            id: parentAccountId,
            organization_id: orgId
          })
          .first();
        
        if (!parentAccount) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_PARENT_ACCOUNT',
              message: 'The specified parent account does not exist or does not belong to this organization'
            }
          });
        }
      }
    }
    
    // Prepare update data
    const updateData = {};
    
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (accountTypeId !== undefined) updateData.account_type_id = accountTypeId;
    if (accountCategoryId !== undefined) updateData.account_category_id = accountCategoryId;
    if (parentAccountId !== undefined) updateData.parent_account_id = parentAccountId;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (isBankAccount !== undefined) updateData.is_bank_account = isBankAccount;
    if (bankAccountDetails !== undefined) {
      updateData.bank_account_details = bankAccountDetails ? JSON.stringify(bankAccountDetails) : null;
    }
    
    updateData.updated_at = new Date();
    
    // Update account
    await db('accounts')
      .where({ id: accountId })
      .update(updateData);
    
    // Get updated account
    const account = await db('accounts')
      .join('account_types', 'accounts.account_type_id', 'account_types.id')
      .leftJoin('account_categories', 'accounts.account_category_id', 'account_categories.id')
      .where('accounts.id', accountId)
      .select(
        'accounts.id',
        'accounts.code',
        'accounts.name',
        'accounts.description',
        'accounts.parent_account_id as parentAccountId',
        'accounts.is_active as isActive',
        'accounts.is_bank_account as isBankAccount',
        'accounts.bank_account_details as bankAccountDetails',
        'account_types.id as accountTypeId',
        'account_types.name as accountTypeName',
        'account_types.normal_balance as normalBalance',
        'account_categories.id as accountCategoryId',
        'account_categories.name as accountCategoryName',
        'accounts.updated_at as updatedAt'
      )
      .first();
    
    // Parse bank account details if present
    if (account.bankAccountDetails) {
      account.bankAccountDetails = JSON.parse(account.bankAccountDetails);
    }
    
    res.json({
      success: true,
      message: 'Account updated successfully',
      data: account
    });
  } catch (error) {
    next(error);
  }
});

// Get account types
router.get('/types', async (req, res, next) => {
  try {
    const accountTypes = await db('account_types')
      .select('id', 'name', 'normal_balance as normalBalance', 'description');
    
    res.json({
      success: true,
      data: accountTypes
    });
  } catch (error) {
    next(error);
  }
});

// Get account categories for an organization
router.get('/categories', async (req, res, next) => {
  try {
    const orgId = req.params.orgId;
    
    const accountCategories = await db('account_categories')
      .join('account_types', 'account_categories.account_type_id', 'account_types.id')
      .where('account_categories.organization_id', orgId)
      .select(
        'account_categories.id',
        'account_categories.name',
        'account_categories.description',
        'account_categories.account_type_id as accountTypeId',
        'account_types.name as accountTypeName'
      );
    
    res.json({
      success: true,
      data: accountCategories
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
