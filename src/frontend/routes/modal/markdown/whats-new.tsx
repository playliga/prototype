/**
 * Renders the What's New modal.
 *
 * @module
 */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const [content, setContent] = React.useState<string>();

  React.useEffect(() => {
    fetch('resources://markdown/whats-new/whats-new.md')
      .then((response) => response.text())
      .then(setContent);
  }, []);

  return (
    <main className="prose max-w-none px-2">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw] as Parameters<typeof ReactMarkdown>[number]['remarkPlugins']}
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
          h1(props) {
            return (
              <header className="heading prose -mx-2 max-w-none">
                <h1>{props.children}</h1>
              </header>
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
