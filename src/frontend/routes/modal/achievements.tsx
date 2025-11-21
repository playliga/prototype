/**
 * Achievements modal.
 */
import React from 'react';
import { useTranslation } from '@liga/frontend/hooks';
import { cx } from '@liga/frontend/lib';
import { FaCrown } from 'react-icons/fa';

/**
 * Achievement component.
 *
 * @param props The root props.
 * @function
 */
function Achievement(props: Awaited<ReturnType<typeof api.achievements.all>>[number]) {
  const t = useTranslation('achievements');
  const title = t(props.id as keyof typeof t);
  const subtitle = t(`${props.id}_DESC` as keyof typeof t);

  return (
    <tr>
      <td>
        <article className="flex items-center gap-4">
          <figure className={cx(!!props.unlocked && 'text-amber-400')}>
            <FaCrown className="size-8" />
          </figure>
          <aside>
            <p className="font-bold">{title}</p>
            <p>{subtitle}</p>
          </aside>
        </article>
      </td>
    </tr>
  );
}

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const [achievements, setAchievements] = React.useState<
    Awaited<ReturnType<typeof api.achievements.all>>
  >([]);

  React.useEffect(() => {
    api.achievements.all().then(setAchievements);
  }, []);

  const unlocked = React.useMemo(
    () => achievements.filter((achievement) => achievement.unlocked),
    [achievements],
  );
  const locked = React.useMemo(
    () => achievements.filter((achievement) => !achievement.unlocked),
    [achievements],
  );
  const progress = React.useMemo(
    () => Math.ceil((unlocked.length / achievements.length) * 100),
    [achievements, unlocked],
  );

  if (!achievements.length) {
    return (
      <main className="h-screen w-screen">
        <section className="center h-full">
          <span className="loading loading-bars" />
        </section>
      </main>
    );
  }

  return (
    <main className="flex h-screen w-screen flex-col">
      <table className="table">
        <thead>
          <tr>
            <th>
              {unlocked.length} of {achievements.length} achievements unlocked
            </th>
            <th className="text-right">({progress}%)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={2}>
              <progress className="progress" value={unlocked.length} max={achievements.length} />
            </td>
          </tr>
        </tbody>
      </table>
      <section className="flex-1 overflow-y-scroll">
        <table className="table-pin-rows table table-fixed">
          {unlocked.length > 0 && (
            <React.Fragment>
              <thead>
                <tr>
                  <th>Unlocked</th>
                </tr>
              </thead>
              <tbody>
                {unlocked.map((achievement) => (
                  <Achievement key={achievement.id} {...achievement} />
                ))}
              </tbody>
            </React.Fragment>
          )}
          <thead>
            <tr>
              <th>Locked</th>
            </tr>
          </thead>
          <tbody>
            {locked.map((achievement) => (
              <Achievement key={achievement.id} {...achievement} />
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
