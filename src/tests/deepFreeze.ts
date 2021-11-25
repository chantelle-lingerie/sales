export function deepFreeze<T>(obj: T) {
    const propNames = Object.getOwnPropertyNames(obj);
    for (let name of propNames) {
        let value = (obj as any)[name];
        if (value && typeof value === "object") {
            deepFreeze(value);
        }
    }
    return Object.freeze(obj);
}