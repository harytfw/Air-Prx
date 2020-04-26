

import { init_firefox } from './firefox';
import { init_chromium } from './chromium';
import { isChromium } from '../util';


if (isChromium()) {
  init_chromium();
} else {
  init_firefox();
}