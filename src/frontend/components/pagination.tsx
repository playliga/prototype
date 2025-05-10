/**
 * Unified pagination component.
 *
 * @module
 */
import React from 'react';
import { FaArrowCircleLeft, FaArrowCircleRight } from 'react-icons/fa';

/** @interface */
interface Props {
  numPage: number;
  totalPages: number;
  onChange: (page: number) => void;
  onClick: (page: number) => void;
}

/**
 * Exports this module.
 *
 * @param props The root props.
 * @exports
 */
export default function (props: Props) {
  const min = 1;
  const page = React.useMemo(() => Math.max(props.numPage, min), [props.numPage]);
  const total = React.useMemo(() => Math.max(props.totalPages, min), [props.totalPages]);
  return (
    <article className="stack-x items-center">
      <aside className="join">
        <button
          className="btn join-item btn-xs"
          disabled={page === min}
          onClick={() => props.onClick(page - 1)}
        >
          <FaArrowCircleLeft />
        </button>
        <button
          className="btn join-item btn-xs"
          disabled={page === total}
          onClick={() => props.onClick(page + 1)}
        >
          <FaArrowCircleRight />
        </button>
      </aside>
      <input
        className="input input-xs border-base-200 w-14 border"
        disabled={total <= min}
        max={total}
        min={min}
        type="number"
        value={page}
        onChange={(event) => props.onChange(Number(event.target.value))}
      />
      <span>/ {total}</span>
    </article>
  );
}
