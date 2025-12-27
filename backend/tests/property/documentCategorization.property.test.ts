import fc from 'fast-check';
import { normalizeCategory, isRoleAllowedForDocument } from '../../src/domains/documents/services/DocumentService';
import { UserRole } from '../../src/shared/types/common';

describe('Document Categorization and Access Control', () => {
  test('Property 31: categories normalize to trimmed lowercase strings', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (rawCategory) => {
        const normalized = normalizeCategory(rawCategory);
        const expected = rawCategory.trim().length > 0 ? rawCategory.trim().toLowerCase() : 'uncategorized';
        expect(normalized.trim()).toBe(normalized);
        expect(normalized).toBe(expected);
        expect(normalized.length).toBeGreaterThan(0);
      }),
      { numRuns: 50 }
    );
  });

  test('Access policy allows only declared roles unless super admin', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(UserRole.HR_ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE),
        fc.constantFrom(UserRole.HR_ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE),
        (allowedRole, testedRole) => {
          const policy = { allowedRoles: [allowedRole] };
          const isAllowed = isRoleAllowedForDocument(policy, testedRole);
          if (testedRole === allowedRole) {
            expect(isAllowed).toBe(true);
          } else {
            expect(isAllowed).toBe(false);
          }
          // Super admin always passes
          expect(isRoleAllowedForDocument(policy, UserRole.SUPER_ADMIN)).toBe(true);
        }
      ),
      { numRuns: 40 }
    );
  });
});
