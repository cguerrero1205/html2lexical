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

      // Array para almacenar las imágenes y sus posiciones
      const imageReplacements: Array<{
        placeholder: string;
        node: ImageNode;
      }> = [];

      // Procesar imágenes manteniendo su posición
      document.querySelectorAll("figure img, img, p.ql-align-justify img, p img").forEach((img) => {
        if (!img) return;

        const src = img.getAttribute("src") || "";
        const alt = img.getAttribute("alt") || undefined;
        const width = img.getAttribute("width")
          ? Number(img.getAttribute("width"))
          : undefined;
        const height = img.getAttribute("height")
          ? Number(img.getAttribute("height"))
          : undefined;

        // Determinar el elemento contenedor (figure o párrafo)
        const container = img.closest("figure") || img.closest("p") || img;
        
        // Procesar caption si existe
        const figcaption = container.querySelector("figcaption");
        const showCaption = !!figcaption;
        const caption = showCaption ? {
          editorState: {
            root: {
              children: [
                {
                  children: [
                    {
                      detail: 0,
                      format: 0,
                      mode: "normal",
                      style: "",
                      text: figcaption.textContent || "",
                      type: "text",
                      version: 1
                    }
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                  textFormat: 0,
                  textStyle: ""
                }
              ],
              direction: "ltr",
              format: "",
              indent: 0,
              type: "root",
              version: 1
            }
          }
        } : undefined;

        // Crear un marcador de posición único
        const placeholder = `<!--IMG-${Math.random().toString(36).substring(2)}-->`;
        
        // Almacenar la información de la imagen
        imageReplacements.push({
          placeholder,
          node: new ImageNode(
            src,
            alt,
            width,
            height,
            undefined,
            300,
            showCaption,
            caption
          )
        });

        // Reemplazar el elemento contenedor con el marcador
        container.replaceWith(document.createTextNode(placeholder));
      });

      // Generar nodos del DOM
      const nodes = $generateNodesFromDOM(editor, document);
      const root = $getRoot();
      root.clear();

      // Procesar los nodos y reemplazar los marcadores con nodos de imagen
      function processNodes(nodes: Array<any>) {
        const processedNodes = [];
        
        for (const node of nodes) {
          if (node.getType() === 'text') {
            const textContent = node.getTextContent();
            let currentText = textContent;
            let currentPosition = 0;
            
            // Buscar todos los marcadores en el texto
            for (const {placeholder, node: imageNode} of imageReplacements) {
              const index = currentText.indexOf(placeholder, currentPosition);
              if (index !== -1) {
                // Crear nodo de párrafo para la imagen
                const imageParagraph = $createParagraphNode();
                imageParagraph.append(imageNode);
                imageParagraph.setFormat("center");
                processedNodes.push(imageParagraph);
                currentPosition = index + placeholder.length;
              }
            }
          } else {
            processedNodes.push(node);
          }
        }
        
        return processedNodes;
      }

      // Aplicar los nodos procesados
      const processedNodes = processNodes(nodes);
      root.append(...processedNodes);
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
