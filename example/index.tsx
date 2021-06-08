import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import AudioRecorder from '../.';

const App = () => {
  return (
    <div>
      <AudioRecorder
        onGenerateAudioURL={audioUrl =>
          console.log('Generated Audio URL', audioUrl)
        }
      />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
