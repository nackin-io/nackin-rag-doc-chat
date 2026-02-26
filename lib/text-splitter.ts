const DEFAULT_SEPARATORS = ["\n\n", "\n", ". ", " ", ""];

interface SplitterOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
}

export function recursiveCharacterSplit(
  text: string,
  options: SplitterOptions = {}
): string[] {
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
    separators = DEFAULT_SEPARATORS,
  } = options;

  const chunks: string[] = [];
  const rawChunks = splitText(text, separators, chunkSize);

  for (let i = 0; i < rawChunks.length; i++) {
    const chunk = rawChunks[i].trim();
    if (chunk.length === 0) continue;
    chunks.push(chunk);
  }

  if (chunkOverlap === 0 || chunks.length <= 1) return chunks;

  const merged: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    if (i === 0) {
      merged.push(chunks[i]);
      continue;
    }

    const prevChunk = chunks[i - 1];
    const overlap = prevChunk.slice(-chunkOverlap);
    const combined = overlap + " " + chunks[i];

    if (combined.length <= chunkSize + chunkOverlap) {
      merged.push(combined);
    } else {
      merged.push(chunks[i]);
    }
  }

  return merged;
}

function splitText(
  text: string,
  separators: string[],
  chunkSize: number
): string[] {
  if (text.length <= chunkSize) return [text];

  const separator = separators[0];
  const remainingSeparators = separators.slice(1);

  if (separator === "") {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }

  const parts = text.split(separator);
  const chunks: string[] = [];
  let current = "";

  for (const part of parts) {
    const candidate = current ? current + separator + part : part;

    if (candidate.length <= chunkSize) {
      current = candidate;
    } else {
      if (current) chunks.push(current);

      if (part.length > chunkSize && remainingSeparators.length > 0) {
        const subChunks = splitText(part, remainingSeparators, chunkSize);
        chunks.push(...subChunks);
        current = "";
      } else if (part.length > chunkSize) {
        for (let i = 0; i < part.length; i += chunkSize) {
          chunks.push(part.slice(i, i + chunkSize));
        }
        current = "";
      } else {
        current = part;
      }
    }
  }

  if (current) chunks.push(current);
  return chunks;
}
