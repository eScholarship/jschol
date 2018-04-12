// ##### Utilities Component ##### //
// A collection of methods shared across components 

export default class {

  /**
   * Takes an array of hashes containing integer values
   * i.e.  [{type: "pdf", count: 3}, {type: image, count: 2}]
   * Returns sum total from specified value, i.e. count
   */
  static sumValueTotals(rows, value) {
    if (rows.length == 0) return 0
    return rows.reduce(function (a, b) {
      return b[value] == null ? a : (a + b[value])
    }, 0)
  }

}
