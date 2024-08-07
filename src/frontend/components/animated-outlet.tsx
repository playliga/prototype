/**
 * Freezes the outlet component whenever the route changes
 * in order to properly render route exit transitions.
 *
 * @module
 */
import React from 'react';
import { useOutlet } from 'react-router-dom';

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const o = useOutlet();
  const [outlet] = React.useState(o);

  return <>{outlet}</>;
}
