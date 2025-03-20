const fs = require('fs');
const Fraction = require('fraction.js');
const math = require('mathjs');

function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (var i = 0; i < arr1.length; i++) {
    if (!arr1[i].equals(arr2[i])) return false;
  }
  return true;
}

function printTable(simplexTable) {
  for (var row of simplexTable) {
    var rowString = row.map(num => num.toString()).join('\t');
    console.log(rowString);
  }
}

function prepInput(lines) {
  const num_vars = parseInt(lines[0]);
  const numConstraints = parseInt(lines[1]);
  const gradF = lines[2].split(' ').map(el => new Fraction(el));
  const extrType = lines[3].trim();
  var constraints = [];

  for (var row_num = 0; row_num < numConstraints; row_num++) {
    var line = lines[4 + row_num].split(' ');
    var constraint = line.slice(0, -1).map(el => new Fraction(el));
    constraint.push(parseInt(line[line.length - 1]));
    constraints.push(constraint);
  }

  return [lines.slice(4 + numConstraints), num_vars, numConstraints, gradF, extrType, constraints];
}

function optimizeBasis(stage, simplexTable, artBasVectorsCounter, deltaMaxInd, basis, coeffs) {
  // Ищем, вместо какого производить замену
  // Если нет положительных, решения не существует
  if (simplexTable.every(row => row[deltaMaxInd] <= 0)) {
    return [false, simplexTable, artBasVectorsCounter, basis, coeffs];
  }

  var minFraction = null;
  var mnRow = null;

  for (var rowNum = 0; rowNum < simplexTable.length; rowNum++) {
    if (simplexTable[rowNum][deltaMaxInd] <= 0) {
      continue;
    }

    const fraction = simplexTable[rowNum][0].div(simplexTable[rowNum][deltaMaxInd]);

    if (!minFraction) {
      minFraction = fraction;
      mnRow = rowNum;
    } else if (fraction.compare(minFraction) === -1) {
      minFraction = fraction;
      mnRow = rowNum;
    }
  }

  // Делим на разрешающий элемент
  simplexTable[mnRow] = simplexTable[mnRow].map(value => value.div(simplexTable[mnRow][deltaMaxInd]));
  
  // Делаем базисный вектор единичным
  for (var rowNum = 0; rowNum < simplexTable.length; rowNum++) {
    if (rowNum !== mnRow) {
      const factor = simplexTable[rowNum][deltaMaxInd].div(simplexTable[mnRow][deltaMaxInd]).neg();
      simplexTable[rowNum] = simplexTable[rowNum].map((value, colNum) =>
        value.add(simplexTable[mnRow][colNum].mul(factor))
      );
    }
  }

  // Вводим в базис новый вектор
  const old = basis[mnRow];
  basis[mnRow] = deltaMaxInd;

  // Проверим, действительно ли вывели из базиса искусственный вектор
  if (stage === "M-method") {
    // Если выведенный в списке искусственных
    if (old >= (simplexTable[0].length - 1 - artBasVectorsCounter)) {
      // Выгоняем из дома
      simplexTable = simplexTable.map(row => row.slice(0, old).concat(row.slice(old + 1)));
      // Из коэффициентов тоже, а coeffs сам пересчитается
      coeffs.splice(old, 1);
      artBasVectorsCounter -= 1;
      // Для всех искусственных, которые стояли после него, нужно уменьшить индекс
      basis = basis.map(vector => (vector > old ? vector - 1 : vector));
    }
  }
  
  return [true, simplexTable, artBasVectorsCounter, basis, coeffs]
}

