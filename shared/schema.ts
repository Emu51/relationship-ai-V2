import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  gender: text("gender").notNull(),
  profilePicture: text("profile_picture"),
  relationshipStatus: text("relationship_status").default("single"),
  partnerId: integer("partner_id").references(() => users.id),
  partnerType: text("partner_type"), // husband/wife/partner etc
  twoFactorSecret: text("two_factor_secret"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
});

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Create a login schema that accepts either username or email
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username too long"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username too long"),
  password: z.string().min(6, "Password must be at least 6 characters"),
}).pick({
  username: true,
  password: true,
  name: true,
  gender: true,
  profilePicture: true,
});

export const updateUserSchema = createInsertSchema(users).pick({
  name: true,
  gender: true,
  profilePicture: true,
  relationshipStatus: true,
  partnerId: true,
  partnerType: true,
  twoFactorSecret: true,
  twoFactorEnabled: true,
});

export const insertChatSchema = createInsertSchema(chats).pick({
  message: true,
});

export const verifyOtpSchema = z.object({
  token: z.string().min(6).max(6),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type User = typeof users.$inferSelect;
export type Chat = typeof chats.$inferSelect;