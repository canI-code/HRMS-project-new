import { Schema, model } from 'mongoose';
import { BaseDocument } from '@/shared/types/common';

/**
 * Organization interface
 */
export interface IOrganization extends BaseDocument {
  name: string;
  displayName: string;
  domain: string; // Unique organization domain (e.g., acme-corp)
  industry?: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  country: string;
  timezone: string;
  currency: string;
  fiscalYearStart: number; // Month (1-12)
  
  // Contact information
  contactInfo: {
    email: string;
    phone?: string;
    website?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  
  // Subscription and billing
  subscription: {
    plan: 'trial' | 'basic' | 'professional' | 'enterprise';
    status: 'active' | 'suspended' | 'cancelled' | 'expired';
    startDate: Date;
    endDate?: Date;
    maxEmployees: number;
    maxUsers: number;
  };
  
  // Organization settings
  settings: {
    workWeek: {
      monday: boolean;
      tuesday: boolean;
      wednesday: boolean;
      thursday: boolean;
      friday: boolean;
      saturday: boolean;
      sunday: boolean;
    };
    workingHours: {
      start: string; // e.g., "09:00"
      end: string;   // e.g., "17:00"
    };
    leavePolicies: {
      allowNegativeBalance: boolean;
      requireManagerApproval: boolean;
      autoApprovalThreshold: number; // days
      carryForwardLimit: number; // days
    };
    attendancePolicies: {
      lateArrivalGracePeriod: number; // minutes
      earlyDepartureGracePeriod: number; // minutes
      overtimeEnabled: boolean;
      overtimeMultiplier: number; // e.g., 1.5 for 1.5x pay
    };
    payrollSettings: {
      payrollCycle: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
      payrollDay: number; // day of week (1-7) or day of month (1-31)
      taxCalculationEnabled: boolean;
    };
    securitySettings: {
      passwordMinLength: number;
      passwordRequireUppercase: boolean;
      passwordRequireLowercase: boolean;
      passwordRequireNumbers: boolean;
      passwordRequireSpecialChars: boolean;
      passwordExpiryDays: number;
      mfaRequired: boolean;
      sessionTimeoutMinutes: number;
      ipWhitelist: string[];
    };
  };
  
  // Status and metadata
  isActive: boolean;
  activatedAt?: Date;
  deactivatedAt?: Date;
  deactivatedReason?: string;
  
  // Branding
  branding?: {
    logo?: string; // URL or file path
    primaryColor?: string;
    secondaryColor?: string;
  };
}

/**
 * Organization schema
 */
const organizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    domain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: function(domain: string) {
          return /^[a-z0-9-]+$/.test(domain);
        },
        message: 'Domain must contain only lowercase letters, numbers, and hyphens',
      },
    },
    industry: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    size: {
      type: String,
      enum: ['small', 'medium', 'large', 'enterprise'],
      required: true,
      default: 'small',
    },
    country: {
      type: String,
      required: true,
      uppercase: true,
      length: 2, // ISO 3166-1 alpha-2 country code
    },
    timezone: {
      type: String,
      required: true,
      default: 'UTC',
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      length: 3, // ISO 4217 currency code
      default: 'USD',
    },
    fiscalYearStart: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      default: 1,
    },
    
    // Contact information
    contactInfo: {
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        validate: {
          validator: function(email: string) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
          },
          message: 'Invalid email format',
        },
      },
      phone: {
        type: String,
        trim: true,
      },
      website: {
        type: String,
        trim: true,
      },
      address: {
        street: {
          type: String,
          trim: true,
        },
        city: {
          type: String,
          trim: true,
        },
        state: {
          type: String,
          trim: true,
        },
        postalCode: {
          type: String,
          trim: true,
        },
        country: {
          type: String,
          trim: true,
        },
      },
    },
    
    // Subscription and billing
    subscription: {
      plan: {
        type: String,
        enum: ['trial', 'basic', 'professional', 'enterprise'],
        required: true,
        default: 'trial',
      },
      status: {
        type: String,
        enum: ['active', 'suspended', 'cancelled', 'expired'],
        required: true,
        default: 'active',
        index: true,
      },
      startDate: {
        type: Date,
        required: true,
        default: Date.now,
      },
      endDate: {
        type: Date,
      },
      maxEmployees: {
        type: Number,
        required: true,
        default: 50,
        min: 1,
      },
      maxUsers: {
        type: Number,
        required: true,
        default: 10,
        min: 1,
      },
    },
    
    // Organization settings
    settings: {
      workWeek: {
        monday: { type: Boolean, default: true },
        tuesday: { type: Boolean, default: true },
        wednesday: { type: Boolean, default: true },
        thursday: { type: Boolean, default: true },
        friday: { type: Boolean, default: true },
        saturday: { type: Boolean, default: false },
        sunday: { type: Boolean, default: false },
      },
      workingHours: {
        start: {
          type: String,
          default: '09:00',
          validate: {
            validator: function(time: string) {
              return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
            },
            message: 'Invalid time format (HH:MM)',
          },
        },
        end: {
          type: String,
          default: '17:00',
          validate: {
            validator: function(time: string) {
              return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
            },
            message: 'Invalid time format (HH:MM)',
          },
        },
      },
      leavePolicies: {
        allowNegativeBalance: {
          type: Boolean,
          default: false,
        },
        requireManagerApproval: {
          type: Boolean,
          default: true,
        },
        autoApprovalThreshold: {
          type: Number,
          default: 0,
          min: 0,
        },
        carryForwardLimit: {
          type: Number,
          default: 5,
          min: 0,
        },
      },
      attendancePolicies: {
        lateArrivalGracePeriod: {
          type: Number,
          default: 15,
          min: 0,
        },
        earlyDepartureGracePeriod: {
          type: Number,
          default: 15,
          min: 0,
        },
        overtimeEnabled: {
          type: Boolean,
          default: true,
        },
        overtimeMultiplier: {
          type: Number,
          default: 1.5,
          min: 1,
        },
      },
      payrollSettings: {
        payrollCycle: {
          type: String,
          enum: ['weekly', 'biweekly', 'semimonthly', 'monthly'],
          default: 'monthly',
        },
        payrollDay: {
          type: Number,
          default: 1,
          min: 1,
          max: 31,
        },
        taxCalculationEnabled: {
          type: Boolean,
          default: true,
        },
      },
      securitySettings: {
        passwordMinLength: {
          type: Number,
          default: 8,
          min: 8,
          max: 128,
        },
        passwordRequireUppercase: {
          type: Boolean,
          default: true,
        },
        passwordRequireLowercase: {
          type: Boolean,
          default: true,
        },
        passwordRequireNumbers: {
          type: Boolean,
          default: true,
        },
        passwordRequireSpecialChars: {
          type: Boolean,
          default: true,
        },
        passwordExpiryDays: {
          type: Number,
          default: 90,
          min: 0,
        },
        mfaRequired: {
          type: Boolean,
          default: false,
        },
        sessionTimeoutMinutes: {
          type: Number,
          default: 60,
          min: 5,
          max: 1440,
        },
        ipWhitelist: {
          type: [String],
          default: [],
        },
      },
    },
    
    // Status and metadata
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    activatedAt: {
      type: Date,
    },
    deactivatedAt: {
      type: Date,
    },
    deactivatedReason: {
      type: String,
      maxlength: 500,
    },
    
    // Branding
    branding: {
      logo: {
        type: String,
      },
      primaryColor: {
        type: String,
        validate: {
          validator: function(color: string) {
            return /^#[0-9A-F]{6}$/i.test(color);
          },
          message: 'Invalid hex color format',
        },
      },
      secondaryColor: {
        type: String,
        validate: {
          validator: function(color: string) {
            return /^#[0-9A-F]{6}$/i.test(color);
          },
          message: 'Invalid hex color format',
        },
      },
    },
    
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    collection: 'organizations',
  }
);

// Indexes
organizationSchema.index({ name: 1 });
organizationSchema.index({ isActive: 1, isDeleted: 1 });
organizationSchema.index({ 'subscription.status': 1 });

// Virtual for full name
organizationSchema.virtual('fullDisplayName').get(function() {
  return `${this.displayName} (${this.domain})`;
});

// Note: Instance methods isWithinLimits and hasActiveSubscription can be implemented in service layer

// Export the model
export const Organization = model<IOrganization>('Organization', organizationSchema);
