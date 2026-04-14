import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CategoryInput {
  id: string
  name_he: string
  name_en: string
}

interface UnitInput {
  id: string
  code: string
  label_he: string
  label_en: string
  type: string
}

interface RequestBody {
  name_he: string
  categories: CategoryInput[]
  unit_types: UnitInput[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name_he, categories, unit_types } = (await req.json()) as RequestBody

    if (!name_he || !categories?.length || !unit_types?.length) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const categoriesList = categories
      .map((c) => `- id: "${c.id}", he: "${c.name_he}", en: "${c.name_en}"`)
      .join('\n')

    const unitsList = unit_types
      .map((u) => `- id: "${u.id}", code: "${u.code}", he: "${u.label_he}", en: "${u.label_en}", type: ${u.type}`)
      .join('\n')

    const prompt = `You are a grocery product classifier for an Israeli supermarket app.
Given a Hebrew product name, return a JSON object with:
- "name_en": the English translation of the product name
- "category_id": the best matching category ID from the list below
- "default_unit_id": the most appropriate unit ID from the list below

Return ONLY a valid JSON object, no markdown, no explanation.

Product name (Hebrew): ${name_he}

Available categories:
${categoriesList}

Available units:
${unitsList}`

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      }),
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error('Gemini API error:', geminiRes.status, errText)
      return new Response(JSON.stringify({ error: `Gemini API error: ${errText}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      })
    }

    const geminiData = await geminiRes.json()
    console.log('Gemini raw response:', JSON.stringify(geminiData))

    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    console.log('Raw text from Gemini:', rawText)

    // Strip markdown code fences if present
    const jsonStr = rawText.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim()
    console.log('JSON string to parse:', jsonStr)

    const suggestion = JSON.parse(jsonStr)

    return new Response(
      JSON.stringify({
        name_en: suggestion.name_en ?? null,
        category_id: suggestion.category_id ?? null,
        default_unit_id: suggestion.default_unit_id ?? null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('Caught error:', (err as Error).message, (err as Error).stack)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
