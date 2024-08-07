/**
 * Provides the route components for the Create Career workflow.
 *
 * @module
 */
import cx from 'classnames';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

/**
 * Defines the steps for creating a new career.
 *
 * @constant
 */
const steps = [
  {
    id: 'user-info',
    title: 'User Information',
  },
  {
    id: 'team-info',
    title: 'Team Information',
  },
  {
    id: 'finish',
    title: 'Finish',
  },
];

/**
 * Top-level create career component.
 *
 * @component
 */
export default function () {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep] = location.pathname
    .split('/')
    .slice(-1)
    .map((path) => parseInt(path) || 1);

  return (
    <div className="frosted center h-full w-2/5 p-5 xl:w-1/3">
      <FaArrowLeft
        className="absolute left-5 top-5 size-5 cursor-pointer"
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
      <main className="stack-y w-full">
        <Outlet />
      </main>
    </div>
  );
}
