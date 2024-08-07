/**
 * Dedicated modal for brackets.
 *
 * @module
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Eagers } from '@liga/shared';
import { Brackets } from '@liga/frontend/components';

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const location = useLocation();
  const [bracket, setBracket] = React.useState<
    Awaited<ReturnType<typeof api.matches.all<typeof Eagers.match>>>
  >([]);

  // fetch data when viewing bracket
  React.useEffect(() => {
    if (!location.state) {
      return;
    }

    api.matches
      .all({
        where: {
          competitionId: location.state as number,
        },
        include: Eagers.match.include,
      })
      .then(setBracket);
  }, []);

  return (
    <main className="h-screen w-screen">
      {!bracket.length && (
        <section className="center h-full">
          <span className="loading loading-bars" />
        </section>
      )}
      {!!bracket.length && <Brackets matches={bracket} />}
    </main>
  );
}
