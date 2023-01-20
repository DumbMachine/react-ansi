## Basic Usage

```jsx
import React from 'react';
import ReactAnsi from 'react-ansi-eighteen';
import log from '../log.txt';

export default () => (
  <div style={{ height: 500 }}>
    <ReactAnsi
      log={log}
      popover={
        <pre>
          {JSON.stringify({
            time: 'nothing',
          })}
        </pre>
      }
      bodyStyle={{ height: '100%', overflowY: 'auto' }}
      logStyle={{ height: 500 }}
      autoScroll
    />
  </div>
);
```
