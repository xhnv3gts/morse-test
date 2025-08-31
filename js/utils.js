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
