/**
 * Renders application changelog.
 *
 * @module
 */
import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const [content, setContent] = React.useState<string>();

  React.useEffect(() => {
    fetch('resources://markdown/changelog.md')
      .then((response) => response.text())
      .then(setContent);
  }, []);

  return (
    <main className="prose max-w-none px-2">
      <ReactMarkdown
        components={{
          a(props) {
            return (
              <a
                href={props.href}
                onClick={(event) => {
                  event.preventDefault();
                  api.app.external(props.href);
                }}
              >
                {props.children}
              </a>
            );
          },
          h2(props) {
            return (
              <header className="heading prose -mx-2 max-w-none">
                <h2>{props.children}</h2>
              </header>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </main>
  );
}
