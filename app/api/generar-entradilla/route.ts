import { NextRequest, NextResponse } from 'next/server';
import { createEditor, $getRoot } from 'lexical';

import { ParagraphNode, TextNode } from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { ImageNode } from "../../nodes/ImageNode";
import IARequestHandler from '@/app/lib/IARequestHandler';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const systemInstruction = body.systemInstruction;
        const lexicalState = JSON.parse(JSON.stringify(body.lexical.editorState || body.lexical));

        // Verificar si lexicalState está definido
        if (!lexicalState) {
            return NextResponse.json({ error: 'Missing lexicalState' }, { status: 400 });
        }

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

        let plainText = '';
        editor.setEditorState(editor.parseEditorState(lexicalState));
        editor.update(() => {
            plainText = $getRoot().getTextContent();
        });

        plainText = plainText.replace(/\n/g, '').replace(/"/g, "'");

        let respuesta = '';
        const ia = IARequestHandler({
            apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent',
            provider: 'gemini',
            onResult: (result) => {
                respuesta = result.replace(/\n/g, '').replace(/"/g, "'");
            }
        });

        await ia.sendRequest(systemInstruction, plainText);

        return NextResponse.json({ plainText, respuesta }, { status: 200 });

    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
