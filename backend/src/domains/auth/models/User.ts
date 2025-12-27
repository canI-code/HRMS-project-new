import { Schema, model, Types } from 'mongoose';
import { BaseDocument, UserRole } from '@/shared/types/common';
import bcrypt from 'bcryptjs';

/**
 * User interface (without methods for TypeScript compatibility)
 */
export interface IUser extends BaseDocument {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  employeeId?: Types.ObjectId; // Reference to Employee document
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  lastPasswordChange?: Date;
  passwordHistory: string[]; // Store last N password hashes
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaBackupCodes: string[];
  failedLoginAttempts: number;
  accountLockedUntil?: Date;
  preferences: {
    language: string;
    timezone: string;
    dateFormat: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
}

/**
 * User schema
 */
const userSchema = new Schema<IUser>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: function(email: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Invalid email format',
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Don't include password in queries by default
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.EMPLOYEE,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
    lastPasswordChange: {
      type: Date,
      default: Date.now,
    },
    passwordHistory: {
      type: [String],
      default: [],
      select: false,
      validate: {
        validator: function(history: string[]) {
          return history.length <= 5; // Keep last 5 passwords
        },
        message: 'Password history exceeds maximum length',
      },
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaSecret: {
      type: String,
      select: false,
    },
    mfaBackupCodes: {
      type: [String],
      default: [],
      select: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    accountLockedUntil: {
      type: Date,
    },
    preferences: {
      language: {
        type: String,
        default: 'en',
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      dateFormat: {
        type: String,
        default: 'YYYY-MM-DD',
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: false,
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
    collection: 'users',
  }
);

// Compound indexes
userSchema.index({ organizationId: 1, email: 1 }, { unique: true });
userSchema.index({ organizationId: 1, role: 1 });
userSchema.index({ organizationId: 1, isActive: 1 });
userSchema.index({ organizationId: 1, isDeleted: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    
    // Add current password to history if it's being changed
    if (this.isModified('password') && !this.isNew) {
      if (!this.passwordHistory) {
        this.passwordHistory = [];
      }
      this.passwordHistory.unshift(this.password);
      // Keep only last 5 passwords
      this.passwordHistory = this.passwordHistory.slice(0, 5);
    }
    
    this.password = hashedPassword;
    this.lastPasswordChange = new Date();
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Note: Password comparison and user management methods (comparePassword, updatePassword, 
// incrementFailedLogins, resetFailedLogins, isAccountLocked) should be implemented 
// in the service layer to avoid TypeScript strict mode issues with Mongoose methods.

// Export the model
export const User = model<IUser>('User', userSchema);
