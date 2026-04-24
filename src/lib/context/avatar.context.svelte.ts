import { createContext } from 'svelte';
import { StateRaw } from '$lib/reactivity/state.svelte.js';

interface AvatarData {
	preset: string | null;
	color: string | null;
}

// fallow-ignore-next-line unused-type
export type AvatarContext = ReturnType<typeof createAvatarContext>;

const [useAvatar, setAvatarInternal] = createContext<AvatarContext>();
export { useAvatar as use_avatar };

export function set_avatar_context(initial: AvatarData) {
	const ctx = createAvatarContext(initial);
	setAvatarInternal(ctx);
	return ctx;
}

function createAvatarContext(initial: AvatarData) {
	const avatar = new StateRaw<AvatarData>(initial);
	return { avatar };
}
