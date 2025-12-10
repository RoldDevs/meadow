/**
 * OpenRouter AI Service
 * Handles all AI-related API calls using OpenRouter
 */

const OPENROUTER_API_KEY = "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";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemma-3n-e2b-it:free";

/**
 * Send a request to OpenRouter API
 * @param {string} prompt - The user's prompt
 * @param {Function} onChunk - Optional callback for streaming responses
 * @returns {Promise<string>} - The complete response text
 */
export const callOpenRouter = async (prompt, onChunk = null) => {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://github.com/your-repo", // Optional: for analytics
        "X-Title": "Meadow App", // Optional: for analytics
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: onChunk !== null, // Stream if callback provided
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `API request failed: ${response.status}`
      );
    }

    // Handle streaming response
    if (onChunk) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                onChunk(content);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      return fullText;
    }

    // Handle non-streaming response
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("OpenRouter API Error:", error);
    throw error;
  }
};

/**
 * Summarize a note
 */
export const summarizeNote = async (noteContent) => {
  const prompt = `Please provide a concise summary of the following note:\n\n${noteContent}`;
  return await callOpenRouter(prompt);
};

/**
 * Create a short summary
 */
export const createShortSummary = async (noteContent) => {
  const prompt = `Create a very brief, one or two sentence summary of the following note:\n\n${noteContent}`;
  return await callOpenRouter(prompt);
};

/**
 * Generate bullet-point summary
 */
export const generateBulletPoints = async (noteContent) => {
  const prompt = `Convert the following note into a bullet-point summary. Use clear, concise bullet points:\n\n${noteContent}`;
  return await callOpenRouter(prompt);
};

/**
 * Extract key take-aways
 */
export const extractKeyTakeaways = async (noteContent) => {
  const prompt = `Extract the key take-aways from the following note. List them clearly:\n\n${noteContent}`;
  return await callOpenRouter(prompt);
};

/**
 * Expand a note
 */
export const expandNote = async (noteContent) => {
  const prompt = `Expand the following brief note into a detailed, well-structured paragraph. Add relevant details and explanations:\n\n${noteContent}`;
  return await callOpenRouter(prompt);
};

/**
 * Make note more casual
 */
export const makeNoteCasual = async (noteContent) => {
  const prompt = `Rewrite the following note in a more casual, conversational tone:\n\n${noteContent}`;
  return await callOpenRouter(prompt);
};

/**
 * Make note more formal
 */
export const makeNoteFormal = async (noteContent) => {
  const prompt = `Rewrite the following note in a more formal, professional tone:\n\n${noteContent}`;
  return await callOpenRouter(prompt);
};

/**
 * Make note more professional
 */
export const makeNoteProfessional = async (noteContent) => {
  const prompt = `Rewrite the following note in a more professional, business-appropriate tone:\n\n${noteContent}`;
  return await callOpenRouter(prompt);
};

/**
 * Fix grammar and spelling
 */
export const fixGrammar = async (noteContent) => {
  const prompt = `Fix all grammar and spelling errors in the following note. Return only the corrected text:\n\n${noteContent}`;
  return await callOpenRouter(prompt);
};

/**
 * Reorganize the flow of the note
 */
export const reorganizeNote = async (noteContent) => {
  const prompt = `Reorganize the following note to improve its flow and structure. Make it more logical and easier to read:\n\n${noteContent}`;
  return await callOpenRouter(prompt);
};

/**
 * Generate subtasks for a task
 * @param {string} taskTitle - The task title
 * @param {Array} existingSubtasks - Existing subtasks (optional)
 * @returns {Promise<Array>} - Array of subtask objects (max 5)
 */
export const generateSubtasks = async (taskTitle, existingSubtasks = []) => {
  const context = existingSubtasks.length > 0
    ? `Existing subtasks: ${existingSubtasks.map(s => s.title).join(", ")}\n\n`
    : "";
  
  const prompt = `${context}Generate exactly 5 subtasks for the following task: "${taskTitle}". 
Return the subtasks as a simple list, one per line. Do not include numbers or bullet points, just the subtask text. Generate ONLY 5 subtasks.`;

  try {
    const response = await callOpenRouter(prompt);
    // Parse the response into subtask objects
    const subtaskLines = response
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.match(/^\d+[\.\)]/)) // Remove numbered items
      .map((line) => line.replace(/^[-•*]\s*/, "")) // Remove bullet points
      .filter((line) => line.length > 0)
      .slice(0, 5); // Ensure max 5 subtasks

    return subtaskLines.map((title, index) => ({
      id: `subtask-${Date.now()}-${index}`,
      title: title.trim(),
      completed: false,
      subtasks: [],
    }));
  } catch (error) {
    console.error("Error generating subtasks:", error);
    throw error;
  }
};

/**
 * Generate nested subtasks (second level subtasks from first level)
 * @param {string} parentSubtaskTitle - The parent subtask title
 * @returns {Promise<Array>} - Array of nested subtask objects (max 5)
 */
export const generateNestedSubtasks = async (parentSubtaskTitle) => {
  const prompt = `Generate exactly 5 detailed subtasks for: "${parentSubtaskTitle}". 
Return the subtasks as a simple list, one per line. Do not include numbers or bullet points, just the subtask text. Generate ONLY 5 subtasks.`;

  try {
    const response = await callOpenRouter(prompt);
    const subtaskLines = response
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.match(/^\d+[\.\)]/))
      .map((line) => line.replace(/^[-•*]\s*/, ""))
      .filter((line) => line.length > 0)
      .slice(0, 5); // Ensure max 5 subtasks

    return subtaskLines.map((title, index) => ({
      id: `subtask-${Date.now()}-${index}`,
      title: title.trim(),
      completed: false,
      subtasks: [],
    }));
  } catch (error) {
    console.error("Error generating nested subtasks:", error);
    throw error;
  }
};

