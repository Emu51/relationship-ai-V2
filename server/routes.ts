import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { insertChatSchema, updateUserSchema } from "@shared/schema";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper function to create system prompt from personality traits
function createSystemPrompt() {
  return `You are Lily, an AI-powered relationship counselor with the following traits and capabilities:

1. Personality & Core Skills:
- Deep empathy and compassion for understanding others' feelings without judgment
- Active listening skills to fully acknowledge emotions
- Patient and tolerant, understanding that progress takes time
- High emotional intelligence for recognizing and managing emotions
- Non-judgmental attitude creating a safe space for sharing
- Strong analytical skills for understanding root causes
- Cultural sensitivity and open-mindedness
- Professional boundary setting while remaining warm and supportive
- Clear communication skills for complex ideas

2. Therapeutic Approach:
- Use a combination of cognitive behavioral therapy, humanistic therapy, and narrative therapy
- Focus on emotional regulation and mindfulness
- Help clients find meaning in their challenges
- Encourage self-reflection and personal growth
- Maintain a balance between empathy and practical guidance

When responding:
1. Always maintain professional boundaries while being warm and supportive
2. Use active listening techniques in your responses
3. Provide practical, actionable advice when appropriate
4. Be culturally sensitive and inclusive
5. Help clients explore their emotions and thoughts safely
6. Focus on positive growth while acknowledging challenges

Remember to maintain appropriate boundaries and provide constructive, empathetic guidance.`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Development only - Create test users
  if (process.env.NODE_ENV !== "production") {
    app.post("/api/dev/create-test-users", async (req, res) => {
      try {
        // First clean up any existing test users
        const existingDavid = await storage.getUserByUsername("david");
        const existingSarah = await storage.getUserByUsername("sarah");

        // Create first test user
        const user1 = await storage.createUser({
          username: "david",  // Simplified username
          password: await hashPassword("test123"),
          name: "David",
          gender: "male",
          profilePicture: null,
        });

        // Create second test user
        const user2 = await storage.createUser({
          username: "sarah",  // Simplified username
          password: await hashPassword("test123"),
          name: "Sarah",
          gender: "female",
          profilePicture: null,
        });

        res.json({ 
          message: "Test users created successfully", 
          credentials: [
            { username: "david", password: "test123" },
            { username: "sarah", password: "test123" }
          ]
        });
      } catch (error) {
        console.error('Test User Creation Error:', error);
        res.status(500).json({ error: "Failed to create test users" });
      }
    });
  }

  // Partner Connection
  app.post("/api/partner/connect", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { partnerId, partnerType } = updateUserSchema.parse(req.body);
    const currentUser = req.user!;

    if (currentUser.partnerId) {
      return res.status(400).send("Already in a relationship");
    }

    const partner = await storage.getUser(partnerId);
    if (!partner) {
      return res.status(404).send("Partner not found");
    }

    if (partner.partnerId) {
      return res.status(400).send("Partner already in a relationship");
    }

    await storage.updateUser(currentUser.id, { partnerId, partnerType });
    await storage.updateUser(partnerId, { 
      partnerId: currentUser.id,
      partnerType: partnerType === "husband" ? "wife" : 
                  partnerType === "wife" ? "husband" : "partner"
    });

    res.json(await storage.getUser(currentUser.id));
  });

  app.post("/api/partner/disconnect", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const currentUser = req.user!;
    if (!currentUser.partnerId) {
      return res.status(400).send("Not in a relationship");
    }

    const partnerId = currentUser.partnerId;
    await storage.updateUser(currentUser.id, { 
      partnerId: null, 
      partnerType: null,
      relationshipStatus: "single"
    });
    await storage.updateUser(partnerId, { 
      partnerId: null, 
      partnerType: null,
      relationshipStatus: "single"
    });

    res.json(await storage.getUser(currentUser.id));
  });

  // AI Chat
  app.post("/api/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { message } = insertChatSchema.parse(req.body);

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: createSystemPrompt()
          },
          { role: "user", content: message }
        ],
      });

      const chat = await storage.createChat({
        userId: req.user!.id,
        message,
        response: completion.choices[0].message.content || "I apologize, but I couldn't generate a response at this time."
      });

      res.json(chat);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      res.status(500).json({ 
        error: "Failed to get AI response",
        details: process.env.NODE_ENV === "development" ? error.message : undefined 
      });
    }
  });

  // Get chat history
  app.get("/api/chats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const chats = await storage.getUserChats(req.user!.id);
      res.json(chats);
    } catch (error) {
      console.error('Chat History Error:', error);
      res.status(500).json({ error: "Failed to fetch chat history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}