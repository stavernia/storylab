import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import * as kv from './kv_store.tsx';
import { migrateDataToBook } from './books.tsx'; // DEPRECATED: Books now handled via Next.js API

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

// DEPRECATED: Books are now served via Next.js /api/books (see app/api/books)
// Legacy Supabase routes remain commented out to avoid accidental usage.
// app.route('/make-server-841a689e', booksRouter);

// Helper to ensure default book exists and migrate data
async function ensureDefaultBookAndMigrate() {
  const bookKeys = await kv.getByPrefix('storycraft:book:');
  
  if (bookKeys.length === 0) {
    const defaultBook = {
      id: 'default-book',
      title: 'My First Novel',
      description: 'Your first StoryLab project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerUserId: null,
      isArchived: false,
    };
    
    await kv.set(`storycraft:book:${defaultBook.id}`, defaultBook);
    
    // Migrate existing data to this book ONLY when creating default book
    await migrateDataToBook(defaultBook.id);
    
    return defaultBook;
  }
  
  // Don't run migration if books already exist - data should already have bookId
  return bookKeys[0];
}

// Get all data (chapters, themes, theme notes) - NOW SCOPED BY BOOK
app.get('/make-server-841a689e/data', async (c) => {
  try {
    // NEW: Multi-book support - Ensure default book and migration
    const defaultBook = await ensureDefaultBookAndMigrate();
    const bookId = c.req.query('bookId') || defaultBook.id;
    
    // Since getByPrefix returns just values (not {key, value} pairs),
    // we need to fetch each type separately and filter by bookId
    const allChapters = await kv.getByPrefix('storycraft:chapter:');
    const allThemes = await kv.getByPrefix('storycraft:theme:');
    const allNotes = await kv.getByPrefix('storycraft:note:');
    const allCharacters = await kv.getByPrefix('storycraft:character:');
    const allParts = await kv.getByPrefix('storycraft:part:');
    
    // Filter by bookId
    const chapters = allChapters.filter((ch: any) => ch.bookId === bookId);
    const themes = allThemes.filter((t: any) => t.bookId === bookId);
    const notes = allNotes; // theme notes don't have bookId directly, we'll filter via chapters/themes
    const characters = allCharacters.filter((c: any) => c.bookId === bookId);
    const parts = allParts.filter((p: any) => p.bookId === bookId);
    
    console.log('Loaded from KV for book', bookId, '- chapters:', chapters.length, 'themes:', themes.length, 'notes:', notes.length, 'characters:', characters.length, 'parts:', parts.length);

    return c.json({
      chapters: chapters || [],
      themes: themes || [],
      themeNotes: notes || [],
      characters: characters || [],
      parts: parts || []
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return c.json({ error: 'Failed to fetch data', details: String(error) }, 500);
  }
});

// Save chapter
app.post('/make-server-841a689e/chapter', async (c) => {
  try {
    const chapter = await c.req.json();
    const key = `storycraft:chapter:${chapter.id}`;
    console.log('Saving chapter with key:', key, 'data:', chapter);
    await kv.set(key, chapter);
    
    // Verify it was saved
    const saved = await kv.get(key);
    console.log('Verification - retrieved after save:', saved);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error saving chapter:', error);
    return c.json({ error: 'Failed to save chapter', details: String(error) }, 500);
  }
});

// Update chapter
app.put('/make-server-841a689e/chapter/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const existing = await kv.get(`storycraft:chapter:${id}`);
    
    if (!existing) {
      return c.json({ error: 'Chapter not found' }, 404);
    }
    
    // CRITICAL: Never allow bookId to be overwritten
    const { bookId: _, ...safeUpdates } = updates;
    const updated = { ...existing, ...safeUpdates };
    await kv.set(`storycraft:chapter:${id}`, updated);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating chapter:', error);
    return c.json({ error: 'Failed to update chapter', details: String(error) }, 500);
  }
});

// Delete chapter
app.delete('/make-server-841a689e/chapter/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`storycraft:chapter:${id}`);
    
    // Also delete related theme notes
    const notes = await kv.getByPrefix('storycraft:note:');
    const notesToDelete: string[] = [];
    
    // Since getByPrefix returns values, we need to reconstruct keys from the data
    for (const note of notes) {
      if (note?.chapterId === id) {
        notesToDelete.push(`storycraft:note:${note.chapterId}:${note.themeId}`);
      }
    }
    
    if (notesToDelete.length > 0) {
      await kv.mdel(notesToDelete);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    return c.json({ error: 'Failed to delete chapter', details: String(error) }, 500);
  }
});

