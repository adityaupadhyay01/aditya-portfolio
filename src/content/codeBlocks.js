/* ============================================================
   CODE BACKDROP - the page writes itself
   One era per chapter. Lines starting with //, <!-- or "$ " are
   styled as comments automatically. An empty string is a blank line.
============================================================ */
export const CODE_BLOCKS = [
  {
    "chapter": "ch1",
    "caption": "2015 - notepad.exe",
    "lines": [
      "<!-- MY WEBSITE -->",
      "<html>",
      "<head>",
      "<title>my page</title>",
      "</head>",
      "<body bgcolor=\"#000000\">",
      "<center>",
      "<marquee>",
      "<font color=\"red\" size=\"7\">",
      "WELCOME TO MY SITE",
      "</font>",
      "</marquee>",
      "<table border=\"1\" width=\"100%\">",
      "<tr><td><b>about me</b><br>",
      "i am learning html",
      "</td></tr>",
      "</table>",
      "</center>",
      "</body>"
    ]
  },
  {
    "chapter": "ch2",
    "caption": "first script tag",
    "lines": [
      "<script>",
      "",
      "alert(\"hello world\");",
      "",
      "document.write(\"<h1>it works</h1>\");",
      "",
      "// why does this not work ??",
      "var name = prompt(\"your name\");",
      "",
      "if (name = \"adi\") {",
      "  alert(\"hi adi\");",
      "}",
      "",
      "// it always says hi adi",
      "// even when i type something else",
      "",
      "</script>"
    ]
  },
  {
    "chapter": "ch3",
    "caption": "the jquery years",
    "lines": [
      "$(document).ready(function() {",
      "",
      "  $('#btn').click(function() {",
      "",
      "    $.ajax({",
      "      url: 'data.php',",
      "      type: 'POST',",
      "      success: function(data) {",
      "        $('#out').html(data);",
      "      },",
      "      error: function() {",
      "        alert('something went wrong');",
      "      }",
      "    });",
      "",
      "  });",
      "",
      "});"
    ]
  },
  {
    "chapter": "ch4",
    "caption": "shipping things",
    "lines": [
      "function getUser(id, cb) {",
      "  fetch('/api/user/' + id)",
      "    .then(function(r) { return r.json(); })",
      "    .then(function(user) {",
      "",
      "      getPosts(user.id, function(posts) {",
      "        getComments(posts[0].id, function(c) {",
      "",
      "          cb(user, posts, c);",
      "",
      "        });",
      "      });",
      "",
      "    });",
      "}",
      "",
      "// it works. don't touch it."
    ]
  },
  {
    "chapter": "ch5",
    "caption": "the one that died",
    "lines": [
      "<<<<<<< HEAD",
      "  const config = loadConfig();",
      "=======",
      "  const config = require('./config');",
      ">>>>>>> main",
      "",
      "// TODO: fix this",
      "// TODO: come back to this",
      "// TODO:",
      "",
      "function deploy() {",
      "  throw new Error('not implemented');",
      "}",
      "",
      "// gave up here - 3am"
    ]
  },
  {
    "chapter": "ch6",
    "caption": "starting over",
    "lines": [
      "$ npm create vite@latest",
      "$ cd my-app && npm install",
      "",
      "import { useState } from 'react';",
      "",
      "export default function App() {",
      "",
      "  const [ready, setReady] = useState(false);",
      "",
      "  return (",
      "    <main>",
      "      {ready ? <Dashboard /> : <Loader />}",
      "    </main>",
      "  );",
      "}"
    ]
  },
  {
    "chapter": "ch7",
    "caption": "today",
    "lines": [
      "interface Project {",
      "  id: string;",
      "  title: string;",
      "  stack: readonly string[];",
      "}",
      "",
      "export async function getProjects(): Promise<Project[]> {",
      "",
      "  const res = await fetch('/api/projects');",
      "",
      "  if (!res.ok) {",
      "    throw new ApiError(res.status, res.statusText);",
      "  }",
      "",
      "  return ProjectSchema.array().parse(await res.json());",
      "}"
    ]
  }
];

export const isCommentLine = l => {
  const t = l.trim();
  return t.startsWith('//') || t.startsWith('<!--') || t.startsWith('$ ');
};
