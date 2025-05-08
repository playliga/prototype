/**
 * Knowledgebase entry on enabling CS:GO Legacy version.
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
    fetch('resources://markdown/csgo/csgo.md')
      .then((response) => response.text())
      .then(setContent);
  }, []);

  return (
    <main className="prose max-w-none p-2">
      <ReactMarkdown>{content}</ReactMarkdown>
    </main>
  );
}
