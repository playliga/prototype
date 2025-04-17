/**
 * Connects to a saved career.
 *
 * @module
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { Constants } from '@liga/shared';
import { useTranslation } from '@liga/frontend/hooks';

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const t = useTranslation('windows');
  const { id } = useParams();
  const [status, setStatus] = React.useState('');

  React.useEffect(() => {
    Promise.resolve(setStatus(t('landing.connect.flushing')))
      .then(() => api.database.disconnect())
      .then(() => Promise.resolve(setStatus(t('shared.connectingToDatabase'))))
      .then(() => api.database.connect(id))
      .then(() => Promise.resolve(setStatus(t('landing.connect.connected'))))
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
