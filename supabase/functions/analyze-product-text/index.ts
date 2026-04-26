import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

import { corsHeaders } from '../_shared/cors.ts';

const openAiApiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const resellSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    productName: { type: 'string' },
    category: { type: 'string' },
    productSummary: { type: 'string' },
    estimatedPrice: { type: 'string' },
    recommendedSellPrice: { type: 'string' },
    expectedProfitRange: { type: 'string' },
    demandLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
    conditionNotes: { type: 'string' },
    keySellingPoints: { type: 'array', items: { type: 'string' } },
    adScript: { type: 'string' },
    aliExpressSearchUrl: { type: 'string' },
    confidenceScore: { type: 'integer', minimum: 0, maximum: 100 },
    demandScore: { type: 'integer', minimum: 0, maximum: 100 },
    marginScore: { type: 'integer', minimum: 0, maximum: 100 },
    resaleSpeedScore: { type: 'integer', minimum: 0, maximum: 100 },
  },
  required: [
    'productName',
    'category',
    'productSummary',
    'estimatedPrice',
    'recommendedSellPrice',
    'expectedProfitRange',
    'demandLevel',
    'conditionNotes',
    'keySellingPoints',
    'adScript',
    'aliExpressSearchUrl',
    'confidenceScore',
    'demandScore',
    'marginScore',
    'resaleSpeedScore',
  ],
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) {
      return new Response(JSON.stringify({ error: 'Missing auth header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      global: { headers: { Authorization: authorization } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { productText } = await request.json();
    if (!productText || typeof productText !== 'string') {
      return new Response(JSON.stringify({ error: 'productText is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase.from('users').select('credits').eq('id', user.id).single();

    if (profileError) throw profileError;
    if ((profile?.credits ?? 0) < 5) {
      return new Response(JSON.stringify({ error: 'You need 5 credits for text analysis.' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text:
                  'You are a resale product analyst. The user gives you only a product name or short product description. Estimate a resale plan, a realistic sell price, profit range, and a short ad script for TikTok or YouTube Shorts. Return only structured JSON.',
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `Analyze this product idea for reselling: ${productText}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'resell_analysis',
            strict: true,
            schema: resellSchema,
          },
        },
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      throw new Error(`OpenAI error: ${errorText}`);
    }

    const openAiPayload = await openAiResponse.json();
    const outputText =
      openAiPayload.output_text ??
      openAiPayload.output?.[0]?.content?.find?.((item: { text?: string }) =>
        typeof item?.text === 'string'
      )?.text;

    if (!outputText) {
      throw new Error(`OpenAI returned no parsed output: ${JSON.stringify(openAiPayload)}`);
    }

    const analysis = JSON.parse(outputText);

    const { data: transaction, error: transactionError } = await supabase.rpc(
      'consume_credits_for_analysis',
      {
        p_user_id: user.id,
        p_image_url: `text:${productText}`,
        p_result: analysis,
        p_cost: 5,
      },
    );

    if (transactionError) throw transactionError;

    return new Response(
      JSON.stringify({
        analysis,
        transaction,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
