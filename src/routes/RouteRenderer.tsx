import React, { Suspense, type JSX, type ReactElement } from "react";
import { Route } from "react-router-dom";
import RoleGuard from "./RoleGuard";
import type { AppRoute } from "./types/routesTypes";
import { LoadingComponent, ProtectedRoute } from "../components/ui";
import { ErrorBoundary } from "../components/feedback/ErrorBoundary";

/**
 * Apply wrapper functions around a React element
 */
const applyWrappers = (
  element: ReactElement,
  wrappers?: ((children: React.ReactNode) => JSX.Element)[]
): ReactElement => {
  if (!wrappers?.length) return element;
  return wrappers.reduceRight((acc, wrap) => wrap(acc), element);
};

/**
 * Create wrappers based on route flags
 */
const getWrappersFromFlags = (
  route: AppRoute
): ((children: React.ReactNode) => JSX.Element)[] => {
  const wrappers: ((children: React.ReactNode) => JSX.Element)[] = [];

  if (route.protected || route.publicOnly) {
    wrappers.push((children) => (
      <ProtectedRoute isPublicOnly={route.publicOnly}>{children}</ProtectedRoute>
    ));
  }

  if (route.allowedRoles?.length) {
    wrappers.push((children) => (
      <RoleGuard allowedRoles={route.allowedRoles!}>{children}</RoleGuard>
    ));
  }

  if (route.wrappers) wrappers.push(...route.wrappers);

  return wrappers;
};

/**
 * Recursively renders routes with layout, wrappers, and guards
 */
export const renderRoutes = (routes: AppRoute[]): React.ReactNode => {
  return routes.map((route, idx) => {
    const { path, index, Component, children, layout: LayoutWrapper } = route;
    const wrappers = getWrappersFromFlags(route);

    // --- Lazy-loaded element ---
    const lazyElement: ReactElement = (
      <ErrorBoundary module={path || 'page'}>
        <Suspense fallback={<LoadingComponent />}>
          <Component />
        </Suspense>
      </ErrorBoundary>
    );

    let element: ReactElement = lazyElement;

    // --- Handle layouts ---
    if (LayoutWrapper) {
      const expectsChildren = LayoutWrapper.length > 0; // has { children }

      if (expectsChildren) {
        element = <LayoutWrapper>{element}</LayoutWrapper>;
      } else {
        // Layout uses <Outlet /> → parent route structure
        return (
          <Route key={`layout-${path || idx}`} element={<LayoutWrapper />}>
            {index ? (
              <Route
                key={`index-${idx}`}
                index
                element={applyWrappers(element, wrappers)}
              />
            ) : (
              <Route
                key={path || `route-${idx}`}
                path={path}
                element={applyWrappers(element, wrappers)}
              >
                {children && renderRoutes(children)}
              </Route>
            )}
          </Route>
        );
      }
    }

    // --- Apply wrappers ---
    element = applyWrappers(element, wrappers);

    // --- Return route ---
    if (index) {
      // ✅ No children for index route (fixes your TS error)
      return (
        <Route key={`index-${idx}`} index element={element} />
      );
    }

    return (
      <Route key={path || `route-${idx}`} path={path} element={element}>
        {children && renderRoutes(children)}
      </Route>
    );
  });
};
