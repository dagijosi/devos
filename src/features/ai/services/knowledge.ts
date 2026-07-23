import { database } from '../../../database';

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '...' : text;
}

export async function buildContext(query: string, projectId?: number): Promise<string> {
  const parts: string[] = [];

  try {
    const recentActivity = await database.getRecentActivity(5);
    if (recentActivity.length > 0) {
      parts.push('=== Recent Activity ===');
      recentActivity.forEach((a: any) => {
        parts.push(`- [${a.action}] ${a.description} (${new Date(a.created_at).toLocaleString()})`);
      });
    }
  } catch { /* skip */ }

  if (projectId) {
    try {
      const project = await database.getProject(projectId);
      if (project) {
        parts.push('=== Current Project ===');
        parts.push(`Name: ${project.name}`);
        parts.push(`Description: ${project.description || 'N/A'}`);
        parts.push(`Technologies: ${(project.technology || []).join(', ')}`);
        parts.push(`Status: ${project.status}`);
      }
    } catch { /* skip */ }
  }

  try {
    const notes = await database.searchNotes(`%${query}%`);
    if (notes.length > 0) {
      parts.push('=== Relevant Notes ===');
      notes.slice(0, 3).forEach((n: any) => {
        parts.push(`- ${n.title}: ${truncate(n.content || '', 300)}`);
      });
    }
  } catch { /* skip */ }

  try {
    const snippets = await database.searchSnippets(query);
    if (snippets.length > 0) {
      parts.push('=== Relevant Code Snippets ===');
      snippets.slice(0, 3).forEach((s: any) => {
        parts.push(`- [${s.language}] ${s.title}: ${truncate(s.code || '', 200)}`);
      });
    }
  } catch { /* skip */ }

  try {
    const bugs = await database.searchBugs(query);
    if (bugs.length > 0) {
      parts.push('=== Relevant Bugs ===');
      bugs.slice(0, 3).forEach((b: any) => {
        parts.push(`- ${b.title}: Problem: ${truncate(b.problem, 200)} | Solution: ${truncate(b.solution, 200)}`);
      });
    }
  } catch { /* skip */ }

  return parts.join('\n');
}

export const SYSTEM_PROMPT = `You are an AI assistant integrated into a Developer OS application. You help developers with coding, debugging, project management, and daily tasks.

You have access to the user's:
- Projects (name, description, technologies, status)
- Notes (documentation, knowledge base)
- Code snippets (code examples by language)
- Bugs (problem/solution records)
- Recent activity (what the user has been working on)

When answering, be concise and practical. If you reference user data, summarize it naturally. If asked about code, provide examples. If asked about bugs, suggest solutions based on the records.

You can search the user's knowledge base when context is provided. Answer in plain text with markdown formatting when helpful.`;
