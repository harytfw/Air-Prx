import { init_firefox } from './firefox/firefox';
import { init_chromium } from './chromium/chromium';
import { isChromium } from '../util';


if (isChromium()) {
  init_chromium();
} else {
  init_firefox();
}