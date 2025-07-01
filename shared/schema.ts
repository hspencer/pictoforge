import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, index, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (for authentication)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User management
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(), // From OAuth provider
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User spaces (workspaces/projects)
export const spaces = pgTable("spaces", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Pictogram libraries within spaces
export const pictogramLibraries = pgTable("pictogram_libraries", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").references(() => spaces.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#2E7D32"), // Theme color for the library
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Space collaborators
export const spaceCollaborators = pgTable("space_collaborators", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").references(() => spaces.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("viewer"), // owner, editor, viewer
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Instance-based tables (legacy for backward compatibility)
export const instances = pgTable("instances", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(), // e.g., "maori", "english", "spanish"
  name: text("name").notNull(), // e.g., "Māori", "English", "Spanish"
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pictograms = pgTable("pictograms", {
  id: serial("id").primaryKey(),
  libraryId: integer("library_id").references(() => pictogramLibraries.id).notNull(),
  instanceId: integer("instance_id").references(() => instances.id), // Legacy compatibility
  name: text("name").notNull(),
  svgCode: text("svg_code").notNull(),
  structure: jsonb("structure").notNull(), // SvgElement tree
  description: text("description"),
  tags: text("tags").array().default([]),
  prompt: text("prompt"), // Original AI prompt used to generate
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cssStyles = pgTable("css_styles", {
  id: serial("id").primaryKey(),
  instanceId: integer("instance_id").references(() => instances.id).notNull(),
  className: text("class_name").notNull(),
  styles: jsonb("styles").notNull(), // CSS properties as JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dictionary = pgTable("dictionary", {
  id: serial("id").primaryKey(),
  instanceId: integer("instance_id").references(() => instances.id).notNull(),
  word: text("word").notNull(),
  translation: text("translation").notNull(),
  pictogramId: integer("pictogram_id").references(() => pictograms.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Drizzle Relations
export const usersRelations = relations(users, ({ many }) => ({
  spaces: many(spaces),
  collaborations: many(spaceCollaborators),
}));

export const spacesRelations = relations(spaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [spaces.ownerId],
    references: [users.id],
  }),
  libraries: many(pictogramLibraries),
  collaborators: many(spaceCollaborators),
}));

export const pictogramLibrariesRelations = relations(pictogramLibraries, ({ one, many }) => ({
  space: one(spaces, {
    fields: [pictogramLibraries.spaceId],
    references: [spaces.id],
  }),
  pictograms: many(pictograms),
}));

export const pictogramsRelations = relations(pictograms, ({ one }) => ({
  library: one(pictogramLibraries, {
    fields: [pictograms.libraryId],
    references: [pictogramLibraries.id],
  }),
  instance: one(instances, {
    fields: [pictograms.instanceId],
    references: [instances.id],
  }),
}));

export const spaceCollaboratorsRelations = relations(spaceCollaborators, ({ one }) => ({
  space: one(spaces, {
    fields: [spaceCollaborators.spaceId],
    references: [spaces.id],
  }),
  user: one(users, {
    fields: [spaceCollaborators.userId],
    references: [users.id],
  }),
}));

export const instancesRelations = relations(instances, ({ many }) => ({
  pictograms: many(pictograms),
  cssStyles: many(cssStyles),
  dictionary: many(dictionary),
}));

export const cssStylesRelations = relations(cssStyles, ({ one }) => ({
  instance: one(instances, {
    fields: [cssStyles.instanceId],
    references: [instances.id],
  }),
}));

export const dictionaryRelations = relations(dictionary, ({ one }) => ({
  instance: one(instances, {
    fields: [dictionary.instanceId],
    references: [instances.id],
  }),
  pictogram: one(pictograms, {
    fields: [dictionary.pictogramId],
    references: [pictograms.id],
  }),
}));

// Insert schemas for new tables
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertSpaceSchema = createInsertSchema(spaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPictogramLibrarySchema = createInsertSchema(pictogramLibraries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSpaceCollaboratorSchema = createInsertSchema(spaceCollaborators).omit({
  id: true,
  createdAt: true,
});

// Updated insert schemas for existing tables
export const insertInstanceSchema = createInsertSchema(instances).omit({
  id: true,
  createdAt: true,
});

export const insertPictogramSchema = createInsertSchema(pictograms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCssStyleSchema = createInsertSchema(cssStyles).omit({
  id: true,
  createdAt: true,
});

export const insertDictionarySchema = createInsertSchema(dictionary).omit({
  id: true,
  createdAt: true,
});

// Types for new tables
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Space = typeof spaces.$inferSelect;
export type InsertSpace = z.infer<typeof insertSpaceSchema>;

export type PictogramLibrary = typeof pictogramLibraries.$inferSelect;
export type InsertPictogramLibrary = z.infer<typeof insertPictogramLibrarySchema>;

export type SpaceCollaborator = typeof spaceCollaborators.$inferSelect;
export type InsertSpaceCollaborator = z.infer<typeof insertSpaceCollaboratorSchema>;

// Updated types for existing tables
export type Instance = typeof instances.$inferSelect;
export type InsertInstance = z.infer<typeof insertInstanceSchema>;
export type Pictogram = typeof pictograms.$inferSelect;
export type InsertPictogram = z.infer<typeof insertPictogramSchema>;
export type CssStyle = typeof cssStyles.$inferSelect;
export type InsertCssStyle = z.infer<typeof insertCssStyleSchema>;
export type DictionaryEntry = typeof dictionary.$inferSelect;
export type InsertDictionaryEntry = z.infer<typeof insertDictionarySchema>;

// SVG Element types
export interface SvgElement {
  id: string;
  type: 'svg' | 'g' | 'circle' | 'rect' | 'path' | 'line' | 'polygon' | 'ellipse' | 'text' | 'defs' | 'style';
  attributes: Record<string, string>;
  children: SvgElement[];
  content?: string; // for text elements or style content
}

export interface SvgStructure {
  root: SvgElement;
  selectedElementId: string | null;
}
