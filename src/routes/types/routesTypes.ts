import React, { type JSX } from "react";

export type RouteWrapper = (children: React.ReactNode) => JSX.Element;

// routesTypes.ts
export type RouteProps = {
  Component: React.ComponentType;
  layout?: React.ComponentType<{ children?: React.ReactNode }>; // 👈 make optional
  wrappers?: RouteWrapper[];
  protected?: boolean;
  publicOnly?: boolean;
  allowedRoles?: string[];
  meta?: Record<string, unknown>;
};


export type AppRoute = RouteProps & {
  path?: string;
  index?: boolean;
  children?: AppRoute[];
};
