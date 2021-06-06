import React from 'react';
import { Meta, Story } from '@storybook/react';
import AudioRecorder, { Props } from '../src/components/AudioRecorder';

const meta: Meta = {
  title: 'AudioRecorder',
  component: AudioRecorder,
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;

const Template: Story<Props> = args => <AudioRecorder {...args} />;

// By passing using the Args format for exported stories, you can control the props for a component for reuse in a test
// https://storybook.js.org/docs/react/workflows/unit-testing
export const Default = Template.bind({});

Default.args = {
  onGenerateAudioURL: audioUrl => {
    console.log('Generated audio url', audioUrl);
  },
};
