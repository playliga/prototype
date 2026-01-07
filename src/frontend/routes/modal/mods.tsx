/**
 * Manage application mods.
 *
 * @module
 */
import React from 'react';
import { Constants, Util } from '@liga/shared';
import { useTranslation } from '@liga/frontend/hooks';
import { FaChevronRight, FaDownload, FaExternalLinkAlt, FaTrashAlt } from 'react-icons/fa';

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const t = useTranslation('windows');
  const [downloading, setDownloading] = React.useState<string>();
  const [installed, setInstalled] = React.useState<Array<string>>([]);
  const [mods, setMods] = React.useState<Awaited<ReturnType<typeof api.mods.all>>>();
  const [progress, setProgress] = React.useState<number>();
  const [status, setStatus] = React.useState<string>();

  React.useEffect(() => {
    api.mods
      .all()
      .then(setMods)
      .catch(() => setMods([[], []]));
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

  const [metadata, assets] = React.useMemo(() => mods || [[], []], [mods]);
  const installedModList = React.useMemo(
    () => installed.map((mod) => mod.toLowerCase().replace('.zip', '')),
    [installed],
  );

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
        <table className="table-pin-rows table-sm table table-fixed">
          <thead>
            <tr className="border-t-base-content/10 border-t">
              <th className="w-[20%]">{t('shared.name')}</th>
              <th className="w-[30%]">{t('shared.description')}</th>
              <th className="text-center">{t('mods.author')}</th>
              <th className="text-center">{t('shared.homepage')}</th>
              <th className="text-center">{t('mods.install')}</th>
              <th className="text-center">{t('shared.size')}</th>
            </tr>
          </thead>
          <tbody>
            {!metadata.length && (
              <tr>
                <td colSpan={5} className="text-center">
                  {t('mods.empty')}
                </td>
              </tr>
            )}
            {metadata.map((mod) => (
              <tr key={mod.name + '__available'}>
                <td title={mod.name} className="truncate">
                  {mod.name}
                </td>
                <td title={mod.description} className="truncate">
                  {mod.description}
                </td>
                <td title={mod.author} className="truncate text-center">
                  {mod.author}
                </td>
                <td className="text-center">
                  <button
                    title={mod.homepage || t('shared.homepage')}
                    className="btn btn-sm btn-ghost"
                    disabled={!mod.homepage}
                    onClick={() => api.app.external(mod.homepage)}
                  >
                    <FaExternalLinkAlt />
                  </button>
                </td>
                <td className="text-center">
                  {((!downloading && !installedModList.includes(mod.name.toLowerCase())) ||
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
                    <progress title={status} className="progress" value={progress} max="100" />
                  )}
                  {!downloading &&
                    installedModList.includes(mod.name.toLowerCase()) &&
                    !mod.executable && (
                      <button
                        title={t('mods.uninstall')}
                        className="btn btn-error btn-sm"
                        onClick={() => {
                          api.mods.delete().then(api.mods.installed).then(setInstalled);
                        }}
                      >
                        <FaTrashAlt />
                      </button>
                    )}
                  {!downloading &&
                    installedModList.includes(mod.name.toLowerCase()) &&
                    !!mod.executable && (
                      <button
                        title={t('shared.launch')}
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          api.app
                            .messageBox(Constants.WindowIdentifier.Modal, {
                              type: 'question',
                              message:
                                'This mod will run as its own app. ' +
                                'Do you want to close the current app after launching?',
                              buttons: ['Yes', 'Cancel'],
                            })
                            .then((data) =>
                              data.response === 0 ? api.mods.launch() : Promise.reject(),
                            )
                            .then(api.app.quit)
                            .catch(() => null);
                        }}
                      >
                        <FaChevronRight />
                      </button>
                    )}
                </td>
                <td className="text-center">
                  <code>
                    {(() => {
                      const size =
                        assets.find((asset) => asset.name === mod.name + '.zip')?.size || 0;
                      return Util.formatBytes(size, 1);
                    })()}
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
