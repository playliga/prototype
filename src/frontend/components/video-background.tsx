/**
 * Video background as a pure component which only is rendered
 * once throughout the lifecycle of the application.
 *
 * @module
 */
import React from 'react';

/**
 * Exports this module.
 *
 * @param props           Root props.
 * @param props.children  The children to render.
 * @component
 * @exports
 */
export default function (props: { children: React.ReactNode }) {
  const PureComponent = React.useMemo(
    () => (
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 z-0 h-screen w-full object-cover brightness-75"
      >
        {props.children}
      </video>
    ),
    [],
  );

  return PureComponent;
}
