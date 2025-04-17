/**
 * Manage application mods.
 *
 * @module
 */
import React from 'react';
import { Constants } from '@liga/shared';
import { useTranslation } from '@liga/frontend/hooks';
import { FaDownload, FaTrashAlt } from 'react-icons/fa';

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const t = useTranslation('windows');
  const [downloading, setDownloading] = React.useState<string>();
  const [installed, setInstalled] = React.useState<string>();
  const [mods, setMods] = React.useState<Awaited<ReturnType<typeof api.mods.all>>>();
  const [progress, setProgress] = React.useState<number>();
  const [status, setStatus] = React.useState<string>();

  React.useEffect(() => {
    api.mods
      .all()
      .then(setMods)
      .catch(() => setMods([]));
    api.mods.installed().then(setInstalled);

    // register mod manager event handlers
    api.ipc.on(Constants.IPCRoute.MODS_DOWNLOADING, () => setStatus(t('mods.statusDownloading')));
    api.ipc.on(Constants.IPCRoute.MODS_DOWNLOAD_PROGRESS, setProgress);
    api.ipc.on(Constants.IPCRoute.MODS_INSTALLING, () => setStatus(t('mods.statusInstalling')));
    api.ipc.on(Constants.IPCRoute.MODS_FINISHED, () => {
      setDownloading(null);
      setProgress(null);
      setStatus(null);
      api.mods.installed().then(setInstalled);
    });
  }, []);

  if (!mods) {
    return (
      <main className="h-screen w-screen">
        <section className="center h-full">
          <span className="loading loading-bars" />
        </section>
      </main>
    );
  }

  return (
    <main className="flex h-screen w-full flex-col">
      <header className="stack-y m-4">
        <p>{t('mods.title')}</p>
        <p>
          <em>{t('mods.subtitle')}</em>
        </p>
      </header>
      <section className="h-0 flex-grow overflow-y-scroll">
        <table className="table table-pin-rows table-fixed">
          <thead>
            <tr className="border-t border-t-base-content/10">
              <th className="w-3/12">{t('shared.name')}</th>
              <th className="w-4/12">{t('shared.description')}</th>
              <th className="w-1/12">{t('mods.version')}</th>
              <th className="w-2/12 text-center">{t('mods.install')}</th>
              <th className="w-2/12 text-center">{t('shared.status')}</th>
            </tr>
          </thead>
          <tbody>
            {!mods.length && (
              <tr>
                <td colSpan={5} className="text-center">
                  {t('mods.empty')}
                </td>
              </tr>
            )}
            {mods.map((mod) => (
              <tr key={mod.name + '__available'}>
                <td title={mod.name} className="truncate">
                  {mod.name}
                </td>
                <td title={mod.description} className="truncate">
                  {mod.description}
                </td>
                <td>
                  <code>{mod.version}</code>
                </td>
                <td className="text-center">
                  {((!downloading && installed.replace('.zip', '') !== mod.name.toLowerCase()) ||
                    (!!downloading && downloading !== mod.name)) && (
                    <button
                      title={t('mods.download')}
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        api.mods.download(mod.name);
                        setDownloading(mod.name);
                      }}
                    >
                      <FaDownload />
                    </button>
                  )}
                  {!!downloading && downloading === mod.name && (
                    <progress className="progress" value={progress} max="100" />
                  )}
                  {!downloading && installed.replace('.zip', '') === mod.name.toLowerCase() && (
                    <button
                      title={t('mods.uninstall')}
                      className="btn btn-error btn-sm"
                      onClick={() => {
                        api.mods.delete().then(() => setInstalled(''));
                      }}
                    >
                      <FaTrashAlt />
                    </button>
                  )}
                </td>
                <td className="text-center">
                  {!!downloading && downloading === mod.name && status}
                  {!downloading &&
                    installed.replace('.zip', '') === mod.name.toLowerCase() &&
                    t('mods.statusInstalled')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
