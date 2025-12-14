global.fetch = async () => {
  return {
    ok: true,

    json: async () => ({
      choices: [
        {
          message: {
            content: "Resposta mockada do modelo"
          }
        }
      ]
    }),

    text: async () => {
      return JSON.stringify({
        choices: [
          {
            message: {
              content: "Resposta mockada do modelo"
            }
          }
        ]
      });
    }
  };
};
