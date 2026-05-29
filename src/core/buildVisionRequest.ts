export function buildVisionRequest(input: { model: string; prompt: string; dataUrl: string }): unknown {
  return {
    model: input.model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: input.prompt },
          { type: "image_url", image_url: { url: input.dataUrl } }
        ]
      }
    ],
    temperature: 0
  };
}

