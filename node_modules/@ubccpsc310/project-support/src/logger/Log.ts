/**
 * Collection of logging methods. Useful for making the output easier to read and understand.
 */
export default class Log {
    private static getDateString() {
        return new Date().toLocaleString("en-CA", {hour12: false});
    }

    public static trace(...msg: any[]): void {
        console.log(`<T> ${Log.getDateString()}:`, ...msg);
    }

    public static info(...msg: any[]): void {
        console.info(`<I> ${Log.getDateString()}:`, ...msg);
    }

    public static warn(...msg: any[]): void {
        console.warn(`<W> ${Log.getDateString()}:`, ...msg);
    }

    public static error(...msg: any[]): void {
        console.error(`<E> ${Log.getDateString()}:`, ...msg);
    }

    public static test(...msg: any[]): void {
        console.log(`<X> ${Log.getDateString()}:`, ...msg);
    }
}
