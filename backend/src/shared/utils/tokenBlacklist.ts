import { logger } from './logger';

/**
 * Token blacklist service for managing revoked tokens
 * In production, this should use Redis or a database
 */
export class TokenBlacklistService {
  private static blacklistedTokens = new Set<string>();
  private static tokenExpiry = new Map<string, number>();

  /**
   * Add token to blacklist
   */
  static blacklistToken(token: string, expiryTime?: number): void {
    this.blacklistedTokens.add(token);
    
    if (expiryTime) {
      this.tokenExpiry.set(token, expiryTime);
      
      // Schedule cleanup after token expires
      const timeUntilExpiry = expiryTime - Date.now();
      if (timeUntilExpiry > 0) {
        setTimeout(() => {
          this.removeExpiredToken(token);
        }, timeUntilExpiry);
      }
    }

    logger.info('Token blacklisted', { 
      tokenHash: this.hashToken(token),
      expiryTime: expiryTime ? new Date(expiryTime).toISOString() : 'none'
    });
  }

  /**
   * Check if token is blacklisted
   */
  static isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  /**
   * Remove expired token from blacklist
   */
  private static removeExpiredToken(token: string): void {
    this.blacklistedTokens.delete(token);
    this.tokenExpiry.delete(token);
    
    logger.debug('Expired token removed from blacklist', {
      tokenHash: this.hashToken(token)
    });
  }

  /**
   * Clean up expired tokens (should be called periodically)
   */
  static cleanupExpiredTokens(): void {
    const now = Date.now();
    const expiredTokens: string[] = [];

    for (const [token, expiry] of this.tokenExpiry.entries()) {
      if (expiry <= now) {
        expiredTokens.push(token);
      }
    }

    expiredTokens.forEach(token => {
      this.removeExpiredToken(token);
    });

    if (expiredTokens.length > 0) {
      logger.info('Cleaned up expired tokens', { count: expiredTokens.length });
    }
  }

  /**
   * Get blacklist statistics
   */
  static getStats(): { totalBlacklisted: number; withExpiry: number } {
    return {
      totalBlacklisted: this.blacklistedTokens.size,
      withExpiry: this.tokenExpiry.size,
    };
  }

  /**
   * Hash token for logging (security)
   */
  private static hashToken(token: string): string {
    // Simple hash for logging - in production use crypto.createHash
    return token.substring(0, 8) + '...' + token.substring(token.length - 8);
  }

  /**
   * Clear all blacklisted tokens (for testing)
   */
  static clearAll(): void {
    this.blacklistedTokens.clear();
    this.tokenExpiry.clear();
    logger.info('Token blacklist cleared');
  }
}