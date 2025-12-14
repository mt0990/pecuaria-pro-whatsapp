export default class OpenAI {
    chat = {
        completions: {
            create: async () => ({
                choices: [{ message: { content: "Resposta GPT MOCK" } }]
            })
        }
    };
}
