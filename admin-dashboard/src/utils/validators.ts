import { z } from 'zod';

// Login Schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Product Schema
export const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU too long'),
  barcode: z
    .string()
    .regex(/^\d{10,13}$/, 'Barcode must be 10-13 digits')
    .optional()
    .or(z.literal('')),
  price: z.number().positive('Price must be positive'),
  cost: z.number().nonnegative('Cost cannot be negative').optional(),
  category_id: z.number().positive('Category is required'),
  description: z.string().max(1000, 'Description too long').optional(),
  image_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  initial_stock: z.number().nonnegative('Stock cannot be negative').optional(),
  low_stock_threshold: z.number().nonnegative('Threshold cannot be negative'),
  is_active: z.boolean(),
});

export type ProductFormData = z.infer<typeof productSchema>;

// Discount Schema
export const discountSchema = z.object({
  code: z
    .string()
    .min(6, 'Code must be at least 6 characters')
    .max(12, 'Code too long')
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase letters, numbers, and hyphens only'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().positive('Value must be positive'),
  min_purchase: z.number().nonnegative('Cannot be negative').optional(),
  max_uses: z.number().positive('Must be positive').optional(),
  valid_from: z.string().min(1, 'Start date is required'),
  valid_until: z.string().min(1, 'End date is required'),
  is_active: z.boolean(),
});

export type DiscountFormData = z.infer<typeof discountSchema>;

// User Schema
export const userSchema = z
  .object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .regex(/^[a-z0-9_]+$/, 'Username must be lowercase letters, numbers, and underscores'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[a-z]/, 'Password must contain lowercase letter')
      .regex(/[0-9]/, 'Password must contain number')
      .optional(),
    confirmPassword: z.string().optional(),
    role: z.enum(['cashier', 'stock_staff', 'manager', 'admin']),
    is_active: z.boolean(),
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type UserFormData = z.infer<typeof userSchema>;

// Customer Update Schema
export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

// Inventory Adjustment Schema
export const inventoryAdjustSchema = z.object({
  product_id: z.number().positive('Product is required'),
  quantity: z.number().int('Must be whole number').positive('Quantity must be positive'),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().max(500, 'Notes too long').optional(),
});

export type InventoryAdjustFormData = z.infer<typeof inventoryAdjustSchema>;
