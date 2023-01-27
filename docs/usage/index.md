## Basic Usage

```jsx
import React from 'react';
import ReactAnsi from 'react-ansi-eighteen';
import log from '../log.txt';

export default () => (
  <div
    style={{
      height: 500,

      height: 500,
      backgroundColor: 'white',
      color: 'black',
    }}
  >
    <ReactAnsi
      log={log}
      bodyStyle={{ height: '100%', overflowY: 'auto' }}
      logStyle={{ height: 500, backgroundColor: 'white', color: 'black' }}
      autoScroll
    />
  </div>
);
```
