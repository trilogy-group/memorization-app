import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { nodes, edges } from './initial-elements';
import { Navigation, NavigationProps } from './navigation';

export default {
  title: 'Components/Navigation',
  component: Navigation,
} as ComponentMeta<typeof Navigation>;

const Template: ComponentStory<typeof Navigation> = (args: NavigationProps) => (
  <Navigation {...args}/>
);

export const DefaultTree: ComponentStory<typeof Navigation> = Template.bind({});
DefaultTree.args = {
  open: true,
  nodes: nodes,
  edges: edges,
  onClose: () => {
    console.log('Closing Navigation')
  },
  addNodeToWorkspace: (node: string) => {
    console.log(`Adding node ${node} to workspace`)
  }
};
