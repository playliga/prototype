import os from 'os';
import { uniq } from 'lodash';


/**
 * Taken from:
 * http://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js/8440736#8440736
 */

export default () => {
  const localIpAddresses = [] as string[];
  const ifaces = os.networkInterfaces();

  Object.keys( ifaces ).forEach( ifname => {
    ifaces[ ifname ].forEach( iface => {
      if( iface.family !== 'IPv4' ) {
        return;
      }

      localIpAddresses.push( iface.address );
    });
  });

  localIpAddresses.sort();
  return uniq( localIpAddresses );
};
