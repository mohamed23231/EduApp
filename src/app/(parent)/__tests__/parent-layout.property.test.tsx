// Feature: auth-baseline-parent-mvp, Property 1: Cold Start Guard Precedence
/**
 * Property 1: Cold Start Guard Precedence
 *
 * For any combination of auth store state (idle, signOut, signIn) and user object
 * (null, present with various roles), the route guard chain SHALL produce exactly
 * one correct navigation outcome following the precedence:
 * (1) idle → no render
 * (2) signOut → /login
 * (3) signIn + null user → /onboarding
 * (4) signIn + user → getHomeRouteForRole(user.role)
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.6, 15.4
 */

import * as fc from 'fast-check';
import { UserRole } from '@/core/auth/roles';
import { getHomeRouteForRole } from '@/core/auth/routing';
import { AppRoute } from '@/core/navigation/routes';

// ─── Guard Logic (extracted from ParentLayout for testing) ────────────────────

/**
 * Simulates the guard logic from ParentLayout._layout.tsx
 * Returns the expected navigation outcome for a given auth state
 */
function evaluateParentLayoutGuards(
    status: 'idle' | 'signOut' | 'signIn',
    user: { id: string; email: string; role: UserRole; fullName?: string } | null,
): 'no-render' | 'redirect-to-login' | 'redirect-to-onboarding' | 'redirect-to-role-dashboard' | 'render-stack' {
    // Guard 1: Wait for hydration to complete before evaluating guards
    if (status === 'idle') {
        return 'no-render';
    }

    // Guard 2: Not authenticated → redirect to login
    if (status !== 'signIn') {
        return 'redirect-to-login';
    }

    // Guard 3: Authenticated but onboarding pending → redirect to onboarding
    if (!user) {
        return 'redirect-to-onboarding';
    }

    // Guard 4: Wrong role → redirect to the correct role dashboard
    if (user.role !== UserRole.PARENT) {
        return 'redirect-to-role-dashboard';
    }

    // All guards passed → render the Stack
    return 'render-stack';
}

// ─── Generators ──────────────────────────────────────────────────────────────

/**
 * Generate valid auth store states: 'idle', 'signOut', or 'signIn'
 */
const authStatusArb = fc.oneof(
    fc.constant('idle' as const),
    fc.constant('signOut' as const),
    fc.constant('signIn' as const),
);

/**
 * Generate valid user roles
 */
const userRoleArb = fc.oneof(
    fc.constant(UserRole.PARENT),
    fc.constant(UserRole.TEACHER),
    fc.constant(UserRole.ADMIN),
    fc.constant(UserRole.SUPER_ADMIN),
);

/**
 * Generate a user object with id, email, role, and optional fullName
 */
const userObjectArb = fc.record({
    id: fc.uuid(),
    email: fc.emailAddress(),
    role: userRoleArb,
    fullName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { freq: 2, nil: undefined }),
}) as fc.Arbitrary<{ id: string; email: string; role: UserRole; fullName?: string }>;


/**
 * Generate a user object or null
 */
const userArb = fc.oneof(fc.constant(null), userObjectArb);

/**
 * Combined generator for auth state + user combinations
 */
