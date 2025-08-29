/**
 * Provides the route components for the Create Career workflow.
 *
 * @module
 */
import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from '@liga/frontend/hooks';
import { cx } from '@liga/frontend/lib';
import { FaArrowLeft } from 'react-icons/fa';

/**
 * Top-level create career component.
 *
 * @component
 */
export default function () {
  const t = useTranslation('windows');
  const navigate = useNavigate();
  const location = useLocation();

  // infer the currently loaded step
  const currentStep = React.useMemo(() => {
    const pathInfo = location.pathname.match(/(\d+)/);

    if (!pathInfo) {
      return 1;
    }

    return parseInt(pathInfo[1]);
  }, [location.pathname]);

  // the steps for creating a new career.
  const steps = React.useMemo(
    () => [
      {
        id: 'user-info',
        title: t('landing.create.userInfo'),
      },
      {
        id: 'team-info',
        title: t('landing.create.teamInfo'),
      },
      {
        id: 'finish',
        title: t('shared.finish'),
      },
    ],
    [t],
  );

  return (
    <div className="frosted center h-full w-2/5 p-5 xl:w-1/3">
      <FaArrowLeft
        className="absolute top-5 left-5 size-5 cursor-pointer"
        onClick={() => navigate('/')}
      />

      {/* FORM STEPPER ITEMS */}
      <ul className="steps steps-horizontal absolute top-10 w-full">
        {steps.map((step, idx) => (
          <li
            key={step.id}
            className={cx(
              'step',
              idx < currentStep && 'step-primary',
              idx <= 1 && 'cursor-pointer',
            )}
            onClick={() => idx <= 1 && navigate(idx ? `/create/${idx + 1}` : '/create')}
          >
            <span className="text-sm italic">{step.title}</span>
          </li>
        ))}
      </ul>

      {/* FORM CONTENT RENDERED BY ROUTE */}
      <main className="stack-y h-full w-full">
        <Outlet />
      </main>
    </div>
  );
}