// Save theme
app.post('/make-server-841a689e/theme', async (c) => {
  try {
    const theme = await c.req.json();
    await kv.set(`storycraft:theme:${theme.id}`, theme);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error saving theme:', error);
    return c.json({ error: 'Failed to save theme', details: String(error) }, 500);
  }
});

// Update theme
app.put('/make-server-841a689e/theme/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const existing = await kv.get(`storycraft:theme:${id}`);
    
    if (!existing) {
      return c.json({ error: 'Theme not found' }, 404);
    }
    
    // CRITICAL: Never allow bookId to be overwritten
    const { bookId: _, ...safeUpdates } = updates;
    const updated = { ...existing, ...safeUpdates };
    await kv.set(`storycraft:theme:${id}`, updated);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating theme:', error);
    return c.json({ error: 'Failed to update theme', details: String(error) }, 500);
  }
});

// Delete theme
app.delete('/make-server-841a689e/theme/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`storycraft:theme:${id}`);
    
    // Also delete related theme notes
    const notes = await kv.getByPrefix('storycraft:note:');
    const notesToDelete: string[] = [];
    
    // Since getByPrefix returns values, we need to reconstruct keys from the data
    for (const note of notes) {
      if (note?.themeId === id) {
        notesToDelete.push(`storycraft:note:${note.chapterId}:${note.themeId}`);
      }
    }
    
    if (notesToDelete.length > 0) {
      await kv.mdel(notesToDelete);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting theme:', error);
    return c.json({ error: 'Failed to delete theme', details: String(error) }, 500);
  }
});

// DEPRECATED: Grid/theme notes have moved to Next.js API routes backed by Prisma.
// Frontend calls now hit `/api/books/[bookId]/grid` for creates/updates/deletes.
// This legacy handler is retained only for historical reference and should not
// be used for active grid/timeline features.
// Save or update theme note
app.post('/make-server-841a689e/note', async (c) => {
  try {
    const note = await c.req.json();
    const key = `storycraft:note:${note.chapterId}:${note.themeId}`;
    
    // Check if the note has any meaningful data (note text, presence, intensity > 0, or threadRole)
    const hasData = 
      (note.note && note.note !== '') ||
      note.presence === true ||
      (note.intensity && note.intensity > 0) ||
      (note.threadRole && note.threadRole !== 'none');
    
    if (!hasData) {
      // Delete if completely empty
      await kv.del(key);
    } else {
      // Save with all fields including threadRole
      await kv.set(key, note);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error saving note:', error);
    return c.json({ error: 'Failed to save note', details: String(error) }, 500);
  }
});

// ========== CHARACTERS ==========

// Save character
app.post('/make-server-841a689e/character', async (c) => {
  try {
    const character = await c.req.json();
    await kv.set(`storycraft:character:${character.id}`, character);
    console.log('Saved character:', character.id);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error saving character:', error);
    return c.json({ error: 'Failed to save character', details: String(error) }, 500);
  }
});

// Delete character
app.delete('/make-server-841a689e/character/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`storycraft:character:${id}`);
    console.log('Deleted character:', id);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting character:', error);
    return c.json({ error: 'Failed to delete character', details: String(error) }, 500);
  }
});

// ========== CORKBOARD (DEPRECATED - moved to Next.js API routes) ==========

// Corkboard boards and cards are now stored via Prisma-backed Next.js API routes.
// The legacy KV-powered endpoints have been removed to prevent drift.

// ========== TAGS ==========

// Get all tags
app.get('/make-server-841a689e/tags', async (c) => {
  try {
    const tags = await kv.getByPrefix('storycraft:tag:');
    console.log('Loaded tags:', tags.length);
    return c.json({ tags: tags || [] });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return c.json({ error: 'Failed to fetch tags', details: String(error) }, 500);
  }
});

