create table if not exists public.resell_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  question text not null,
  answer text not null,
  credit_cost integer not null check (credit_cost between 1 and 25),
  attachment_cost integer not null default 0 check (attachment_cost in (0, 5)),
  total_cost integer not null check (total_cost >= 1),
  attachment_url text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.resell_chats enable row level security;

drop policy if exists "Users can view own resell chats" on public.resell_chats;
create policy "Users can view own resell chats"
on public.resell_chats for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own resell chats" on public.resell_chats;
create policy "Users can insert own resell chats"
on public.resell_chats for insert
to authenticated
with check (auth.uid() = user_id);

create or replace function public.consume_credits_for_resell_chat(
  p_user_id uuid,
  p_question text,
  p_answer text,
  p_credit_cost integer,
  p_attachment_cost integer default 0,
  p_attachment_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_credits integer;
  updated_credits integer;
  chat_id uuid;
  total_cost integer;
begin
  total_cost := p_credit_cost + p_attachment_cost;

  if p_credit_cost < 1 or p_credit_cost > 25 then
    raise exception 'Invalid chat credit cost';
  end if;

  if p_attachment_cost not in (0, 5) then
    raise exception 'Invalid attachment cost';
  end if;

  select credits
  into current_credits
  from public.users
  where id = p_user_id
  for update;

  if current_credits is null then
    raise exception 'User profile not found';
  end if;

  if current_credits < total_cost then
    raise exception 'Insufficient credits';
  end if;

  update public.users
  set credits = credits - total_cost
  where id = p_user_id;

  select credits
  into updated_credits
  from public.users
  where id = p_user_id;

  insert into public.resell_chats (
    user_id,
    question,
    answer,
    credit_cost,
    attachment_cost,
    total_cost,
    attachment_url
  )
  values (
    p_user_id,
    p_question,
    p_answer,
    p_credit_cost,
    p_attachment_cost,
    p_credit_cost + p_attachment_cost,
    p_attachment_url
  )
  returning id
  into chat_id;

  insert into public.credit_logs (user_id, change, reason)
  values (
    p_user_id,
    -total_cost,
    'resell_chat'
  );

  return jsonb_build_object(
    'chat_id', chat_id,
    'remaining_credits', updated_credits,
    'total_cost', total_cost
  );
end;
$$;

grant execute on function public.consume_credits_for_resell_chat(uuid, text, text, integer, integer, text) to service_role;
