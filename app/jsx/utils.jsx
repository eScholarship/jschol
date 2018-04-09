// utils.jsx

export default class {

  /* Takes an array of hashes containing integer values */
  /* Returns sum                                        */
  static sumValueTotals(rows, v) {
    if (rows.length == 0) return 0
    return rows.reduce(function (a, b) {
      return b[v] == null ? a : (a + b[v])
    }, 0)
  }

}
