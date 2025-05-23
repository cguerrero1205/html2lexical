// app/api/html2lexical/route.ts
import { NextResponse } from "next/server";
import { createEditor, $getRoot } from "lexical";
import { $generateNodesFromDOM } from "@lexical/html";
import { JSDOM } from "jsdom";
import { ParagraphNode, TextNode } from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";


function convertHtmlToLexicalJSON(html: string) {
  const editor = createEditor({
    namespace: "my-editor",
    nodes: [
      ParagraphNode,
      TextNode,
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      LinkNode,
      TableNode,
      TableCellNode,
      TableRowNode,
    ],
  });

  editor.update(
    () => {
      const cleanHtml = html.replace(/<!--[\s\S]*?-->/g, "");
      const dom = new JSDOM(cleanHtml);
      const document = dom.window.document;
      const nodes = $generateNodesFromDOM(editor, document);
      const root = $getRoot();
      root.clear();
      root.append(...nodes);
    },
    { discrete: true }
  );

  return editor.getEditorState().toJSON();
}

export async function POST(req: Request) {
  try {
    const { html } = await req.json();
    if (typeof html !== "string" || html.trim() === "") {
      return NextResponse.json(
        { error: 'El campo "html" es requerido y debe ser un string.' },
        { status: 400 }
      );
    }

    const lexicalJson = convertHtmlToLexicalJSON(html);
    return NextResponse.json({ editorState: lexicalJson });
  } catch (error) {
    console.error("Error al convertir HTML a Lexical JSON:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
