/**
 * Inbox route showing user e-mails.
 *
 * @module
 */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { format } from 'date-fns';
import { Constants, Dedent } from '@liga/shared';
import { cx } from '@liga/frontend/lib';
import { AppStateContext } from '@liga/frontend/redux';
import { emailsDelete, emailsUpdate } from '@liga/frontend/redux/actions';
import { useTranslation } from '@liga/frontend/hooks';
import { FaBorderNone, FaEnvelopeOpen, FaMailBulk, FaTrash } from 'react-icons/fa';

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const t = useTranslation('windows');
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
          {t('main.inbox.selectAll')}
        </button>
        <button
          disabled={!selected.length}
          onClick={() =>
            api.emails.delete(selected).then(() => {
              dispatch(emailsDelete(state.emails.filter((email) => selected.includes(email.id))));
              const [next] = state.emails.filter((email) => !selected.includes(email.id));
              setSelected(next ? [next.id] : []);
            })
          }
        >
          <FaTrash />
          {t('shared.delete')}
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
          {t('main.inbox.markAsRead')}
        </button>
      </header>
      <main>
        <section className="divide-base-content/10 divide-y">
          {!state.emails.length && (
            <article className="center h-full">
              <p>{t('main.inbox.noDataSidebar')}</p>
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
                <p className="font-bold">{email.from.name}</p>
                <p>{email.subject}</p>
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
              <FaEnvelopeOpen className="text-muted size-24" />
              <p>{t('main.inbox.noData')}</p>
            </article>
          )}
          {!!selected &&
            selected.length === 1 &&
            (() => {
              const email = state.emails.find((email) => email.id === selected[0]);
              return email.dialogues
                .sort((a, b) => b.id - a.id)
                .map((dialogue) =>
                  /^(accepted|rejected)/gi.test(dialogue.content) ? (
                    <article
                      key={`${email.id}__email__${dialogue.id}`}
                      className="divider before:bg-base-content/10 after:bg-base-content/10 before:h-px after:h-px"
                    >
                      <em>{dialogue.content}</em>
                    </article>
                  ) : (
                    <article
                      key={`${email.id}__email__${dialogue.id}`}
                      className="divide-base-content/10 bg-base-200 divide-y px-5"
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
                        >
                          {Dedent.dedent(dialogue.content)}
                        </ReactMarkdown>
                      </footer>
                    </article>
                  ),
                );
            })()}
          {selected.length > 1 && (
            <article className="center h-full gap-5">
              <FaMailBulk className="text-muted size-24" />
              <p>
                {selected.length} {t('main.inbox.selection')}
              </p>
            </article>
          )}
        </section>
      </main>
    </div>
  );
}
