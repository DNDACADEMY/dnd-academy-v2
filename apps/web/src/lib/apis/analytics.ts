import { sendGAEvent as _sendGA4Event } from '@next/third-parties/google';

import { GAEvent } from '../constants/gaEvent';

function sendGA4Event(event: GAEvent, params: Record<string, unknown>) {
  _sendGA4Event(event, params);
}

export default sendGA4Event;
