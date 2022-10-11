import React from 'react';
import { Navigation } from './navigation';

export const BasicNavigation = () => {
  return <Navigation onClose={() => {}} addNodeToWorkspace={ (node: string): void => {
    console.log('callback is called.');
  } } />;
};
