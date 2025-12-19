const { findUserIdByEmail } = require('../models/userRepository');
const { upsertAiServiceSetting } = require('../models/chatRepository');

async function run() {
  try {
    console.log('Starting Perplexity configuration...');
    const userIdObj = await findUserIdByEmail('admin@sparkyfitness.com');
    if (!userIdObj) {
      console.error('User admin@sparkyfitness.com not found');
      process.exit(1);
    }
    const userId = userIdObj.id;
    console.log(`Found user ID: ${userId}`);

    const settingData = {
      user_id: userId,
      service_name: 'Perplexity AI',
      service_type: 'perplexity',
      custom_url: '', 
      system_prompt: "You are Sparky, an AI nutrition and wellness coach. You help users track their food, exercise, and measurements. You are encouraging, knowledgeable, and concise.",
      is_active: true,
      model_name: 'sonar-pro', // Default model
      api_key: 'YOUR_PERPLEXITY_API_KEY'
    };

    const result = await upsertAiServiceSetting(settingData);
    console.log('Successfully configured Perplexity AI service. ID:', result.id);
    process.exit(0);
  } catch (err) {
    console.error('Error adding Perplexity service:', err);
    process.exit(1);
  }
}

run();
