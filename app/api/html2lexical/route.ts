// app/api/html2lexical/route.ts
import { NextResponse } from "next/server";
import { createEditor, $getRoot, $createParagraphNode } from "lexical";
import { $generateNodesFromDOM } from "@lexical/html";
import { JSDOM } from "jsdom";
import { ParagraphNode, TextNode } from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { ImageNode } from "../../nodes/ImageNode";

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
      ImageNode,
    ],
  });

  editor.update(
    () => {
      const cleanHtml = html.replace(/<!--[\s\S]*?-->/g, "");
      const dom = new JSDOM(cleanHtml);
      const document = dom.window.document;
      // Reemplazar <img> por un nodo de imagen Lexical directamente en el DOM
      document.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src") || "";
        const alt = img.getAttribute("alt") || undefined;
        const width = img.getAttribute("width")
          ? Number(img.getAttribute("width"))
          : undefined;
        const height = img.getAttribute("height")
          ? Number(img.getAttribute("height"))
          : undefined;
        // Crear el nodo de imagen Lexical
        const imageNode = new ImageNode(src, alt, width, height);
        // Crear un párrafo y agregar el nodo de imagen como hijo
        const p = $createParagraphNode();
        p.append(imageNode);
        // Reemplazar el <img> en el DOM por un comentario para que $generateNodesFromDOM lo ignore
        img.replaceWith(document.createComment("lexical-image-node"));
        // Agregar el párrafo con la imagen al root
        p.setFormat("center");
        $getRoot().append(p);
      });
      // Procesar el resto del DOM normalmente
      const nodes = $generateNodesFromDOM(editor, document);
      const root = $getRoot();
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
