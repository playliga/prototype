/**
 * Connects to a saved career.
 *
 * @module
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { Constants } from '@liga/shared';

/**
 * Status messages displayed to the user.
 *
 * Sorted by order of operations.
 *
 * @enum
 */
enum Status {
  Flushing = 'Flushing connections...',
  Connecting = 'Connecting to database...',
  Connected = 'Connected.',
}

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const { id } = useParams();
  const [status, setStatus] = React.useState(Status.Flushing);

  React.useEffect(() => {
    Promise.resolve(setStatus(Status.Flushing))
      .then(() => api.database.disconnect())
      .then(() => Promise.resolve(setStatus(Status.Connecting)))
      .then(() => api.database.connect(id))
      .then(() => Promise.resolve(setStatus(Status.Connected)))
      .then(() => {
        api.window.open(Constants.WindowIdentifier.Main);
        api.window.close(Constants.WindowIdentifier.Landing);
      });
  }, []);

  return (
    <main className="frosted center h-full w-2/5 p-5 xl:w-1/3">
      <header className="center gap-6">
        <span className="loading loading-bars loading-lg" />
        <p>{status}</p>
      </header>
    </main>
  );
}
