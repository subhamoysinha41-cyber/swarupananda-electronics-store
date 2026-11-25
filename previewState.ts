export type PreviewDataState = 'data' | 'loading' | 'empty' | 'error';

const storageKey = 'previewState';
const validStates: PreviewDataState[] = ['data', 'loading', 'empty', 'error'];

function readState(): PreviewDataState {
  const queryState = new URLSearchParams(window.location.search).get('previewState');
  if (queryState && validStates.includes(queryState as PreviewDataState)) {
    return queryState as PreviewDataState;
  }
  const savedState = window.localStorage.getItem(storageKey);
  return savedState && validStates.includes(savedState as PreviewDataState)
    ? (savedState as PreviewDataState)
    : 'data';
}

let state = readState();

export function getPreviewState(): PreviewDataState {
  return import.meta.env.DEV ? state : 'data';
}

export function setPreviewState(nextState: PreviewDataState): void {
  state = nextState;
  window.localStorage.setItem(storageKey, nextState);
  const params = new URLSearchParams(window.location.search);
  params.set('previewState', nextState);
  window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`);
  window.location.reload();
}

export function applyPreviewState<T>(value: T, emptyValue: T): Promise<T> {
  const currentState = getPreviewState();
  if (currentState === 'loading') {
    return new Promise<T>(() => undefined);
  }
  if (currentState === 'error') {
    return Promise.reject(new Error('We could not load this right now. Please try again.'));
  }
  if (currentState === 'empty') {
    return Promise.resolve(emptyValue);
  }
  return new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(value), 180);
  });
}