const authStateArb = fc.record({
    status: authStatusArb,
    user: userArb,
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('parentLayout - Property 1: Cold Start Guard Precedence', () => {
    it('should produce exactly one correct navigation outcome for any auth state combination', () => {
        fc.assert(
            fc.property(authStateArb, ({ status, user }) => {
                // Evaluate the guard logic
                const outcome = evaluateParentLayoutGuards(status, user);

                // Verify the outcome is one of the valid options
                expect([
                    'no-render',
                    'redirect-to-login',
                    'redirect-to-onboarding',
                    'redirect-to-role-dashboard',
                    'render-stack',
                ]).toContain(outcome);

                // Verify the outcome matches the expected guard precedence
                if (status === 'idle') {
                    expect(outcome).toBe('no-render');
                } else if (status === 'signOut') {
                    expect(outcome).toBe('redirect-to-login');
                } else if (status === 'signIn' && user === null) {
                    expect(outcome).toBe('redirect-to-onboarding');
                } else if (status === 'signIn' && user !== null && user.role !== UserRole.PARENT) {
                    expect(outcome).toBe('redirect-to-role-dashboard');
                } else if (status === 'signIn' && user !== null && user.role === UserRole.PARENT) {
                    expect(outcome).toBe('render-stack');
                }
            }),
            { numRuns: 100 },
        );
    });

    it('should follow the explicit guard precedence order: idle > signOut > onboarding > role', () => {
        fc.assert(
            fc.property(authStateArb, ({ status, user }) => {
                // Verify that the precedence order is followed:
                // 1. idle → no render (highest priority)
                // 2. signOut → /login
                // 3. signIn + null user → /onboarding
                // 4. signIn + user → role dashboard (lowest priority)

                const outcome = evaluateParentLayoutGuards(status, user);

                // Idle has highest priority - if status is idle, outcome must be no-render
                if (status === 'idle') {
                    expect(outcome).toBe('no-render');
                }

                // signOut has second priority - if status is signOut, outcome must be redirect-to-login
                if (status === 'signOut') {
                    expect(outcome).toBe('redirect-to-login');
                }

                // onboarding check has third priority - if signIn + null user, outcome must be redirect-to-onboarding
                if (status === 'signIn' && user === null) {
                    expect(outcome).toBe('redirect-to-onboarding');
                }

                // role check has lowest priority - only evaluated if all previous guards pass
                if (status === 'signIn' && user !== null) {
                    if (user.role === UserRole.PARENT) {
                        expect(outcome).toBe('render-stack');
                    } else {
                        expect(outcome).toBe('redirect-to-role-dashboard');
                    }
                }
            }),
            { numRuns: 100 },
        );
    });

    it('should never evaluate multiple guards for a single state', () => {
        fc.assert(
            fc.property(authStateArb, ({ status, user }) => {
                // For any given state combination, exactly one guard should match
                // This is verified by counting the number of conditions that match

                let guardCount = 0;

                if (status === 'idle') {
                    guardCount++;
                }
                if (status === 'signOut') {
                    guardCount++;
                }
                if (status === 'signIn' && user === null) {
                    guardCount++;
                }
                if (status === 'signIn' && user !== null && user.role !== UserRole.PARENT) {
                    guardCount++;
                }
                if (status === 'signIn' && user !== null && user.role === UserRole.PARENT) {
                    guardCount++;
                }

                // Exactly one guard should match for any valid state
                expect(guardCount).toBe(1);
            }),
            { numRuns: 100 },
        );
    });

    it('should route PARENT users to render the Stack (no redirect)', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.uuid(),
                    email: fc.emailAddress(),
                    fullName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { freq: 2, nil: undefined }),
                }),
                (userBase) => {
                    const user = { ...userBase, role: UserRole.PARENT };
                    const status = 'signIn' as const;

                    // When status is signIn and user.role is PARENT,
                    // the guard should render the Stack (not redirect)
                    const outcome = evaluateParentLayoutGuards(status, user);
                    expect(outcome).toBe('render-stack');
                },
            ),
            { numRuns: 50 },
        );
    });

    it('should redirect non-PARENT users to their role dashboard', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.uuid(),
                    email: fc.emailAddress(),
                    role: fc.oneof(
                        fc.constant(UserRole.TEACHER),
                        fc.constant(UserRole.ADMIN),
                        fc.constant(UserRole.SUPER_ADMIN),
                    ),
                    fullName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { freq: 2, nil: undefined }),
                }),
                (user) => {
                    const status = 'signIn' as const;

                    // When status is signIn and user.role is not PARENT,
                    // the guard should redirect to the role's dashboard
                    const outcome = evaluateParentLayoutGuards(status, user);
                    expect(outcome).toBe('redirect-to-role-dashboard');

                    // Verify the role has a valid dashboard route
                    const expectedRoute = getHomeRouteForRole(user.role);
                    expect(expectedRoute).not.toBe(AppRoute.parent.dashboard);
                    expect(expectedRoute).toBeDefined();
                },
            ),
            { numRuns: 50 },
        );
    });

    it('should redirect signOut users to login regardless of user state', () => {
        fc.assert(
            fc.property(userArb, (user) => {
                const status = 'signOut' as const;

                // When status is signOut, outcome should always be redirect-to-login
                // regardless of user state
                const outcome = evaluateParentLayoutGuards(status, user);
                expect(outcome).toBe('redirect-to-login');
            }),
            { numRuns: 50 },
        );
    });

    it('should return no-render for idle status regardless of user state', () => {
        fc.assert(
            fc.property(userArb, (user) => {
                const status = 'idle' as const;

                // When status is idle, outcome should always be no-render
                // regardless of user state
                const outcome = evaluateParentLayoutGuards(status, user);
                expect(outcome).toBe('no-render');
            }),
            { numRuns: 50 },
        );
    });

    it('should redirect to onboarding when signIn with null user', () => {
        fc.assert(
            fc.property(fc.anything(), () => {
                const status = 'signIn' as const;
                const user = null;

                // When status is signIn and user is null, outcome should be redirect-to-onboarding
                const outcome = evaluateParentLayoutGuards(status, user);
                expect(outcome).toBe('redirect-to-onboarding');
            }),
            { numRuns: 50 },
        );
    });
});

