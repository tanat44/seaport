export function intraCombination<T>(
  input: T[],
  output: T[][],
  currentSolution: T[] = [],
  currentIndex: number = 0
) {
  // always pick first and last index
  if (currentIndex === 0) {
    intraCombination(input, output, [input[currentIndex]], currentIndex + 1);
    return;
  } else if (currentIndex === input.length - 1) {
    currentSolution.push(input[currentIndex]);
    output.push(currentSolution);
    return;
  }

  // if pick this index
  intraCombination(
    input,
    output,
    [...currentSolution, input[currentIndex]],
    currentIndex + 1
  );

  // if not pick this index
  intraCombination(input, output, [...currentSolution], currentIndex + 1);
}

export function intraCombinationTest() {
  const x = [1, 2, 3, 4, 5];
  const output: number[][] = [];
  intraCombination<number>(x, output);
  console.log(output);
}
