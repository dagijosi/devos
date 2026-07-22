import React from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  container?: HTMLElement;
}

/**
 * A reusable portal component that renders children into a different part of the DOM.
 * By default, it renders to document.body to escape parent stacking contexts.
 * 
 * @example
 * <Portal>
 *   <div className="fixed inset-0 z-50">Modal content</div>
 * </Portal>
 */
export const Portal: React.FC<PortalProps> = ({ 
  children, 
  container = document.body 
}) => {
  return createPortal(children, container);
};

export default Portal;