// Create tag
app.post('/make-server-841a689e/tag', async (c) => {
  try {
    const { name, color } = await c.req.json();
    const normalizedName = name.trim().toLowerCase();
    
    if (!normalizedName) {
      return c.json({ error: 'Tag name cannot be empty' }, 400);
    }
    
    // Check for duplicates
    const existingTags = await kv.getByPrefix('storycraft:tag:');
    const duplicate = existingTags.find((t: any) => t.name === normalizedName);
    if (duplicate) {
      return c.json({ error: 'Tag already exists' }, 409);
    }
    
    const tag = {
      id: crypto.randomUUID(),
      name: normalizedName,
      color: color || null,
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`storycraft:tag:${tag.id}`, tag);
    console.log('Created tag:', tag.id, tag.name);
    return c.json({ tag });
  } catch (error) {
    console.error('Error creating tag:', error);
    return c.json({ error: 'Failed to create tag', details: String(error) }, 500);
  }
});

// Update tag
app.put('/make-server-841a689e/tag/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const existing = await kv.get(`storycraft:tag:${id}`);
    
    if (!existing) {
      return c.json({ error: 'Tag not found' }, 404);
    }
    
    if (updates.name) {
      updates.name = updates.name.trim().toLowerCase();
      if (!updates.name) {
        return c.json({ error: 'Tag name cannot be empty' }, 400);
      }
      
      // Check for duplicates (excluding self)
      const existingTags = await kv.getByPrefix('storycraft:tag:');
      const duplicate = existingTags.find((t: any) => t.name === updates.name && t.id !== id);
      if (duplicate) {
        return c.json({ error: 'Tag already exists' }, 409);
      }
    }
    
    const updated = { ...existing, ...updates };
    await kv.set(`storycraft:tag:${id}`, updated);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating tag:', error);
    return c.json({ error: 'Failed to update tag', details: String(error) }, 500);
  }
});

// Delete tag
app.delete('/make-server-841a689e/tag/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`storycraft:tag:${id}`);
    
    // Delete all tag links for this tag
    const links = await kv.getByPrefix('storycraft:taglink:');
    const linksToDelete: string[] = [];
    
    for (const link of links) {
      if (link?.tagId === id) {
        linksToDelete.push(`storycraft:taglink:${link.id}`);
      }
    }
    
    if (linksToDelete.length > 0) {
      await kv.mdel(linksToDelete);
    }
    
    console.log('Deleted tag:', id);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return c.json({ error: 'Failed to delete tag', details: String(error) }, 500);
  }
});

// Get tags for entity
app.get('/make-server-841a689e/tags/entity/:entityType/:entityId', async (c) => {
  try {
    const entityType = c.req.param('entityType');
    const entityId = c.req.param('entityId');
    
    const links = await kv.getByPrefix('storycraft:taglink:');
    const entityLinks = links.filter((link: any) => 
      link.entityType === entityType && link.entityId === entityId
    );
    
    const tagIds = entityLinks.map((link: any) => link.tagId);
    const tags = await kv.mget(tagIds.map((id: string) => `storycraft:tag:${id}`));
    
    return c.json({ tags: tags.filter(Boolean) });
  } catch (error) {
    console.error('Error fetching entity tags:', error);
    return c.json({ error: 'Failed to fetch entity tags', details: String(error) }, 500);
  }
});

// Add tag to entity
app.post('/make-server-841a689e/tag-link', async (c) => {
  try {
    const { tagId, entityType, entityId } = await c.req.json();
    
    // Check if link already exists
    const links = await kv.getByPrefix('storycraft:taglink:');
    const existing = links.find((link: any) =>
      link.tagId === tagId && link.entityType === entityType && link.entityId === entityId
    );
    
    if (existing) {
      return c.json({ success: true, message: 'Link already exists' });
    }
    
    const link = {
      id: crypto.randomUUID(),
      tagId,
      entityType,
      entityId,
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`storycraft:taglink:${link.id}`, link);
    console.log('Created tag link:', link.id);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error creating tag link:', error);
    return c.json({ error: 'Failed to create tag link', details: String(error) }, 500);
  }
});

