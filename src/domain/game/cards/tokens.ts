import { type GameState, type TokenKind, rules } from '../model';
import type { TokenRequest, TokenTemplateReference } from '../tokenRequestTypes';
import { boostTokenRequests } from './tokenBoost';
import { initializeParameterValueFactors } from '../parameters/parameterValueChange';

export function addTokens(state: GameState, kind: TokenKind, count: number): GameState {
  return addTokenCards(state, { kind: 'token-kind', token: kind }, count, true);
}

export function beginTokenGeneration(state: GameState, sourceId: string): GameState {
  return { ...state, tokenGroups: [...state.tokenGroups, { sourceId, requests: [] }] };
}

export function requestTokens(
  state: GameState,
  token: TokenKind,
  count: number,
  sourceId: string | null,
  seriesIds?: readonly number[],
): GameState {
  if (count < 1) return state;
  const request: TokenRequest = {
    template: { kind: 'token-kind', token },
    count,
    ...(seriesIds === undefined ? {} : { seriesIds }),
  };
  return requestToken(state, request, sourceId);
}

export function applyTokenCardEffect(
  state: GameState,
  effect: import('../tokenRequestTypes').TokenCardEffect,
  sourceId: string | null,
): GameState {
  return requestTokenCard(state, effect.templateId, effect.count, sourceId, effect.seriesIds);
}

export function requestTokenCard(
  state: GameState,
  templateId: string,
  count: number,
  sourceId: string | null,
  seriesIds?: readonly number[],
): GameState {
  if (
    count < 1 ||
    !Number.isSafeInteger(count) ||
    !state.tokenCatalog.some((card) => card.id === templateId)
  )
    return state;
  const request: TokenRequest = {
    template: { kind: 'template', templateId },
    count,
    actionType28: true,
    ...(seriesIds === undefined ? {} : { seriesIds }),
  };
  return requestToken(state, request, sourceId);
}

export function finishTokenGeneration(state: GameState, sourceId: string): GameState {
  const group = state.tokenGroups.at(-1);
  if (!group || group.sourceId !== sourceId)
    throw new Error('追加カードの生成順序が正しくありません。');
  const boosted = boostTokenRequests(state, group.requests, sourceId, true);
  let next: GameState = { ...boosted.state, tokenGroups: state.tokenGroups.slice(0, -1) };
  const pending = group.requests.map((request, index) => ({
    template: request.template,
    count: boosted.counts[index] ?? 0,
  }));
  while (next.deck.length < rules.maxDeckSize) {
    let added = false;
    for (const request of pending) {
      if (request.count < 1 || next.deck.length >= rules.maxDeckSize) continue;
      next = addTokenCards(next, request.template, 1, false);
      request.count--;
      if (next.deck.length < rules.maxDeckSize) added = true;
    }
    if (!added) break;
  }
  return next;
}

function requestToken(state: GameState, request: TokenRequest, sourceId: string | null): GameState {
  if (request.count < 1) return state;
  const index = state.tokenGroups.findLastIndex((group) => group.sourceId === sourceId);
  if (index >= 0) {
    if (state.deck.length >= rules.maxDeckSize) return state;
    return {
      ...state,
      tokenGroups: state.tokenGroups.map((group, position) =>
        position === index ? { ...group, requests: [...group.requests, request] } : group,
      ),
    };
  }
  const boosted = boostTokenRequests(state, [request], sourceId, false);
  return addTokenCards(boosted.state, request.template, boosted.counts[0] ?? 0, true);
}

function addTokenCards(
  state: GameState,
  templateReference: TokenTemplateReference,
  count: number,
  throwIfMissing: boolean,
): GameState {
  const template =
    templateReference.kind === 'token-kind'
      ? state.tokenCatalog.find((card) => card.token === templateReference.token)
      : state.tokenCatalog.find((card) => card.id === templateReference.templateId);
  if (!template) {
    if (throwIfMissing) throw new Error('追加カードの定義がありません。');
    return state;
  }
  const addable = Math.max(0, rules.maxDeckSize - state.deck.length);
  const generated = Array.from(
    { length: Math.min(Math.max(0, Math.trunc(count)), addable) },
    (_, index) => ({ ...template, id: `${template.id}-${state.nextTokenId + index}` }),
  );
  const split = state.tokenDeckSplit;
  const splitMatches = (card: (typeof generated)[number]) =>
    split?.seriesIds !== null &&
    split?.seriesIds !== undefined &&
    (card.tokenSeriesIds ?? []).some((id) => split.seriesIds?.includes(id));
  const activeMatches = generated.filter(splitMatches);
  const activeOther = generated.filter((card) => !splitMatches(card));
  const activeIds = [...activeMatches, ...activeOther]
    .filter((card) => !split || split.active === (splitMatches(card) ? 'sub' : 'main'))
    .map((card) => card.id);
  const inactiveIds = generated
    .filter((card) => split && split.active !== (splitMatches(card) ? 'sub' : 'main'))
    .map((card) => card.id);
  const tokenDeckSplit = split
    ? {
        ...split,
        [split.active]: {
          ...split[split.active],
          drawPile: [...split[split.active].drawPile, ...activeIds],
        },
        [split.active === 'main' ? 'sub' : 'main']: {
          ...split[split.active === 'main' ? 'sub' : 'main'],
          drawPile: [...split[split.active === 'main' ? 'sub' : 'main'].drawPile, ...inactiveIds],
        },
      }
    : null;
  return initializeParameterValueFactors(
    {
      ...state,
      deck: [...state.deck, ...generated],
      cardPool: [...state.cardPool, ...generated],
      drawPile: [...state.drawPile, ...activeIds],
      tokenDeckSplit,
      nextTokenId: state.nextTokenId + generated.length,
    },
    generated,
  );
}
