import { tagService } from '@/services/tag';

export async function seedTags() {
  try {
    console.log('Seeding tags...');
    
    const tagsToSeed = [
      { name: 'subplot-a', color: 'amber' },
      { name: 'pov-nolan', color: 'blue' },
      { name: 'draft-rough', color: 'gray' },
    ];

    const existingTags = await tagService.listAll();
    
    for (const tagData of tagsToSeed) {
      const exists = existingTags.find(t => t.name === tagData.name);
      if (!exists) {
        await tagService.create(tagData.name, tagData.color);
        console.log(`Created tag: ${tagData.name}`);
      } else {
        console.log(`Tag already exists: ${tagData.name}`);
      }
    }
    
    console.log('Tags seeded successfully');
  } catch (error) {
    console.error('Error seeding tags:', error);
  }
}
