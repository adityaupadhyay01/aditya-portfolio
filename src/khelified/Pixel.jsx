/* Pixel art from rows of text. With no palette, 'X' is a lit cell in
   currentColor; with one, each letter maps to a colour. Drawn as SVG rects
   with crispEdges so it stays hard-edged at any size. All art on this page
   is original and made this way. */
export default function Pixel({ rows, size = 6, palette, className, title }) {
  const w = Math.max(...rows.map(r => r.length));
  const cells = [];
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    const fill = palette ? palette[c] : (c === 'X' ? 'currentColor' : null);
    /* 1.02: a hair of overlap, or scaled cells show seams between them */
    if (fill) cells.push(<rect key={x + '-' + y} x={x} y={y} width="1.02" height="1.02" fill={fill} />);
  }));
  return (
    <svg className={className} viewBox={`0 0 ${w} ${rows.length}`}
         width={size ? w * size : undefined} height={size ? rows.length * size : undefined}
         shapeRendering="crispEdges"
         role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {cells}
    </svg>
  );
}

export const ART = {
  lt: ['...X', '..X.', '.X..', 'X...', '.X..', '..X.', '...X'],
  slash: ['....X', '....X', '...X.', '..X..', '.X...', 'X....', 'X....'],
  gt: ['X...', '.X..', '..X.', '...X', '..X.', '.X..', 'X...'],
  heart: ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'],
  play: ['X....', 'XXX..', 'XXXXX', 'XXX..', 'X....'],
  /* dock icons */
  book: ['XXXX.XXXX', 'X..XXX..X', 'X..XXX..X', 'X..XXX..X', 'X..XXX..X', 'XXXXXXXXX', '....X....'],
  door: ['XXXXXXX', 'X.....X', 'X.....X', 'X...X.X', 'X.....X', 'X.....X', 'XXXXXXX'],
  mail: ['XXXXXXXXX', 'XX.....XX', 'X.X...X.X', 'X..X.X..X', 'X...X...X', 'X.......X', 'XXXXXXXXX'],
  /* section-rail marker: a little lander */
  ship: ['..X..', '.XXX.', 'XXXXX', 'XX.XX', 'X...X'],
};

/* An original pixel bust, shown until public/avatar.png exists. It is not
   a likeness of anyone - replace it with your own art when you have it. */
export const BUST = {
  palette: { H: '#2a1d14', S: '#c98d62', D: '#a86f48', E: '#121212', W: '#ffffff', M: '#7a2e2e', K: '#2b2b33', C: '#ceff00' },
  rows: [
    '....HHHHHHHH....',
    '...HHHHHHHHHH...',
    '..HHHHHHHHHHHH..',
    '..HHHSSSSSSHHH..',
    '..HHSSSSSSSSHH..',
    '..HSSSSSSSSSSH..',
    '.DSSEESSSSEESSD.',
    '.DSSEWSSSSEWSSD.',
    '..SSSSSDDSSSSS..',
    '..SSSSSSSSSSSS..',
    '..SSSMWWWWMSSS..',
    '...SSSMMMMSSS...',
    '....SSSSSSSS....',
    '.....DSSSSD.....',
    '..KKKKDSSDKKKK..',
    '.KKKKCKKKKCKKKK.',
    'KKKKKCKKKKCKKKKK',
    'KKKKKKKKKKKKKKKK',
  ],
};
