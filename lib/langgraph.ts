// this file is for all AI functions
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { MessagesAnnotation } from "@langchain/langgraph";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  trimMessages,
} from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { MessagesPlaceholder } from "@langchain/core/prompts";
import SYSTEM_MESSAGE from "@/constants/systemMessage";
import { ChatAnthropic } from "@langchain/anthropic";

//Customers at: https://introspection.apis.stepzen.com/customers
//Comments at: https://dummyjson.com/comments

// Trimmer function for managing conversation history
const trimmer = trimMessages({
  maxTokens: 2048, // Reduced for cost efficiency
  strategy: "last",
  tokenCounter: (msgs) => msgs.length,
  includeSystem: true,
  allowPartial: true,
  startOn: "human",
});

// Initialize the AI model with tools
const initializeModel = () => {
  // Initialize Anthropic's Claude
  const model = new ChatAnthropic({
    modelName: "claude-3-haiku-20240307", // Using Haiku model for better cost efficiency
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0.7,
    maxTokens: 1024, // Reduced for cost efficiency
  });

  // Create a wrapper for the model to match the expected interface
  const wrappedModel = {
    invoke: async (messages: BaseMessage[]) => {
      try {
        // If no messages, return welcome message
        if (messages.length === 0) {
          return new AIMessage("Hello! I'm Intellecta, your AI assistant. I'm here to help with any questions or tasks you have. What would you like to discuss?");
        }

        // Filter out any messages with empty content
        let processedMessages = messages.filter(msg => {
          const content = msg.content;
          return content &&
            (typeof content === 'string' ? content.trim().length > 0 : true);
        });

        // If all messages were filtered out, add default messages
        if (processedMessages.length === 0) {
          processedMessages = [
            new SystemMessage(SYSTEM_MESSAGE),
            new HumanMessage("Hello")
          ];
        }

        // Check if first message is system message
        const hasSystemMessage = processedMessages[0]?.getType() === "system";

        // If no system message, add it at the beginning
        if (!hasSystemMessage) {
          processedMessages = [
            new SystemMessage(SYSTEM_MESSAGE),
            ...processedMessages
          ];
        }

        // If first message after system is not human, add a default hello message
        if (processedMessages[1]?.getType() !== "human") {
          processedMessages = [
            processedMessages[0], // Keep system message
            new HumanMessage("Hello"),
            ...processedMessages.slice(1)
          ];
        }

        // Ensure all messages have non-empty content
        processedMessages = processedMessages.map(msg => {
          if (!msg.content || (typeof msg.content === 'string' && !msg.content.trim())) {
            if (msg instanceof HumanMessage) {
              return new HumanMessage("Hello");
            } else if (msg instanceof AIMessage) {
              return new AIMessage("I understand.");
            }
          }
          return msg;
        });

        // Trim messages to reduce token usage
        const trimmedMessages = await trimmer.invoke(processedMessages);
        const response = await model.invoke(trimmedMessages);

        // Ensure the response is a single message with string content
        if (response instanceof AIMessage) {
          const content = response.content;
          if (Array.isArray(content)) {
            // If content is an array, join all text parts
            const textContent = content
              .filter(item => typeof item === 'string')
              .join(' ');
            return new AIMessage(textContent);
          } else if (typeof content === 'string') {
            return response;
          }
        }

        // If we can't process the response properly, return a default message
        return new AIMessage("I apologize, but I'm having trouble processing that request. Could you please try again?");
      } catch (error) {
        console.error("Error in Claude model:", error);
        throw error;
      }
    },
  };

  return wrappedModel;
};

// Create the workflow for processing messages
const createWorkflow = () => {
  // Initialize tools (empty for now, but can be extended)
  const model = initializeModel();

  // Create the prompt template
  const promptTemplate = ChatPromptTemplate.fromMessages([
    new SystemMessage(SYSTEM_MESSAGE),
    new MessagesPlaceholder("messages"),
  ]);

  // Define the workflow state transitions
  const shouldContinue = (state: typeof MessagesAnnotation.State) => {
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;

    if (!lastMessage) {
      return "end";
    }

    const toolCalls = lastMessage.additional_kwargs?.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      return "tools";
    }

    if (lastMessage.content && lastMessage.getType() === "tool") {
      return "agent";
    }

    return "end";
  };

  // Create and configure the workflow
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", async (state: typeof MessagesAnnotation.State) => {
      try {
        const trimmedMessages = await trimmer.invoke(state.messages);
        const prompt = await promptTemplate.formatMessages({
          messages: trimmedMessages,
        });
        const response = await model.invoke(prompt);
        return { messages: [response] };
      } catch (error) {
        console.error("Error in agent node:", error);
        throw error;
      }
    })
    .addEdge(START, "agent")
    .addNode("tools", new ToolNode([]))
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tools", "agent");

  return workflow;
};

// Submit a question to the workflow
export async function submitQuestion(messages: BaseMessage[], chatId: string) {
  try {
    const workflow = createWorkflow();
    const checkpointer = new MemorySaver();
    const app = workflow.compile({ checkpointer });

    console.log("Starting chat with ID:", chatId);
    console.log("Initial messages:", messages);

    // Ensure we have a valid thread ID
    if (!chatId) {
      throw new Error("Chat ID is required");
    }

    const stream = await app.streamEvents(
      { messages },
      {
        version: "v2",
        configurable: {
          thread_id: chatId,
        },
        streamMode: "values", // Changed from "messages" to "values" for token-by-token streaming
        runId: chatId,
      }
    );

    return stream;
  } catch (error) {
    console.error("Error in submitQuestion:", error);
    throw error;
  }
}

export { createWorkflow, initializeModel };
