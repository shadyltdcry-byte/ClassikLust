export async function apiRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(path, options);
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  return response.json();
}

// Old plugin API functions removed - using React State Debugger instead
