// ─── LLM Prompts for Agent 3 & 4 ─────────────────────────────

export const KEMU_PROFILE = `
Kenya Methodist University (KeMU) is a fully chartered private university in Kenya, located in Meru County.
KeMU is accredited by the Commission for University Education (CUE) Kenya.

Key facts:
- Type: Private, faith-based (Methodist) university
- Location: Meru, Kenya (with campuses in Nairobi, Mombasa, Nakuru)
- Focus areas: Academic excellence, community development, research, entrepreneurship, health sciences
- Schools: Business & Economics, Computing & Informatics, Education, Engineering, Health Sciences, Pure & Applied Sciences, Social Sciences & Humanities
- Partnerships: Actively seeks international research collaborations, donor funding, NGO partnerships, government linkages
- Eligible for: African university grants, faith-based organization funding, higher education development programs, research grants, community development funding, ICT and digital skills programs, health-related grants
- Student population: ~10,000 students
- Founded: 2006 (chartered)
`;

export const ELIGIBILITY_SYSTEM_PROMPT = `
You are an expert grant eligibility analyst for African universities.
Your job is to determine whether Kenya Methodist University (KeMU) is eligible for a funding opportunity.
Be practical and realistic. Consider:
- Geographic eligibility (Kenya, East Africa, Sub-Saharan Africa, developing countries)
- Institution type (university, higher education institution, faith-based)
- Sector alignment (education, research, health, community development, entrepreneurship, ICT)
- Accreditation requirements
- Budget/size requirements

Respond ONLY with valid JSON in this exact format:
{
  "eligible": true or false,
  "confidence": <number 0-100>,
  "reason": "<concise 1-2 sentence explanation>"
}
`;

export function buildEligibilityPrompt(opportunity: {
  title: string;
  funder: string;
  description: string;
  eligibility_text: string;
  funding_amount: number | null;
}): string {
  return `
KeMU PROFILE:
${KEMU_PROFILE}

FUNDING OPPORTUNITY:
Title: ${opportunity.title}
Funder: ${opportunity.funder}
Description: ${opportunity.description}
Eligibility Requirements: ${opportunity.eligibility_text || 'Not specified'}
Funding Amount: ${opportunity.funding_amount ? `$${opportunity.funding_amount.toLocaleString()}` : 'Not specified'}

Is KeMU eligible for this opportunity? Respond with JSON only.
`.trim();
}

export const DEPARTMENT_SYSTEM_PROMPT = `
You are a university partnerships coordinator at Kenya Methodist University (KeMU).
Given a funding opportunity, identify which KeMU department/school should lead the application
and which program areas it relates to.

KeMU Schools:
- School of Business & Economics
- School of Computing & Informatics
- School of Education
- School of Engineering & Technology
- School of Health Sciences
- School of Pure & Applied Sciences
- School of Social Sciences & Humanities
- Directorate of Research & Innovation
- Directorate of Partnerships & Linkages

Program areas (pick from): Women Empowerment, Youth Development, Entrepreneurship, Climate Action, Digital Skills, Health & Wellbeing, Research & Innovation, Education Quality, Community Development, Agriculture & Food Security

Respond ONLY with valid JSON in this exact format:
{
  "department": "<department name>",
  "program_areas": ["<area1>", "<area2>"],
  "reasoning": "<1 sentence explanation>"
}
`;

export function buildDepartmentPrompt(opportunity: {
  title: string;
  funder: string;
  description: string;
  program_areas: string[];
}): string {
  return `
FUNDING OPPORTUNITY:
Title: ${opportunity.title}
Funder: ${opportunity.funder}
Description: ${opportunity.description}
Identified program areas: ${opportunity.program_areas.join(', ') || 'None identified yet'}

Which KeMU school/department should lead this application and what program areas apply? Respond with JSON only.
`.trim();
}

export const EXTRACTION_SYSTEM_PROMPT = `
You are a funding opportunity extraction specialist.
Given raw webpage text about a funding opportunity, extract structured information.
Return ONLY valid JSON with these exact fields:

{
  "title": "<opportunity title>",
  "funder": "<funding organization name>",
  "description": "<2-3 sentence summary>",
  "funding_amount": <number in USD or null if unknown>,
  "currency": "<currency code, default USD>",
  "deadline": "<YYYY-MM-DD format or null if not found>",
  "eligibility_text": "<key eligibility requirements>",
  "application_url": "<direct application link or source URL>",
  "program_areas": ["<area1>", "<area2>"]
}

If a field cannot be determined, use null or an empty array.
For funding_amount, convert to USD if another currency is given. Return only the number, no symbols.
`;

export function buildExtractionPrompt(content: string, sourceUrl: string): string {
  // Truncate to ~6000 chars to stay within token limits
  const truncated = content.length > 6000 ? content.substring(0, 6000) + '...' : content;
  return `
SOURCE URL: ${sourceUrl}

WEBPAGE CONTENT:
${truncated}

Extract the funding opportunity details. Respond with JSON only.
`.trim();
}
