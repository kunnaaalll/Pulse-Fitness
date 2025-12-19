const { findUserIdByEmail } = require('../models/userRepository');
const { getActiveAiServiceSetting, upsertAiServiceSetting } = require('../models/chatRepository');

async function run() {
  try {
    console.log('Updating Perplexity model configuration...');
    const userIdObj = await findUserIdByEmail('admin@sparkyfitness.com');
    if (!userIdObj) {
      console.error('User admin@sparkyfitness.com not found');
      process.exit(1);
    }
    const userId = userIdObj.id;
    console.log(`Found user ID: ${userId}`);

    const activeService = await getActiveAiServiceSetting(userId);
    if (!activeService) {
        console.log('No active AI service found to update.');
        process.exit(0);
    }

    if (activeService.service_type === 'perplexity') {
        console.log(`Found active Perplexity service. Current model: ${activeService.model_name}`);
        
        // Update the model to a valid one
        const updatedSetting = {
            ...activeService,
            user_id: userId, // Ensure user_id is passed
            model_name: 'sonar-pro'
        };
        // Remove helper fields returned by getActiveAiServiceSetting that shouldn't be passed to upsert
        // upsertAiServiceSetting expects settingData
        // We need to be careful about API key. usage of upsertAiServiceSetting handles encryption.
        // If we don't provide api_key in plain text, it keeps the old one encrypted.
        // We just need to ensure we pass the correct structure.

        // Re-construct clean object for upsert
        const cleanSetting = {
            id: activeService.id,
            user_id: userId,
            service_name: activeService.service_name,
            service_type: activeService.service_type,
            custom_url: activeService.custom_url,
            system_prompt: "You are Sparky, an AI nutrition and wellness coach. You help users track their food, exercise, and measurements. You are encouraging, knowledgeable, and concise.",
            is_active: true,
            model_name: 'sonar-pro'
            // We do NOT pass api_key, encrypted_api_key, etc. upsertAiServiceSetting handles keeping existing key if new one not provided?
            // Checking chatRepository.js:
            // "encrypted_api_key = COALESCE($7, encrypted_api_key)"
            // Yes, if we pass null/undefined for encryptedApiKey, it keeps the old one.
            // BUT upsertAiServiceSetting logic is:
            // let encryptedApiKey = settingData.encrypted_api_key || null; ...
            // if (settingData.api_key) { encrypt... }
            // So we should just NOT pass api_key, and logic will use null for new encryption, 
            // and SQL COALESCE will keep the old value.
        };

        const result = await upsertAiServiceSetting(cleanSetting);
        console.log('Successfully updated Perplexity AI service model to sonar-pro. ID:', result.id);
    } else {
        console.log(`Active service is NOT Perplexity (it is ${activeService.service_type}). skipping update.`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error updating Perplexity service:', err);
    process.exit(1);
  }
}

run();
