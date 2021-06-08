import React from 'react';
import * as ReactDOM from 'react-dom';
import AudioRecorder from '../src/index';

describe('Thing', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(
      <AudioRecorder
        onGenerateAudioURL={audioUrl => {
          console.log(audioUrl);
        }}
      />,
      div
    );
    ReactDOM.unmountComponentAtNode(div);
  });
});
