import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error: ${errText}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { action, ...params } = await request.json();

  try {
    if (action === 'suggest_goals') {
      const { department, role, existingGoals } = params;
      const existingStr = existingGoals?.length > 0
        ? `\nAlready created goals: ${existingGoals.map((g: Record<string, string>) => g.title).join(', ')}`
        : '';

      const prompt = `You are an HR goal-setting assistant for a corporate performance management system.

Generate 4 SMART goal suggestions for an employee in the "${department}" department with the "${role}" role.${existingStr}

For each goal, provide:
1. thrust_area: Choose from [Revenue Growth, Customer Success, Product Delivery, Operational Excellence, Team Development, Brand Awareness, Lead Generation, Content Strategy, Cost Optimization, Innovation, Quality Assurance, Compliance]
2. title: A specific, measurable goal title (max 60 chars)
3. description: Brief description (max 120 chars)
4. uom_type: Choose from [numeric_min, numeric_max, percentage_min, percentage_max, timeline, zero]
5. target_value: A realistic target number (null for timeline/zero)
6. weightage: Suggested weightage (must be 10-40, all suggestions should roughly sum to 100)

IMPORTANT: Return ONLY a valid JSON array of objects. No markdown, no code blocks, no explanation. Pure JSON.`;

      const response = await callGemini(prompt);
      // Clean up response - extract JSON
      let cleaned = response.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```json?\n?/g, '').replace(/```/g, '');
      }
      const suggestions = JSON.parse(cleaned);
      return NextResponse.json({ suggestions });
    }

    if (action === 'analyze_quality') {
      const { goals } = params;
      const goalsStr = goals.map((g: Record<string, string | number>, i: number) =>
        `${i + 1}. "${g.title}" (${g.thrust_area}, Weight: ${g.weightage}%, UoM: ${g.uom_type}, Target: ${g.target_value || 'N/A'})`
      ).join('\n');

      const prompt = `You are an expert HR consultant analyzing employee goal quality using SMART criteria.

Analyze these goals:
${goalsStr}

Provide:
1. overall_score: A quality score from 0-100
2. grade: A letter grade (A+, A, B+, B, C+, C, D)
3. strengths: Array of 2-3 positive aspects (each max 80 chars)
4. improvements: Array of 2-3 areas to improve (each max 80 chars)
5. summary: One sentence summary (max 150 chars)

IMPORTANT: Return ONLY a valid JSON object. No markdown, no code blocks, no explanation. Pure JSON.`;

      const response = await callGemini(prompt);
      let cleaned = response.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```json?\n?/g, '').replace(/```/g, '');
      }
      const analysis = JSON.parse(cleaned);
      return NextResponse.json({ analysis });
    }

    if (action === 'progress_insights') {
      const { employeeName, goals } = params;
      const goalsStr = goals.map((g: Record<string, unknown>, i: number) => {
        const achievements = g.achievements as Array<Record<string, unknown>> || [];
        const achStr = achievements.map((a: Record<string, unknown>) =>
          `${a.quarter}: actual=${a.actual_value}, score=${a.progress_score}%`
        ).join(', ');
        return `${i + 1}. "${g.title}" (Weight: ${g.weightage}%, Target: ${g.target_value || 'N/A'}) — Achievements: [${achStr || 'none yet'}]`;
      }).join('\n');

      const prompt = `You are a performance coach. Analyze this employee's quarterly goal progress and provide actionable insights.

Employee: ${employeeName}
Goals:
${goalsStr}

Provide:
1. overall_assessment: One paragraph assessment (max 200 chars)
2. risk_areas: Array of goals at risk with reason (max 2 items, each max 100 chars)
3. recommendations: Array of 3 specific action items (each max 100 chars)
4. motivation_message: A short, personalized motivational message (max 100 chars)

IMPORTANT: Return ONLY a valid JSON object. No markdown, no code blocks. Pure JSON.`;

      const response = await callGemini(prompt);
      let cleaned = response.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```json?\n?/g, '').replace(/```/g, '');
      }
      const insights = JSON.parse(cleaned);
      return NextResponse.json({ insights });
    }

    if (action === 'checkin_summary') {
      const { employeeName, goals, quarter } = params;
      const goalsStr = goals.map((g: Record<string, unknown>, i: number) => {
        const achievements = g.achievements as Array<Record<string, unknown>> || [];
        const ach = achievements.find((a: Record<string, unknown>) => a.quarter === quarter);
        return `${i + 1}. "${g.title}" — Target: ${g.target_value || 'N/A'}, Actual: ${ach ? ach.actual_value : 'not logged'}, Score: ${ach ? ach.progress_score + '%' : 'N/A'}`;
      }).join('\n');

      const prompt = `You are a manager drafting a quarterly check-in summary for a team member.

Employee: ${employeeName}
Quarter: ${quarter}
Performance Data:
${goalsStr}

Write a concise, professional check-in comment (3-4 sentences) that:
- Acknowledges progress and achievements
- Notes areas needing attention
- Provides one specific actionable suggestion
- Is encouraging but honest

Return ONLY the comment text, no JSON, no formatting.`;

      const response = await callGemini(prompt);
      return NextResponse.json({ comment: response.trim() });
    }

    return NextResponse.json({ error: 'Invalid AI action' }, { status: 400 });
  } catch (err) {
    console.error('AI API error:', err);
    return NextResponse.json({ error: 'AI service temporarily unavailable. Please try again.' }, { status: 500 });
  }
}
