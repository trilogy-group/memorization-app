import React from 'react';
import Upload from './upload';

export const BasicUpload = () => {
  return <Upload onClose={() => {}} addNodeToWorkspace={ (node: string): void => {
    console.log('callback is called.');
  } } />;
};
