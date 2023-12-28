export async function countWords(message: any, word: string) {
    let words = message.content.split(" ");
    let count = 0;
    for (let i = 0; i < words.length; i++) {
        if (words[i].toLowerCase().includes(word)) count++;
    }
    return count;
}