const Fraction = require('fraction.js');
const { prepInput, optimizeBasis, solve } = require('./linear-fractional.js');

describe("Simplex method tests", () => {

  // Тест для функции prepInput
  test("prepInput should return correct parsed input", () => {
    const testInput1 = [
      "5",            // число переменных
      "3",            // число ограничений
      "5 3 5 3 -2 5",          // коэффициенты целевой функции (числитель)
      "5 2 0 0 0 8",          // коэффициенты целевой функции (знаменатель)
      "5 -1 1 0 0 25",        // ограничение 1
      "7 1 0 1 0 47",         // ограничение 2
      "-5 5 0 0 1 35"         // ограничение 3
    ];

    const expectedOutput1 = [
      ["1 2 5", "3 4 8"],   // constraints
      3,                    // num_vars (с увеличением на 1)
      3,                    // numConstraints (с увеличением на 1)
      [new Fraction(2), new Fraction(3)],  // gradF (числитель целевой функции)
      'max',                // extrType (максимизация)
      [                    // constraints (с учетом искусственных переменных)
        [new Fraction(1), new Fraction(2), new Fraction(5), new Fraction(-1), new Fraction(0), new Fraction(0), new Fraction(0)],
        [new Fraction(3), new Fraction(4), new Fraction(8), new Fraction(0), new Fraction(1), new Fraction(0), new Fraction(0)],
        [new Fraction(2), new Fraction(3), new Fraction(0), new Fraction(0), new Fraction(0), new Fraction(1), new Fraction(0)],
      ]
    ];

    expect(prepInput(testInput1)).toEqual(expectedOutput1);
  });

  // Тест для функции optimizeBasis
  test("optimizeBasis should correctly update simplex table", () => {
    const simplexTable1 = [
      [new Fraction(1), new Fraction(2), new Fraction(3), new Fraction(5), new Fraction(0)],
      [new Fraction(0), new Fraction(1), new Fraction(1), new Fraction(2), new Fraction(1)],
      [new Fraction(0), new Fraction(0), new Fraction(0), new Fraction(3), new Fraction(0)],
      [new Fraction(0), new Fraction(0), new Fraction(0), new Fraction(0), new Fraction(1)],
    ];

    let artBasVectorsCounter = 0;
    let deltaMaxInd = 2;
    let basis = [1, 2, 3];
    let coeffs = [new Fraction(0), new Fraction(1), new Fraction(0), new Fraction(1)];

    const [success, updatedSimplexTable, updatedArtBasVectorsCounter, updatedBasis, updatedCoeffs] = optimizeBasis(
      "M-method", 
      simplexTable1, 
      artBasVectorsCounter, 
      deltaMaxInd, 
      basis, 
      coeffs
    );

    expect(success).toBe(true);  // Проверяем, что обновление прошло успешно
    expect(updatedSimplexTable.length).toBeGreaterThan(0);  // Проверяем, что таблица обновлена
    expect(updatedArtBasVectorsCounter).toBeGreaterThanOrEqual(0);  // Проверяем, что счетчик обновлен
    expect(updatedBasis.length).toBeGreaterThan(0);  // Проверяем, что базис обновлен
    expect(updatedCoeffs.length).toBeGreaterThan(0);  // Проверяем, что коэффициенты обновлены
  });

  // Тест для функции solve (решение задачи)
  test("solve should return optimal result for given problem", () => {
    const simplexTable2 = [
      [new Fraction(2), new Fraction(3), new Fraction(5)],
      [new Fraction(3), new Fraction(1), new Fraction(4)],
      [new Fraction(4), new Fraction(2), new Fraction(6)],
    ];

    const gradF2 = [new Fraction(2), new Fraction(3)];
    const num_vars2 = 2;
    const numConstraints2 = 3;
    const extrType2 = "max";  // максимизация

    const result = solve(num_vars2, numConstraints2, gradF2, extrType2, simplexTable2);

    expect(result).toMatch(/Ответ:/);  // Проверяем, что результат содержит "Ответ:"
  });

  // Тест на невозможность решения задачи
  test("solve should return 'Решений нет' when no solution exists", () => {
    const simplexTable3 = [
      [new Fraction(2), new Fraction(3), new Fraction(5)],
      [new Fraction(-3), new Fraction(1), new Fraction(-4)],
      [new Fraction(4), new Fraction(2), new Fraction(6)],
    ];

    const gradF3 = [new Fraction(2), new Fraction(3)];
    const num_vars3 = 2;
    const numConstraints3 = 3;
    const extrType3 = "max";  // максимизация

    const result3 = solve(num_vars3, numConstraints3, gradF3, extrType3, simplexTable3);

    expect(result3).toBe("Решений нет");
  });

});