import { corkboardApi, type CorkboardBoard, type CreateCardInput } from "@/api/corkboard";
import { getInitialRank, getBetweenRank } from './lexorank';

export async function seedCorkboard(bookId: string, chapterIds: string[]) {
  // Check if cards already exist
  const existingCards = await corkboardApi.loadCards(bookId);
  if (existingCards.length > 0) {
    console.log('Corkboard already has cards, skipping seed');
    return;
  }

  // Ensure we have a default board
  const existingBoards = await corkboardApi.loadBoards(bookId);
  let mainBoard: CorkboardBoard;

  if (existingBoards.length === 0) {
    mainBoard = await corkboardApi.createBoard(bookId, {
      name: 'Main Board',
      description: 'Default story board',
      sortOrder: 0,
    });
    console.log('Created default board:', mainBoard.name);
  } else {
    mainBoard = existingBoards[0];
  }

  console.log('Seeding corkboard with demo cards...');

  const chapter1 = chapterIds[0];
  const chapter2 = chapterIds[1];

  const demoCards: CreateCardInput[] = [
    {
      title: 'Opening Hook',
      summary: 'Introduce the protagonist in a moment of crisis that sets the tone for the entire story.',
      chapterId: chapter1,
      color: 'blue',
      status: 'done',
      laneRank: getInitialRank(),
      wordEstimate: 500,
      boardId: mainBoard.id,
      x: null,
      y: null,
    },
    {
      title: 'World Building Setup',
      summary: 'Establish the setting and rules of this world. Show don\'t tell.',
      chapterId: chapter1,
      color: 'green',
      status: 'draft',
      laneRank: getBetweenRank(getInitialRank(), undefined),
      wordEstimate: 750,
      boardId: mainBoard.id,
      x: null,
      y: null,
    },
    {
      title: 'First Plot Point',
      summary: 'The inciting incident that launches the main conflict.',
      chapterId: chapter2,
      color: 'amber',
      status: 'draft',
      laneRank: getInitialRank(),
      wordEstimate: 600,
      boardId: mainBoard.id,
      x: null,
      y: null,
    },
    {
      title: 'Character Revelation',
      summary: 'A key moment where we learn something important about the protagonist\'s past.',
      chapterId: chapter2,
      color: 'purple',
      status: 'idea',
      laneRank: getBetweenRank(getInitialRank(), undefined),
      wordEstimate: 400,
      boardId: mainBoard.id,
      x: null,
      y: null,
    },
    {
      title: 'Subplot Introduction',
      summary: 'Introduce a secondary storyline that will weave through the main plot.',
      chapterId: undefined,
      color: 'gray',
      status: 'idea',
      laneRank: getInitialRank(),
      wordEstimate: 300,
      boardId: mainBoard.id,
      x: null,
      y: null,
    },
    {
      title: 'Foreshadowing Element',
      summary: 'Plant clues for the big twist in Act 3.',
      chapterId: undefined,
      color: 'red',
      status: 'idea',
      laneRank: getBetweenRank(getInitialRank(), undefined),
      boardId: mainBoard.id,
      x: null,
      y: null,
    },
  ];

  try {
    await Promise.all(demoCards.map(card => corkboardApi.createCard(bookId, card)));
    console.log('Corkboard seeded successfully with', demoCards.length, 'cards');
  } catch (error) {
    console.error('Error seeding corkboard:', error);
  }
}
