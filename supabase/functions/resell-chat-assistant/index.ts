import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

import { corsHeaders } from '../_shared/cors.ts';

const openAiApiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const chatSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    answer: { type: 'string' },
    creditCost: { type: 'integer', minimum: 1, maximum: 25 },
  },
  required: ['answer', 'creditCost'],
};

function describeError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const parts = [
      typeof record.message === 'string' ? record.message : null,
      typeof record.details === 'string' ? record.details : null,
      typeof record.hint === 'string' ? record.hint : null,
      typeof record.code === 'string' ? `code: ${record.code}` : null,
    ].filter(Boolean);

    if (parts.length) return parts.join(' | ');
  }

  return 'Unknown error';
}

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

    const { question, attachmentPath } = await request.json();
    if (!question || typeof question !== 'string') {
      return new Response(JSON.stringify({ error: 'question is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const attachmentCost = attachmentPath ? 5 : 0;

    const {
      data: profile,
      error: profileError,
    } = await supabase.from('users').select('credits').eq('id', user.id).single();

    if (profileError) throw profileError;
    if ((profile?.credits ?? 0) < 1 + attachmentCost) {
      return new Response(
        JSON.stringify({
          error: attachmentPath
            ? 'You need at least 6 credits to send a resale chat with an image.'
            : 'You need at least 1 credit to send a resale chat.',
        }),
        {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    let signedAttachmentUrl: string | null = null;
    if (attachmentPath) {
      const { data, error } = await supabase.storage.from('uploads').createSignedUrl(attachmentPath, 60 * 15);
      if (error || !data?.signedUrl) {
        throw error ?? new Error('Could not create signed URL for the attachment.');
      }
      signedAttachmentUrl = data.signedUrl;
    }

    const userContent: Array<Record<string, unknown>> = [
      {
        type: 'input_text',
        text: `User question: ${question}`,
      },
    ];

    if (signedAttachmentUrl) {
      userContent.push({
        type: 'input_image',
        image_url: signedAttachmentUrl,
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
                  'You are a resale-focused AI assistant. You only help with reselling, product selection, pricing, supplier search guidance, margin thinking, listing ideas, and marketing angles for resale. Keep answers beginner-friendly, practical, concise, and action-oriented. Do not drift into unrelated topics. If the question is about suppliers, recommend how to evaluate or find suppliers. Otherwise, stay focused on the resale decision. Format the answer in a visually scan-friendly way using short sections, useful emojis, and markdown bold for the most important words, prices, and actions. Choose a fair creditCost from 1 to 25 based on difficulty, research depth, and how much reasoning the request needs. Do not mention internal scoring rules.',
              },
            ],
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'resell_chat_response',
            strict: true,
            schema: chatSchema,
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
      openAiPayload.output?.[0]?.content?.find?.((item: { text?: string }) => typeof item?.text === 'string')?.text;

    if (!outputText) {
      throw new Error(`OpenAI returned no parsed output: ${JSON.stringify(openAiPayload)}`);
    }

    const parsed = JSON.parse(outputText) as { answer: string; creditCost: number };

    const { data: transaction, error: transactionError } = await supabase.rpc(
      'consume_credits_for_resell_chat',
      {
        p_user_id: user.id,
        p_question: question,
        p_answer: parsed.answer,
        p_credit_cost: parsed.creditCost,
        p_attachment_cost: attachmentCost,
        p_attachment_url: attachmentPath ?? null,
      },
    );

    if (transactionError) throw transactionError;

    return new Response(
      JSON.stringify({
        question,
        answer: parsed.answer,
        creditCost: parsed.creditCost,
        attachmentCost,
        totalCost: parsed.creditCost + attachmentCost,
        transaction,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: describeError(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
