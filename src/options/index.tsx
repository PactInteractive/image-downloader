// Style
import '../../stylesheets/main.css';
import './style.css';

// Application
import * as React from 'react';
import { render } from '../dom';

import { App } from './Options';

render(<App />, document.querySelector('main'));
