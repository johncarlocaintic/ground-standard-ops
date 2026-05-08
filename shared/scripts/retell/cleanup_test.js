import fs from 'fs';

const BASE_URL = 'https://api.retellai.com';
const apiKey = process.env.RETELL_API_KEY;

async function del(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  if (!response.ok) {
    console.error(`Failed to delete ${endpoint}: ${response.status}`);
  } else {
    console.log(`Successfully deleted ${endpoint}`);
  }
}

async function cleanup() {
  console.log("Cleaning up test agents and LLMs...");
  // Delete agents first, then LLMs
  await del('/delete-agent/agent_0c8d6746387942ceb01bc6057b');
  await del('/delete-agent/agent_be7a931d3480d94233d0a32fc1');
  await del('/delete-retell-llm/llm_83db1b3f464932bad42a65f2c58c');
  await del('/delete-retell-llm/llm_8ebaaa849968b588e972f9cbb7fb');
  console.log("Cleanup complete.");
}

cleanup();
