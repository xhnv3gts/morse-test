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

export function registerShortcutKey({ modifierKeys, key, buttonId }) {
    modifierKeys = modifierKeys?.map(modifierKey => modifierKey.endsWith('Key') ? modifierKey : { 'Control': 'ctrlKey' }[modifierKey] ?? `${modifierKey.toLowerCase()}Key`) ?? [];
    const allModifierKeySet = new Set(['ctrlKey', 'shiftKey', 'altKey', 'metaKey']);
    const modifierKeySet = new Set(modifierKeys);
    const disallowedModifierKeys = [...allModifierKeySet.difference(modifierKeySet)];
    key = key.toLowerCase();
    const modifierKeyLabels = modifierKeys.map(modifierKey => capitalizeFirstLetter(modifierKey.replace('Key', '')));
    const keyLabelMap = { ' ': 'Space', 'arrowup': '↑', 'arrowright': '→', 'arrowdown': '↓', 'arrowleft': '←' }; //適宜追加
    const keyLabel = keyLabelMap[key] ?? capitalizeFirstLetter(key);
    const shortcutKeyLabel = [...modifierKeyLabels, keyLabel].join('+');
    const button = document.getElementById(buttonId);
    button.textContent += ` [${shortcutKeyLabel}]`;
    window.addEventListener('keydown', e => {
        if (e.repeat || modifierKeys.some(modifierKey => !e[modifierKey]) || disallowedModifierKeys.some(modifierKey => e[modifierKey]) || e.key.toLowerCase() !== key) { return; }
        e.preventDefault();
        button.dispatchEvent(new Event('click'));
    });

    function capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
