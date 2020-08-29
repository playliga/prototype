import * as Calendar from './calendar';
import * as Competition from './competition';
import * as Offer from './offer';
import * as Worldgen from './worldgen';
import Score from './score';


export default {
  Calendar,
  Competition,
  Offer,
  Score,
  ...Worldgen,
};
