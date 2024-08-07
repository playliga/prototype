/**
 * This window manages the application's web workers which provide
 * multithreading support for complex CPU-intensive tasks.
 *
 * @module
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ipcRenderer } from 'electron';
import { sortBy } from 'lodash';
import { Constants } from '@liga/shared';
import type { ThreadRequest, ThreadResponse } from '@liga/frontend/lib/threading';

/**
 * The index component
 *
 * @component
 */
function Index() {
  // event listeners require a ref to state in order to update its value
  const [threads, setThreads] = React.useState<Array<ThreadResponse>>([]);
  const threadsRef = React.useRef(threads);

  // wrapper function to update thread state and ref
  const setThreadsRef = (data: typeof threads) => {
    threadsRef.current = data;
    setThreads(data);
  };

  // thread event listeners
  const onThreadResponse = (e: MessageEvent<ThreadResponse>) => {
    setThreadsRef(
      sortBy(
        [...threadsRef.current.filter((thread) => thread.target !== e.data.target), { ...e.data }],
        'target',
      ),
    );
  };

  const onThreadCreate = (_: Electron.IpcRendererEvent, data: ThreadRequest) => {
    const worker = new Worker(new URL('../lib/threading.ts', import.meta.url), {
      name: data.target,
    });
    worker.postMessage(data);
    worker.onmessage = onThreadResponse;
  };

  // attach listeners on mount
  React.useEffect(() => {
    ipcRenderer.on(Constants.IPCRoute.WINDOW_SEND, onThreadCreate);
  }, []);

  return (
    <main>
      <h1>Threads</h1>
      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Timing</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody style={{ textAlign: 'center' }}>
          {threads.map((thread, idx) => (
            <tr
              key={thread.target}
              style={{
                backgroundColor: idx % 2 && threads.length >= 3 ? 'lightgray' : 'transparent',
              }}
            >
              <td>{thread.target}</td>
              <td>
                {thread.performance?.duration
                  ? `${thread.performance.duration.toFixed(2)} ms`
                  : '--'}
              </td>
              <td>{thread.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr />
      {Object.keys(Constants.ThreadingTarget).map(
        (target: keyof typeof Constants.ThreadingTarget) => (
          <button
            key={Constants.ThreadingTarget[target]}
            onClick={() =>
              ipcRenderer.send(
                Constants.IPCRoute.WINDOW_SEND,
                Constants.WindowIdentifier.Threading,
                {
                  target: Constants.ThreadingTarget[target],
                  payload: {
                    num: 200_000_000,
                  },
                },
              )
            }
          >
            start {target} thread
          </button>
        ),
      )}
    </main>
  );
}

/**
 * React bootstrapping logic.
 *
 * @function
 * @name anonymous
 */
(() => {
  // grab the root container
  const container = document.getElementById('root');

  if (!container) {
    throw new Error('Failed to find the root element.');
  }

  // render the react application
  ReactDOM.createRoot(container).render(<Index />);
})();