// Remove tag from entity
app.delete('/make-server-841a689e/tag-link/:tagId/:entityType/:entityId', async (c) => {
  try {
    const tagId = c.req.param('tagId');
    const entityType = c.req.param('entityType');
    const entityId = c.req.param('entityId');
    
    const links = await kv.getByPrefix('storycraft:taglink:');
    const link = links.find((l: any) =>
      l.tagId === tagId && l.entityType === entityType && l.entityId === entityId
    );
    
    if (link) {
      await kv.del(`storycraft:taglink:${link.id}`);
      console.log('Deleted tag link:', link.id);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag link:', error);
    return c.json({ error: 'Failed to delete tag link', details: String(error) }, 500);
  }
});

// ========== PARTS v1 ==========

// Get all parts
app.get('/make-server-841a689e/parts', async (c) => {
  try {
    const parts = await kv.getByPrefix('storycraft:part:');
    // Sort by sortOrder
    const sorted = (parts || []).sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
    console.log('Loaded parts:', sorted.length);
    return c.json(sorted);
  } catch (error) {
    console.error('Error fetching parts:', error);
    return c.json({ error: 'Failed to fetch parts', details: String(error) }, 500);
  }
});

// Create part
app.post('/make-server-841a689e/part', async (c) => {
  try {
    const { title, notes, bookId } = await c.req.json();
    
    // Get max sortOrder from parts in the same book
    const existingParts = await kv.getByPrefix('storycraft:part:');
    const bookParts = existingParts.filter((p: any) => p.bookId === bookId);
    const maxOrder = bookParts.length > 0 
      ? Math.max(...bookParts.map((p: any) => p.sortOrder || 0))
      : 0;
    
    const part = {
      id: crypto.randomUUID(),
      bookId: bookId,
      title: title || `Part ${bookParts.length + 1}`,
      sortOrder: maxOrder + 1,
      notes: notes || null,
    };
    
    await kv.set(`storycraft:part:${part.id}`, part);
    console.log('Created part:', part.id, part.title, 'for book:', bookId);
    return c.json(part);
  } catch (error) {
    console.error('Error creating part:', error);
    return c.json({ error: 'Failed to create part', details: String(error) }, 500);
  }
});

// Update part
app.put('/make-server-841a689e/part/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const existing = await kv.get(`storycraft:part:${id}`);
    
    if (!existing) {
      return c.json({ error: 'Part not found' }, 404);
    }
    
    // CRITICAL: Never allow bookId to be overwritten
    const { bookId: _, ...safeUpdates } = updates;
    const updated = { ...existing, ...safeUpdates };
    await kv.set(`storycraft:part:${id}`, updated);
    console.log('Updated part:', id);
    return c.json(updated);
  } catch (error) {
    console.error('Error updating part:', error);
    return c.json({ error: 'Failed to update part', details: String(error) }, 500);
  }
});

// Delete part
app.delete('/make-server-841a689e/part/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`storycraft:part:${id}`);
    
    // Clear partId from all chapters that belonged to this part
    const chapters = await kv.getByPrefix('storycraft:chapter:');
    const chaptersToUpdate: any[] = [];
    
    for (const chapter of chapters) {
      if (chapter?.partId === id) {
        chaptersToUpdate.push({ ...chapter, partId: null });
      }
    }
    
    if (chaptersToUpdate.length > 0) {
      await Promise.all(
        chaptersToUpdate.map(ch => kv.set(`storycraft:chapter:${ch.id}`, ch))
      );
    }
    
    console.log('Deleted part:', id, 'and cleared partId from', chaptersToUpdate.length, 'chapters');
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting part:', error);
    return c.json({ error: 'Failed to delete part', details: String(error) }, 500);
  }
});

// Reorder parts
app.put('/make-server-841a689e/parts/reorder', async (c) => {
  try {
    const reorderData = await c.req.json(); // Array of { id, sortOrder }
    
    const updates = [];
    for (const item of reorderData) {
      const existing = await kv.get(`storycraft:part:${item.id}`);
      if (existing) {
        const updated = { ...existing, sortOrder: item.sortOrder };
        updates.push(kv.set(`storycraft:part:${item.id}`, updated));
      }
    }
    
    await Promise.all(updates);
    console.log('Reordered', updates.length, 'parts');
    return c.json({ success: true });
  } catch (error) {
    console.error('Error reordering parts:', error);
    return c.json({ error: 'Failed to reorder parts', details: String(error) }, 500);
  }
});

Deno.serve(app.fetch);