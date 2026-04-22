import { getContext, setContext } from 'svelte';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import { CONTEXT_KEYS } from './context_keys.js';

interface AvatarData {
	preset: string | null;
	color: string | null;
}

function create_avatar_context(initial: AvatarData) {
	const avatar = new StateRaw<AvatarData>(initial);
	return { avatar };
}

/** @knipignore */
export type AvatarContext = ReturnType<typeof create_avatar_context>;

export function set_avatar_context(initial: AvatarData) {
	const context = create_avatar_context(initial);
	setContext(CONTEXT_KEYS.avatar, context);
	return context;
}

export function use_avatar() {
	return getContext<AvatarContext>(CONTEXT_KEYS.avatar);
}
