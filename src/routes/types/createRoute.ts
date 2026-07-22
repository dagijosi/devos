import type { AppRoute } from "./routesTypes";

/**
 * Helper to create routes easily with optional layouts, protection, wrappers, role access, and metadata.
 *
 * You can use it in multiple ways:
 *
 * 1️⃣ Simple route with path and component:
 * ```ts
 * createRoute("/signup", Signup, {
 *   publicOnly: true,
 *   layout: MainLayout,
 *   meta: { title: "Sign Up Page" }
 * });
 * ```
 *
 * 2️⃣ Index route (homepage):
 * ```ts
 * createRoute({
 *   index: true,
 *   Component: Homepage,
 *   layout: MainLayout,
 *   meta: { title: "Home Page" }
 * });
 * ```
 *
 * 3️⃣ Protected route:
 * ```ts
 * createRoute("/dashboard", DashboardPage, {
 *   protected: true,
 *   layout: DashboardLayout
 * });
 * ```
 *
 * 4️⃣ Role-based route (only accessible for certain roles):
 * ```ts
 * createRoute("/admin", AdminPage, {
 *   protected: true,
 *   allowedRoles: ["admin", "superadmin"],
 *   layout: DashboardLayout
 * });
 * ```
 *
 * 5️⃣ Route with custom wrappers (like additional context providers or guards):
 * ```ts
 * createRoute("/special", SpecialPage, {
 *   wrappers: [
 *     (children) => <CustomWrapper>{children}</CustomWrapper>,
 *     (children) => <AnotherGuard>{children}</AnotherGuard>
 *   ],
 *   layout: MainLayout
 * });
 * ```
 *
 * @param pathOrOptions - Either a path string for the route or a full route object.
 * @param Component - React component to render for the route (required if using a path string).
 * @param options - Optional route properties:
 *   - `layout`: React component that wraps the route (e.g., a page layout)
 *   - `protected`: boolean indicating if the route requires authentication
 *   - `publicOnly`: boolean indicating the route is accessible only to non-authenticated users
 *   - `allowedRoles`: string array of roles allowed to access this route
 *   - `wrappers`: array of wrapper functions to wrap the route component
 *   - `meta`: custom metadata for the route (like title, description, or icon)
 * @returns A fully typed `AppRoute` object ready to use in your routing system.
 */
export function createRoute(
  pathOrOptions: string | Omit<AppRoute, "path">,
  Component?: React.ComponentType,
  options?: Partial<AppRoute>
): AppRoute {
  if (typeof pathOrOptions === "string") {
    return { path: pathOrOptions, Component: Component!, ...options };
  }
  return pathOrOptions as AppRoute;
}
