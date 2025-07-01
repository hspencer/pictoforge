import {
  users,
  spaces,
  pictogramLibraries,
  pictograms,
  spaceCollaborators,
  instances,
  cssStyles,
  dictionary,
  type User,
  type UpsertUser,
  type Space,
  type InsertSpace,
  type PictogramLibrary,
  type InsertPictogramLibrary,
  type Pictogram,
  type InsertPictogram,
  type SpaceCollaborator,
  type InsertSpaceCollaborator,
  type Instance,
  type InsertInstance,
  type CssStyle,
  type InsertCssStyle,
  type DictionaryEntry,
  type InsertDictionaryEntry,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (required for authentication)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Space operations
  createSpace(space: InsertSpace): Promise<Space>;
  getSpace(id: number): Promise<Space | undefined>;
  getUserSpaces(userId: string): Promise<Space[]>;
  updateSpace(id: number, updates: Partial<InsertSpace>): Promise<Space>;
  deleteSpace(id: number): Promise<boolean>;
  
  // Pictogram Library operations
  createPictogramLibrary(library: InsertPictogramLibrary): Promise<PictogramLibrary>;
  getPictogramLibrary(id: number): Promise<PictogramLibrary | undefined>;
  getSpaceLibraries(spaceId: number): Promise<PictogramLibrary[]>;
  updatePictogramLibrary(id: number, updates: Partial<InsertPictogramLibrary>): Promise<PictogramLibrary>;
  deletePictogramLibrary(id: number): Promise<boolean>;
  
  // Pictogram operations
  createPictogram(pictogram: InsertPictogram): Promise<Pictogram>;
  getPictogram(id: number): Promise<Pictogram | undefined>;
  getLibraryPictograms(libraryId: number): Promise<Pictogram[]>;
  updatePictogram(id: number, updates: Partial<InsertPictogram>): Promise<Pictogram>;
  deletePictogram(id: number): Promise<boolean>;
  
  // Space Collaborator operations
  addCollaborator(collaborator: InsertSpaceCollaborator): Promise<SpaceCollaborator>;
  getSpaceCollaborators(spaceId: number): Promise<SpaceCollaborator[]>;
  removeCollaborator(spaceId: number, userId: string): Promise<boolean>;
  updateCollaboratorRole(spaceId: number, userId: string, role: string): Promise<SpaceCollaborator>;
  
  // Legacy operations (for backward compatibility)
  getInstance(id: number): Promise<Instance | undefined>;
  getInstanceBySlug(slug: string): Promise<Instance | undefined>;
  createInstance(instance: InsertInstance): Promise<Instance>;
  listInstances(): Promise<Instance[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for authentication)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Space operations
  async createSpace(spaceData: InsertSpace): Promise<Space> {
    const [space] = await db
      .insert(spaces)
      .values(spaceData)
      .returning();
    
    // Create default library for the space
    await this.createPictogramLibrary({
      spaceId: space.id,
      name: "Default Library",
      description: "Default pictogram library for this space",
      isDefault: true,
    });
    
    return space;
  }

  async getSpace(id: number): Promise<Space | undefined> {
    const [space] = await db.select().from(spaces).where(eq(spaces.id, id));
    return space;
  }

  async getUserSpaces(userId: string): Promise<Space[]> {
    return await db
      .select()
      .from(spaces)
      .where(eq(spaces.ownerId, userId))
      .orderBy(desc(spaces.updatedAt));
  }

  async updateSpace(id: number, updates: Partial<InsertSpace>): Promise<Space> {
    const [space] = await db
      .update(spaces)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(spaces.id, id))
      .returning();
    
    if (!space) {
      throw new Error(`Space with id ${id} not found`);
    }
    return space;
  }

  async deleteSpace(id: number): Promise<boolean> {
    const result = await db.delete(spaces).where(eq(spaces.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Pictogram Library operations
  async createPictogramLibrary(libraryData: InsertPictogramLibrary): Promise<PictogramLibrary> {
    const [library] = await db
      .insert(pictogramLibraries)
      .values(libraryData)
      .returning();
    return library;
  }

  async getPictogramLibrary(id: number): Promise<PictogramLibrary | undefined> {
    const [library] = await db
      .select()
      .from(pictogramLibraries)
      .where(eq(pictogramLibraries.id, id));
    return library;
  }

  async getSpaceLibraries(spaceId: number): Promise<PictogramLibrary[]> {
    return await db
      .select()
      .from(pictogramLibraries)
      .where(eq(pictogramLibraries.spaceId, spaceId))
      .orderBy(desc(pictogramLibraries.isDefault), desc(pictogramLibraries.updatedAt));
  }

  async updatePictogramLibrary(id: number, updates: Partial<InsertPictogramLibrary>): Promise<PictogramLibrary> {
    const [library] = await db
      .update(pictogramLibraries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pictogramLibraries.id, id))
      .returning();
    
    if (!library) {
      throw new Error(`Pictogram library with id ${id} not found`);
    }
    return library;
  }

  async deletePictogramLibrary(id: number): Promise<boolean> {
    const result = await db.delete(pictogramLibraries).where(eq(pictogramLibraries.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Pictogram operations
  async createPictogram(pictogramData: InsertPictogram): Promise<Pictogram> {
    const [pictogram] = await db
      .insert(pictograms)
      .values(pictogramData)
      .returning();
    return pictogram;
  }

  async getPictogram(id: number): Promise<Pictogram | undefined> {
    const [pictogram] = await db
      .select()
      .from(pictograms)
      .where(eq(pictograms.id, id));
    return pictogram;
  }

  async getLibraryPictograms(libraryId: number): Promise<Pictogram[]> {
    return await db
      .select()
      .from(pictograms)
      .where(eq(pictograms.libraryId, libraryId))
      .orderBy(desc(pictograms.updatedAt));
  }

  async updatePictogram(id: number, updates: Partial<InsertPictogram>): Promise<Pictogram> {
    const [pictogram] = await db
      .update(pictograms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pictograms.id, id))
      .returning();
    
    if (!pictogram) {
      throw new Error(`Pictogram with id ${id} not found`);
    }
    return pictogram;
  }

  async deletePictogram(id: number): Promise<boolean> {
    const result = await db.delete(pictograms).where(eq(pictograms.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Space Collaborator operations
  async addCollaborator(collaboratorData: InsertSpaceCollaborator): Promise<SpaceCollaborator> {
    const [collaborator] = await db
      .insert(spaceCollaborators)
      .values(collaboratorData)
      .returning();
    return collaborator;
  }

  async getSpaceCollaborators(spaceId: number): Promise<SpaceCollaborator[]> {
    return await db
      .select()
      .from(spaceCollaborators)
      .where(eq(spaceCollaborators.spaceId, spaceId));
  }

  async removeCollaborator(spaceId: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(spaceCollaborators)
      .where(and(
        eq(spaceCollaborators.spaceId, spaceId),
        eq(spaceCollaborators.userId, userId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async updateCollaboratorRole(spaceId: number, userId: string, role: string): Promise<SpaceCollaborator> {
    const [collaborator] = await db
      .update(spaceCollaborators)
      .set({ role })
      .where(and(
        eq(spaceCollaborators.spaceId, spaceId),
        eq(spaceCollaborators.userId, userId)
      ))
      .returning();
    
    if (!collaborator) {
      throw new Error(`Collaborator not found`);
    }
    return collaborator;
  }

  // Legacy operations (for backward compatibility)
  async getInstance(id: number): Promise<Instance | undefined> {
    const [instance] = await db.select().from(instances).where(eq(instances.id, id));
    return instance;
  }

  async getInstanceBySlug(slug: string): Promise<Instance | undefined> {
    const [instance] = await db.select().from(instances).where(eq(instances.slug, slug));
    return instance;
  }

  async createInstance(instanceData: InsertInstance): Promise<Instance> {
    const [instance] = await db
      .insert(instances)
      .values(instanceData)
      .returning();
    return instance;
  }

  async listInstances(): Promise<Instance[]> {
    return await db.select().from(instances);
  }
}

export const storage = new DatabaseStorage();