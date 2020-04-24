

import { init_firefox } from './firefox';
import { init_chromium } from './chromium';


if (navigator.userAgent.includes('Chrome')) {
  init_chromium();
} else {
  init_firefox();
}