function solve(num_vars, numConstraints, gradF, extrType, simplexTable) {
  // Привожу знаки неравенств. Для max: <=, =, для min: >=, =
  const sign_types = { 'max': [2, 1], 'min': [1, 2] };
  for (var row_num = 0; row_num < numConstraints; row_num++) {
    if (simplexTable[row_num][simplexTable[row_num].length - 1] === sign_types[extrType][0]) {
      simplexTable[row_num] = simplexTable[row_num].map(el => el * -1);
      simplexTable[row_num][simplexTable[row_num].length - 1] = sign_types[extrType][1];
    }
  }

  // Ввожу виртуальные (балансовые) переменные для приведения к каноническому виду
  const virt_vars_vectors = Array.from({ length: numConstraints }, (_, i) =>
    Array.from({ length: numConstraints }, (_, j) =>
      new Fraction(i === j ? (extrType === 'min' ? -1 : 1) : 0)
    )
  );
  var virtVarsCounter = 0;

  for (var row_num = 0; row_num < numConstraints; row_num++) {
    if (simplexTable[row_num][num_vars + 1] !== 0) {
      var virt_var_column = virt_vars_vectors.map(row => row[row_num]);
      simplexTable = simplexTable.map((row, i) => [...row.slice(0), virt_var_column[i]]);
      virtVarsCounter++;
    }
  }

  // После приведения к к.в. удаляем столбец ограничений
  simplexTable = simplexTable.map(row => [...row.slice(0, num_vars + 1), ...row.slice(num_vars + 2)]);

  // Удаляем столбец свободных членов и вставляем его в начало
  simplexTable = simplexTable.map(row => [row[num_vars], ...row.slice(0, num_vars), ...row.slice(num_vars + 1)]);

  // Умножить все строки, где столбец 'b' < 0 на -1
  simplexTable = simplexTable.map(row => (row[0] < 0 ? row.map(el => el * -1) : row));

  for (var i = 0; i < simplexTable.length; i++) {
    for (var j = 0; j < simplexTable[i].length; j++) {
      simplexTable[i][j] = new Fraction(simplexTable[i][j]);
    }
  }

  // Поиск базисных векторов в симплекс-таблице
  // Список сначала в потенциально неверном порядке (не в порядке столбцов E)
  var basisUnsorted = [];

  var identityColumns = Array.from({ length: numConstraints }, (_, i) =>
    Array.from({ length: numConstraints }, (_, j) => new Fraction(i === j ? 1 : 0))
  );

  // Начинаем поиск базисных векторов со второго столбца, т.к. A_0 не может быть базисным
  for (var column_num = 1; column_num < simplexTable[0].length; column_num++) {
    var column = simplexTable.map(row => row[column_num]);
    if (identityColumns.some(id_column => arraysEqual(id_column, column))) {
      basisUnsorted.push(column_num);
      // Удаляем те, что у нас уже есть. Если есть все, он останется пустым
      identityColumns.splice(identityColumns.findIndex(id_column => arraysEqual(id_column, column)), 1);
    }
  }

  // По умолчанию искусственных нет
  var artBasVectorsCounter = 0;

  // Вводим искусственные векторы, если базисных не хватает
  if (identityColumns.length != 0) {
    // Общее число искусственных (изначальное) и счетчик оставшихся искусственных в базисе
    var artBasVectorsAmount = identityColumns.length;
    artBasVectorsCounter = identityColumns.length;

    // Создаем искусственные векторы
    var artificialVectors = math.transpose(identityColumns);

    // Добавляем искусственные векторы к симплекс-таблице
    simplexTable = math.concat(simplexTable, artificialVectors);

    // Добавляем искусственные векторы в неотсортированный базис
    for (var i = 0; i < artificialVectors[0].length; i++) {
      const newVectorIndex = simplexTable[0].length - artificialVectors[0].length + i;
      basisUnsorted.push(newVectorIndex);
    }

    // Выполняем сортировку векторов в базисе
    const identityMatrix = Array.from({ length: numConstraints }, (_, i) =>
      Array.from({ length: numConstraints }, (_, j) => new Fraction(i === j ? 1 : 0))
    );
    var basis = [];
    for (var columnNum = 0; columnNum < numConstraints; columnNum++) {
      var identityColumn = identityMatrix.map(row => row[columnNum]);
      for (var vector of basisUnsorted) {
        var column = simplexTable.map(row => row[vector]);
        if (arraysEqual(column, identityColumn)) {
          basis.push(vector);
        }
      }
    }

    // Создаем массив коэффициентов
    var coeffs = [0].concat(Array(gradF.length).fill(0), Array(virtVarsCounter).fill(0), extrType === "max" ? Array(artBasVectorsAmount).fill(-1) : Array(artBasVectorsAmount).fill(1)).map(el => new Fraction(el));

    while (true) {
      var cBasis = basis.map(basisInd => new Fraction(coeffs[basisInd]));
      var delta = Array(simplexTable[0].length).fill(new Fraction(0));

      // Вычисляем delta для каждой колонки
      for (var columnNum = 0; columnNum < simplexTable[0].length; columnNum++) {
        var dotProduct = new Fraction(0);
        
        // Вычисляем скалярное произведение
        for (var index = 0; index < cBasis.length; index++) {
          dotProduct = dotProduct.add(cBasis[index].mul(simplexTable[index][columnNum]));
        }
  
        // delta для данной колонки
        delta[columnNum] = dotProduct.sub(coeffs[columnNum]);
      }

      // Занулим первый элемент delta[0]
      delta[0] = new Fraction(0);

      if (extrType === "max") {
        if (delta.every(deltaJ => deltaJ >= 0)) {
          if (artBasVectorsCounter != 0) {
            return "Решений нет";
          }
          break;
        }

        const found = new Fraction(Math.min(...delta));
        deltaMaxInd = delta.findIndex(item => item.equals(found));
      } else {
        if (delta.every(deltaJ => deltaJ <= 0)) {
          if (artBasVectorsCounter != 0) {
            return "Решений нет";
          }
          break;
        }
        const found = new Fraction(Math.max(...delta));
        deltaMaxInd = delta.findIndex(item => item.equals(found));
      }

      [resCode, simplexTable, artBasVectorsCounter, basis, coeffs] = optimizeBasis("M-method", simplexTable, artBasVectorsCounter, deltaMaxInd, basis, coeffs);
      if (resCode === false) {
        return "Решений нет";
      }

    }
  }
  else {
    basis = basisUnsorted;
  }
  
  coeffs = [0].concat(gradF, Array(virtVarsCounter).fill(0)).map(el => new Fraction(el));
  while (true) {
    var cBasis = basis.map(basisInd => new Fraction(coeffs[basisInd]));
    var delta = Array(simplexTable[0].length).fill(new Fraction(0));

    // Вычисляем delta для каждой колонки
    for (var columnNum = 0; columnNum < simplexTable[0].length; columnNum++) {
      var dotProduct = new Fraction(0);
      
      // Вычисляем скалярное произведение
      for (var index = 0; index < cBasis.length; index++) {
        dotProduct = dotProduct.add(cBasis[index].mul(simplexTable[index][columnNum]));
      }

      // delta для данной колонки
      delta[columnNum] = dotProduct.sub(coeffs[columnNum]);
    }

    var Fextr = delta[0];
    delta[0] = new Fraction(0);

    if (extrType === "max") {
      if (delta.every(deltaJ => deltaJ >= 0)) {
        const sign = Fextr.s < 0 ? '-' : '';
        return Fextr.d == 1 ? "Ответ: " + `${sign}${Fextr.n}` : "Ответ: " + `${sign}${Fextr.n}/${Fextr.d}`;
      }
      const found = new Fraction(Math.min(...delta));
      deltaMaxInd = delta.findIndex(item => item.equals(found));
    } else {
      if (delta.every(deltaJ => deltaJ <= 0)) {
        const sign = Fextr.s < 0 ? '-' : '';
        return Fextr.d == 1 ? "Ответ: " + `${sign}${Fextr.n}` : "Ответ: " + `${sign}${Fextr.n}/${Fextr.d}`;
      }
      const found = new Fraction(Math.max(...delta));
      deltaMaxInd = delta.findIndex(item => item.equals(found));
    }

    [resCode, simplexTable, artBasVectorsCounter, basis, coeffs] = optimizeBasis("basic simplex", simplexTable, artBasVectorsCounter, deltaMaxInd, basis, coeffs);
    if (resCode === false) {
      return "Решений нет";
    }
  }

}

var lines = fs.readFileSync('inputData.txt', 'utf-8').split('\n');
var n = parseInt(lines[0]);
lines = lines.slice(1);
for (let i = 0; i < n; i++)
{
  var [lines, num_vars, numConstraints, gradF, extrType, constraints] = prepInput(lines);
  console.log(solve(num_vars, numConstraints, gradF, extrType, constraints));
}