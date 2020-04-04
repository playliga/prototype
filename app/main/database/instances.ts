import { IterableObject } from 'main/types';


/**
 * Persist the NeDB instances within an iterable object
 * where each item is a datastore singleton instance.
 */
const nedbinstances: IterableObject<any> = {};
export default nedbinstances;
