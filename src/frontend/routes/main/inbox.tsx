/**
 * Inbox route showing user e-mails.
 *
 * @module
 */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import dedent from 'dedent';
import cx from 'classnames';
import { format } from 'date-fns';
import { Constants } from '@liga/shared';
import { AppStateContext } from '@liga/frontend/redux';
import { emailsDelete, emailsUpdate } from '@liga/frontend/redux/actions';
import { FaBorderNone, FaEnvelopeOpen, FaMailBulk, FaTrash } from 'react-icons/fa';

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const { state, dispatch } = React.useContext(AppStateContext);
  const [selected, setSelected] = React.useState<Array<number>>([]);
  const [working, setWorking] = React.useState(false);

  // grab e-mails on first load
  React.useEffect(() => {
    if (!state.emails.length) {
      return;
    }

    setSelected([state.emails[0].id]);
  }, []);

  // mark selected e-mail as read
  React.useEffect(() => {
    if (!selected.length || selected.length > 1) {
      return;
    }

    api.emails
      .updateMany({
        where: { id: { in: selected.slice(0, 1) } },
        data: { read: true },
      })
      .then((emails) => dispatch(emailsUpdate(emails)));
  }, [selected]);

  return (
    <div id="inbox" className="dashboard">
      <header>
        <button
          disabled={!state.emails.length || selected.length > 1}
          onClick={() => setSelected(state.emails.map((email) => email.id))}
        >
          <FaBorderNone />
          Select All
        </button>
        <button
          disabled={!selected.length}
          onClick={() =>
            api.emails.delete(selected).then(() => {
              dispatch(emailsDelete(state.emails.filter((email) => selected.includes(email.id))));
              setSelected([]);
            })
          }
        >
          <FaTrash />
          Delete
        </button>
        <button
          disabled={
            selected.length <= 1 ||
            selected.every((item) => state.emails.find((email) => email.id === item)?.read)
          }
          onClick={() =>
            api.emails
              .updateMany({
                where: { id: { in: selected } },
                data: { read: true },
              })
              .then((emails) => dispatch(emailsUpdate(emails)))
          }
        >
          <FaEnvelopeOpen />
          Mark as Read
        </button>
      </header>
      <main>
        <section className="divide-y divide-base-content/10">
          {!state.emails.length && (
            <article className="center h-full">
              <p>All is quiet...</p>
            </article>
          )}
          {state.emails.map((email) => (
            <article
              key={`${email.id}__email`}
              className={cx('cursor-pointer p-5', selected.includes(email.id) && 'bg-base-200')}
              onClick={() => setSelected([email.id])}
            >
              <header className="relative">
                {!email.read && <span className="badge-xxs badge badge-info absolute right-0" />}
                <h2 className="text-base">{email.from.name}</h2>
                <h3 className="text-base font-normal">{email.subject}</h3>
                <em className="text-sm">
                  {format(email.sentAt, Constants.Application.CALENDAR_DATE_FORMAT)}
                </em>
              </header>
              <footer>
                <p className="line-clamp-1">{email.dialogues[0].content}</p>
              </footer>
            </article>
          ))}
        </section>
        <section className="stack-y p-5">
          {!state.emails.length && (
            <article className="center h-full gap-5">
              <FaEnvelopeOpen className="size-24" />
              <p>You have no e-mails.</p>
            </article>
          )}
          {!!selected &&
            selected.length === 1 &&
            (() => {
              const email = state.emails.find((email) => email.id === selected[0]);
              return email.dialogues
                .sort((a, b) => b.id - a.id)
                .map((dialogue) =>
                  /(accepted|rejected)/gi.test(dialogue.content) ? (
                    <article
                      key={`${email.id}__email__${dialogue.id}`}
                      className="divider before:h-px before:bg-base-content/10 after:h-px after:bg-base-content/10"
                    >
                      <em>{dialogue.content}</em>
                    </article>
                  ) : (
                    <article
                      key={`${email.id}__email__${dialogue.id}`}
                      className="divide-y divide-base-content/10 bg-base-200 px-5"
                    >
                      <header className="py-5">
                        <h3>{email.from.name}</h3>
                        <h4>{email.subject}</h4>
                        <em className="text-sm">
                          {format(dialogue.sentAt, Constants.Application.CALENDAR_DATE_FORMAT)}
                        </em>
                      </header>
                      <footer className="prose max-w-none py-5">
                        <ReactMarkdown
                          children={dedent(dialogue.content)}
                          rehypePlugins={
                            [rehypeRaw] as Parameters<typeof ReactMarkdown>[number]['remarkPlugins']
                          }
                          components={{
                            button(props) {
                              const { node, children, ...rest } = props;
                              return (
                                <button
                                  {...rest}
                                  disabled={dialogue.completed || working}
                                  onClick={() =>
                                    Promise.resolve(setWorking(true))
                                      .then(() =>
                                        api.ipc.invoke(
                                          node.properties.dataIpcRoute as string,
                                          node.properties.dataPayload,
                                        ),
                                      )
                                      .then(() =>
                                        api.emails.updateDialogue({
                                          where: { id: dialogue.id },
                                          data: { completed: true },
                                        }),
                                      )
                                      .then((data) =>
                                        Promise.resolve(dispatch(emailsUpdate([data]))),
                                      )
                                      .then(() => setWorking(false))
                                  }
                                >
                                  {children}
                                </button>
                              );
                            },
                          }}
                        />
                      </footer>
                    </article>
                  ),
                );
            })()}
          {selected.length > 1 && (
            <article className="center h-full gap-5">
              <FaMailBulk className="size-24" />
              <p>{selected.length} conversations selected.</p>
            </article>
          )}
        </section>
      </main>
    </div>
  );
}
