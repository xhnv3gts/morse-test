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
export async function getSettings() {
    const settings = await getData(new URL('../data/settings.json', import.meta.url));
    if (!isObject(settings)) { return null; }
    const commonSettings = isObject(settings.common) ? settings.common : null;
    const filename = window.location.pathname.split('/').at(-1) || 'index.html';
    const localSettings = isObject(settings[filename]) ? settings[filename] : null;
    if (!commonSettings && !localSettings) { return null; }
    return merge(commonSettings ?? {}, localSettings ?? {});

    function merge(target, source) {
        if (isObject(source)) {
            if (!isObject(target)) { target = {}; }
            Object.keys(source).forEach(key => target[key] = merge(target[key], source[key]));
            return target;
        }
        return source;
    }
    function isObject(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
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
