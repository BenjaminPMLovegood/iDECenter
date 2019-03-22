import { readFile, PathLike } from 'fs';

export async function readFilePromise(path: PathLike | number, options?: { encoding?: null; flag?: string; } | undefined | null): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        readFile(path, options, (err, data) => {
            if (err) reject(err);
            resolve(data);
        });
    });
}
