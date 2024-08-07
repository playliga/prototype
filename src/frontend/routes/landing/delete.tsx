/**
 * Confirmation modal shown when deleting a saved career.
 *
 * @module
 */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppStateContext } from '@liga/frontend/redux';
import { profilesDelete } from '@liga/frontend/redux/actions';

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const { id } = useParams();
  const { dispatch, state } = React.useContext(AppStateContext);
  const [deleting, setDeleting] = React.useState(false);
  const navigate = useNavigate();

  // refresh profile when attempting delete
  const profile = React.useMemo(
    () => state.profiles.find((item) => item.id === parseInt(id)),
    [id],
  );

  // delete profile event handler
  const handleDeleteProfile = async () => {
    setDeleting(true);
    await api.saves.delete(profile.id);
    dispatch(profilesDelete([profile]));
    setDeleting(false);
    navigate(-1);
  };

  return (
    <dialog className="modal modal-open absolute w-screen">
      <section className="modal-box">
        <h3 className="text-lg">Delete Saved Career</h3>
        <p className="py-4">Are you sure? You can't undo this action afterwards.</p>
        <article className="modal-action">
          <button className="btn" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button className="btn btn-error" onClick={handleDeleteProfile}>
            {!!deleting && <span className="loading loading-spinner"></span>}
            Delete
          </button>
        </article>
      </section>
    </dialog>
  );
}
