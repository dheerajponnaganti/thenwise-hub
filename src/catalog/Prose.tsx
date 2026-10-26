import Markdown from 'react-markdown'

/** Markdown as text. Raw HTML is never rendered (react-markdown shows it as plain text), links are checked, images become links. */
export function Prose({ text }: { text: string }) {
  return (
    <div className="prose">
      <Markdown
        components={{
          img: ({ alt, src }) => <span className="muted">[image: {alt || src}]</span>,
          a: ({ href, children }) => (/^(https?:|mailto:)/i.test(href ?? '') ? <a href={href} rel="noopener noreferrer nofollow" target="_blank">{children}</a> : <span>{children}</span>),
        }}
      >
        {text}
      </Markdown>
    </div>
  )
}
