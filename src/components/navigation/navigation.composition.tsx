import React from 'react';
import Navigation from './navigation';

interface ConceptState {
  id: string;
  name: string;
  parentId: string;
  parentName: string;
}

export const BasicNavigation = () => {
  return <Navigation onClose={() => { } } addNodeToWorkspace={(node: string): void => {
    console.log('callback is called.');
  } } addNodeListToWorkspace={function (concepts: ConceptState[]): void {
    throw new Error('Function not implemented.');
  } } multiselect={false} questions={false} />;
};
