export const maxDuration = 30;

export const POST = async (request: Request) => {
  const { messages, model } = await request.json();
  // Forward the request to our Mastra backend
  const mastraUrl = process.env.MASTRA_BACKEND_URL || "http://localhost:4111";

  try {
    const response = await fetch(`${mastraUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        model,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mastra backend responded with ${response.status}`);
    }

    // Stream the response back to the client
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error connecting to Mastra backend:", error);
    return new Response(
      JSON.stringify({ error: "Failed to connect to Mastra backend" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
