// DEPRECATED: Legacy Supabase Edge Function book routes.
// Books are now handled through Next.js API routes backed by Prisma.
import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

export const booksRouter = new Hono();

// Helper to ensure a default book exists
async function ensureDefaultBook() {
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
    return defaultBook;
  }
  
  return bookKeys[0];
}

// GET /books - List all books
booksRouter.get('/books', async (c) => {
  try {
    let books = await kv.getByPrefix('storycraft:book:');
    
    // Ensure at least one book exists
    if (books.length === 0) {
      const defaultBook = await ensureDefaultBook();
      books = [defaultBook];
    }
    
    // Filter out archived books by default (can add query param later)
    const activeBooks = books.filter(b => !b.isArchived);
    
    return c.json({ books: activeBooks });
  } catch (error) {
    console.error('Error fetching books:', error);
    return c.json({ error: 'Failed to fetch books', details: String(error) }, 500);
  }
});

// POST /book - Create a new book
booksRouter.post('/book', async (c) => {
  try {
    const body = await c.req.json();
    const book = {
      id: body.id || crypto.randomUUID(),
      title: body.title || 'Untitled Book',
      description: body.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerUserId: body.ownerUserId || null,
      isArchived: false,
    };
    
    await kv.set(`storycraft:book:${book.id}`, book);
    return c.json({ book });
  } catch (error) {
    console.error('Error creating book:', error);
    return c.json({ error: 'Failed to create book', details: String(error) }, 500);
  }
});

// PUT /book/:id - Update a book
booksRouter.put('/book/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const existing = await kv.get(`storycraft:book:${id}`);
    
    if (!existing) {
      return c.json({ error: 'Book not found' }, 404);
    }
    
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`storycraft:book:${id}`, updated);
    return c.json({ book: updated });
  } catch (error) {
    console.error('Error updating book:', error);
    return c.json({ error: 'Failed to update book', details: String(error) }, 500);
  }
});

// DELETE /book/:id - Archive a book (soft delete)
booksRouter.delete('/book/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const existing = await kv.get(`storycraft:book:${id}`);
    
    if (!existing) {
      return c.json({ error: 'Book not found' }, 404);
    }
    
    const updated = {
      ...existing,
      isArchived: true,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`storycraft:book:${id}`, updated);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error archiving book:', error);
    return c.json({ error: 'Failed to archive book', details: String(error) }, 500);
  }
});

// Helper function to migrate existing data to a book
export async function migrateDataToBook(bookId: string) {
  try {
    console.log(`Migrating existing data to book ${bookId}...`);
    
    // Migrate chapters
    const chapters = await kv.getByPrefix('storycraft:chapter:');
    for (const chapter of chapters) {
      if (!chapter.bookId) {
        chapter.bookId = bookId;
        await kv.set(`storycraft:chapter:${chapter.id}`, chapter);
      }
    }
    
    // Migrate themes
    const themes = await kv.getByPrefix('storycraft:theme:');
    for (const theme of themes) {
      if (!theme.bookId) {
        theme.bookId = bookId;
        await kv.set(`storycraft:theme:${theme.id}`, theme);
      }
    }
    
    // Migrate characters
    const characters = await kv.getByPrefix('storycraft:character:');
    for (const character of characters) {
      if (!character.bookId) {
        character.bookId = bookId;
        await kv.set(`storycraft:character:${character.id}`, character);
      }
    }
    
    // Migrate parts
    const parts = await kv.getByPrefix('storycraft:part:');
    for (const part of parts) {
      if (!part.bookId) {
        part.bookId = bookId;
        await kv.set(`storycraft:part:${part.id}`, part);
      }
    }
    
    // Migrate corkboard cards
    const cards = await kv.getByPrefix('storycraft:corkboard:card:');
    for (const card of cards) {
      if (!card.bookId) {
        card.bookId = bookId;
        await kv.set(`storycraft:corkboard:card:${card.id}`, card);
      }
    }
    
    // Migrate corkboard boards
    const boards = await kv.getByPrefix('storycraft:corkboard:board:');
    for (const board of boards) {
      if (!board.bookId) {
        board.bookId = bookId;
        await kv.set(`storycraft:corkboard:board:${board.id}`, board);
      }
    }
    
    // Migrate tags
    const tags = await kv.getByPrefix('storycraft:tag:');
    for (const tag of tags) {
      if (!tag.bookId) {
        tag.bookId = bookId;
        await kv.set(`storycraft:tag:${tag.id}`, tag);
      }
    }
    
    console.log('Migration complete');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}
