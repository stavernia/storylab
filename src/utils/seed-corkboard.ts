import { CorkboardCard, corkboardApi, CorkboardBoard } from "../api/corkboard";
import { getInitialRank, getBetweenRank } from './lexorank';

export async function seedCorkboard(chapterIds: string[]) {
  // Check if cards already exist
  const existingCards = await corkboardApi.loadCards();
  if (existingCards.length > 0) {
    console.log('Corkboard already has cards, skipping seed');
    return;
  }

  // Ensure we have a default board
  const existingBoards = await corkboardApi.loadBoards();
  let mainBoard: CorkboardBoard;

  if (existingBoards.length === 0) {
    mainBoard = {
      id: 'main-board',
      name: 'Main Board',
      description: 'Default story board',
    };
  await corkboardApi.saveBoard(mainBoard);
    console.log('Created default board:', mainBoard.name);
  } else {
    mainBoard = existingBoards[0];
  }

  console.log('Seeding corkboard with demo cards...');

  const chapter1 = chapterIds[0];
  const chapter2 = chapterIds[1];

  const demoCards: CorkboardCard[] = [
    {
      id: 'seed-1',
      title: 'Opening Hook',
      summary: 'Introduce the protagonist in a moment of crisis that sets the tone for the entire story.',
      chapterId: chapter1,
      color: 'blue',
      status: 'done',
      laneRank: getInitialRank(),
      wordEstimate: 500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      boardId: mainBoard.id,
      x: null,
      y: null,
    },
    {
      id: 'seed-2',
      title: 'World Building Setup',
      summary: 'Establish the setting and rules of this world. Show don\'t tell.',
      chapterId: chapter1,
      color: 'green',
      status: 'draft',
      laneRank: getBetweenRank(getInitialRank(), undefined),
      wordEstimate: 750,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      boardId: mainBoard.id,
      x: null,
      y: null,
    },
    {
      id: 'seed-3',
      title: 'First Plot Point',
      summary: 'The inciting incident that launches the main conflict.',
      chapterId: chapter2,
      color: 'amber',
      status: 'draft',
      laneRank: getInitialRank(),
      wordEstimate: 600,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      boardId: mainBoard.id,
      x: null,
      y: null,
    },
    {
      id: 'seed-4',
      title: 'Character Revelation',
      summary: 'A key moment where we learn something important about the protagonist\'s past.',
      chapterId: chapter2,
      color: 'purple',
      status: 'idea',
      laneRank: getBetweenRank(getInitialRank(), undefined),
      wordEstimate: 400,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      boardId: mainBoard.id,
      x: null,
      y: null,
    },
    {
      id: 'seed-5',
      title: 'Subplot Introduction',
      summary: 'Introduce a secondary storyline that will weave through the main plot.',
      chapterId: undefined,
      color: 'gray',
      status: 'idea',
      laneRank: getInitialRank(),
      wordEstimate: 300,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      boardId: mainBoard.id,
      x: null,
      y: null,
    },
    {
      id: 'seed-6',
      title: 'Foreshadowing Element',
      summary: 'Plant clues for the big twist in Act 3.',
      chapterId: undefined,
      color: 'red',
      status: 'idea',
      laneRank: getBetweenRank(getInitialRank(), undefined),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      boardId: mainBoard.id,
      x: null,
      y: null,
    },
  ];

  try {
    await Promise.all(demoCards.map(card => corkboardApi.createCard(card)));
    console.log('Corkboard seeded successfully with', demoCards.length, 'cards');
  } catch (error) {
    console.error('Error seeding corkboard:', error);
  }
}
