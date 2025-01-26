/**
 * Knowledgebase entry on downloading the CS:GO SDK.
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
    fetch('resources://markdown/cs2/cs2.md')
      .then((response) => response.text())
      .then(setContent);
  }, []);

  return (
    <main className="prose max-w-none p-2">
      <ReactMarkdown children={content} />
    </main>
  );
}
