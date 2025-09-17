export async function getData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) { throw new Error(`Response status: ${response.status}`); }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error.message);
        return null;
    }
}
export async function getSettings(path) {
    const settings = await getData(path);
    const commonSettings = settings.common;
    const filename = window.location.pathname.split('/').at(-1) || 'index.html';
    const localSettings = settings[filename];
    return deepMerge(commonSettings, localSettings);
}
function deepMerge(target, source) {
    if (source === undefined) {
        return target;
    }

    if (typeof source === 'object' && source !== null && !Array.isArray(source)) {
        if (typeof target !== 'object' || target === null || Array.isArray(target)) {
            target = {};
        }
        for (const key of Object.keys(source)) {
            target[key] = deepMerge(target[key], source[key]);
        }
        return target;
    }

    if (Array.isArray(source)) {
        return [...source];
    }

    return source;
}

export function getRandomItem(array) {
    const index = getRandomIndex(array);
    return array[index];
}
export function getRandomIndex(array) {
    return Math.floor(Math.random() * array.length);
}
export function getRandomSubarray(array, range) {
    if (range <= 0) { return null; }
    if (range >= array.length) { return array; }
    const start = Math.floor(Math.random() * (array.length - range + 1));
    const end = start + range;
    return array.slice(start, end);
}

export function registerShortcutKey({ modifierKey, key, keyText, buttonId }) {
    const button = document.getElementById(buttonId);
    const modifierKeyText = { 'ctrlKey': 'Ctrl' }[modifierKey];
    keyText ??= key.toUpperCase();
    button.textContent += `[${modifierKeyText ? `${modifierKeyText} + ` : ''}${keyText}]`;
    const isModifierKeyDown = modifierKey ? e => e[modifierKey] : () => true;
    window.addEventListener('keydown', e => {
        if (e.repeat || !isModifierKeyDown(e) || e.key !== key) { return; }
        e.preventDefault();
        button.dispatchEvent(new Event('click'));
        console.log('a');
    });
}
