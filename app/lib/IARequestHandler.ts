// IARequestHandler.ts
type IARequestHandlerProps = {
    apiUrl: string;
    provider?: 'openai' | 'gemini' | 'deepseek';
    onResult: (result: string) => void;
};
const IA_API_KEY = process.env.NEXT_PUBLIC_IA_API_KEY || "";

const IARequestHandler = ({ apiUrl, provider = 'openai', onResult }: IARequestHandlerProps) => {
    const apiKey = IA_API_KEY;
    const sendRequest = async (systemInstruction : string, prompt: string) => {
        console.log('systemInstruction:', systemInstruction);
        
        console.log('prompt:', prompt);
        try {
            let responseText = '';
            switch (provider) {
                case 'openai':
                    const res = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({
                            model: 'gpt-3.5-turbo',
                            messages: [{ role: 'user', content: prompt }]
                        })
                    });
                    const data = await res.json();
                    responseText = data.choices?.[0]?.message?.content || '';
                    break;

                case 'gemini':
                    const geminiRes = await fetch(`${apiUrl}?key=${apiKey}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            contents: [
                                {
                                    role: 'user',
                                    parts: [{ text: prompt }]
                                },
                            ],
                            generationConfig: {
                                temperature: 0.7,
                                topK: 40,
                                topP: 0.95,
                                maxOutputTokens: 60,
                            },
                            systemInstruction: {
                                role: 'user',
                                parts: [{ text: systemInstruction }]
                            },
                        })
                    });

                    const geminiData = await geminiRes.json();

                    if (geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
                        responseText = geminiData.candidates[0].content.parts[0].text;
                    } else {
                        console.warn('No se recibió respuesta válida de Gemini', geminiData);
                    }
                    break;

                case 'deepseek':
                    // Implementación similar adaptada a DeepSeek
                    break;
            }

            onResult(responseText);
        } catch (err) {
            console.error('Error al conectar con la IA:', err);
        } finally {

        }
    };

    return { sendRequest };
};

export default IARequestHandler;
