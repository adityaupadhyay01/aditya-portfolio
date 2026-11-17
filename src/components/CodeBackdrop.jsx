import { CODE_BLOCKS, isCommentLine } from '../content/codeBlocks.js';

/* The page writes itself: one era of code per chapter, faded behind the
   story. The engine decides which block is visible. */
export default function CodeBackdrop() {
  return (
    <div id="codebg" aria-hidden="true">
      <div className="code-pane">
        {CODE_BLOCKS.map(block => (
          <pre key={block.chapter} className="code-block" data-for={block.chapter} data-caption={block.caption}>
            {block.lines.map((line, i) => (
              <span key={i} className={isCommentLine(line) ? 'l c' : 'l'}>
                {line || ' '}
                {i === block.lines.length - 1 && <span className="code-cursor" />}
              </span>
            ))}
          </pre>
        ))}
      </div>
    </div>
  );
}