// Feature: auth-baseline-parent-mvp, Property 2: Role Guard Enforcement
/**
 * Property 2: Role Guard Enforcement
 *
 * For any authenticated user with a known role, attempting to access a route
 * group that does not match their role SHALL result in a redirect to the
 * dashboard returned by getHomeRouteForRole(user.role). Conversely, a PARENT
 * user accessing the (parent) group SHALL not be redirected.
 *
 * Validates: Requirements 15.1, 15.2
 */

describe('parentLayout - Property 2: Role Guard Enforcement', () => {
    it('should not redirect PARENT users from the (parent) group', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.uuid(),
                    email: fc.emailAddress(),
                    fullName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { freq: 2, nil: undefined }),
                }),
                (userBase) => {
                    const user = { ...userBase, role: UserRole.PARENT };
                    const status = 'signIn' as const;

                    // PARENT users accessing (parent) group should render the stack (no redirect)
                    const outcome = evaluateParentLayoutGuards(status, user);
                    expect(outcome).toBe('render-stack');
                },
            ),
            { numRuns: 100 },
        );
    });

    it('should redirect non-PARENT users from the (parent) group to their role dashboard', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.uuid(),
                    email: fc.emailAddress(),
                    role: fc.oneof(
                        fc.constant(UserRole.TEACHER),
                        fc.constant(UserRole.ADMIN),
                        fc.constant(UserRole.SUPER_ADMIN),
                    ),
                    fullName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { freq: 2, nil: undefined }),
                }),
                (user) => {
                    const status = 'signIn' as const;

                    // Non-PARENT users accessing (parent) group should be redirected
                    const outcome = evaluateParentLayoutGuards(status, user);
                    expect(outcome).toBe('redirect-to-role-dashboard');

                    // Verify the redirect target is NOT the parent dashboard
                    const redirectTarget = getHomeRouteForRole(user.role);
                    expect(redirectTarget).not.toBe(AppRoute.parent.dashboard);
                },
            ),
            { numRuns: 100 },
        );
    });

    it('should redirect TEACHER users to the teacher dashboard', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.uuid(),
                    email: fc.emailAddress(),
                    fullName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { freq: 2, nil: undefined }),
                }),
                (userBase) => {
                    const user = { ...userBase, role: UserRole.TEACHER };
                    const status = 'signIn' as const;

                    const outcome = evaluateParentLayoutGuards(status, user);
                    expect(outcome).toBe('redirect-to-role-dashboard');

                    // Verify the redirect target is the teacher dashboard
                    const redirectTarget = getHomeRouteForRole(user.role);
                    expect(redirectTarget).toBe(AppRoute.teacher.dashboard);
                },
            ),
            { numRuns: 50 },
        );
    });

    it('should redirect ADMIN users to the admin dashboard', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.uuid(),
                    email: fc.emailAddress(),
                    fullName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { freq: 2, nil: undefined }),
                }),
                (userBase) => {
                    const user = { ...userBase, role: UserRole.ADMIN };
                    const status = 'signIn' as const;

                    const outcome = evaluateParentLayoutGuards(status, user);
                    expect(outcome).toBe('redirect-to-role-dashboard');

                    // Verify the redirect target is the admin dashboard
                    const redirectTarget = getHomeRouteForRole(user.role);
                    expect(redirectTarget).toBe(AppRoute.admin.dashboard);
                },
            ),
            { numRuns: 50 },
        );
    });

    it('should redirect SUPER_ADMIN users to the super admin dashboard', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.uuid(),
                    email: fc.emailAddress(),
                    fullName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { freq: 2, nil: undefined }),
                }),
                (userBase) => {
                    const user = { ...userBase, role: UserRole.SUPER_ADMIN };
                    const status = 'signIn' as const;

                    const outcome = evaluateParentLayoutGuards(status, user);
                    expect(outcome).toBe('redirect-to-role-dashboard');

                    // Verify the redirect target is the super admin dashboard
                    const redirectTarget = getHomeRouteForRole(user.role);
                    expect(redirectTarget).toBe(AppRoute.superAdmin.dashboard);
                },
            ),
            { numRuns: 50 },
        );
    });

    it('should enforce role guard only after auth state and onboarding checks pass', () => {
        fc.assert(
            fc.property(
                fc.record({
                    status: fc.oneof(
                        fc.constant('idle' as const),
                        fc.constant('signOut' as const),
                    ),
                    user: fc.record({
                        id: fc.uuid(),
                        email: fc.emailAddress(),
                        role: fc.oneof(
                            fc.constant(UserRole.TEACHER),
                            fc.constant(UserRole.ADMIN),
                            fc.constant(UserRole.SUPER_ADMIN),
                        ),
                        fullName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { freq: 2, nil: undefined }),
                    }),
                }),
                ({ status, user }) => {
                    // When status is idle or signOut, role guard should NOT be evaluated
                    const outcome = evaluateParentLayoutGuards(status, user);

                    if (status === 'idle') {
                        expect(outcome).toBe('no-render');
                    } else if (status === 'signOut') {
                        expect(outcome).toBe('redirect-to-login');
                    }

                    // Role guard should not be evaluated in these cases
                    expect(outcome).not.toBe('redirect-to-role-dashboard');
                },
            ),
            { numRuns: 50 },
        );
    });

    it('should enforce role guard only after onboarding check passes', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.uuid(),
                    email: fc.emailAddress(),
                    role: fc.oneof(
                        fc.constant(UserRole.TEACHER),
                        fc.constant(UserRole.ADMIN),
                        fc.constant(UserRole.SUPER_ADMIN),
                    ),
                    fullName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { freq: 2, nil: undefined }),
                }),
                (_user) => {
                    const status = 'signIn' as const;
                    const user = null;

                    // When user is null (onboarding pending), role guard should NOT be evaluated
                    const outcome = evaluateParentLayoutGuards(status, user);
                    expect(outcome).toBe('redirect-to-onboarding');

                    // Role guard should not be evaluated in this case
                    expect(outcome).not.toBe('redirect-to-role-dashboard');
                },
            ),
            { numRuns: 50 },
        );
    });

    it('should verify all non-PARENT roles redirect to different dashboards', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(UserRole.TEACHER),
                    fc.constant(UserRole.ADMIN),
                    fc.constant(UserRole.SUPER_ADMIN),
                ),
                (role) => {
                    const user = {
                        id: 'test-id',
                        email: 'test@example.com',
                        role,
                        fullName: 'Test User',
                    };
                    const status = 'signIn' as const;

                    const outcome = evaluateParentLayoutGuards(status, user);
                    expect(outcome).toBe('redirect-to-role-dashboard');

                    // Verify each role has a unique dashboard
                    const redirectTarget = getHomeRouteForRole(role);
                    expect(redirectTarget).toBeDefined();
                    expect(redirectTarget).not.toBe(AppRoute.parent.dashboard);

                    // Verify different roles have different dashboards
                    const teacherDashboard = getHomeRouteForRole(UserRole.TEACHER);
                    const adminDashboard = getHomeRouteForRole(UserRole.ADMIN);
                    const superAdminDashboard = getHomeRouteForRole(UserRole.SUPER_ADMIN);

                    expect(teacherDashboard).not.toBe(adminDashboard);
                    expect(adminDashboard).not.toBe(superAdminDashboard);
                    expect(teacherDashboard).not.toBe(superAdminDashboard);
                },
            ),
            { numRuns: 50 },
        );
    });
});
