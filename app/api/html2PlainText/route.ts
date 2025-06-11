import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";

export async function POST(request: Request) {
    try {
        const { html } = await request.json();

        if (!html || typeof html !== 'string') {
            return NextResponse.json(
                { error: 'Se requiere un HTML válido' },
                { status: 400 }
            );
        }

        // Limpiar comentarios HTML
        const cleanHtml = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<br\s*\/?>/gi, ". ");

        // Crear DOM y extraer texto
        const dom = new JSDOM(cleanHtml);
        const document = dom.window.document;

        // Obtener el texto plano
        const plainText = document.body.textContent || "";

        // Limpiar espacios extra y líneas en blanco
        const formattedText = plainText
            .replace(/\s+/g, ' ')
            .replace(/^\s+|\s+$/g, '')
            .replace(/\.\./g, '.');

        return NextResponse.json({ text: formattedText });
    } catch (error) {
        console.error('Error al convertir HTML a texto:', error);
        return NextResponse.json(
            { error: 'Error al procesar el HTML' },
            { status: 500 }
        );
    }
}