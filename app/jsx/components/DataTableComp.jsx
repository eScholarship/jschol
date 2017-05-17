// ##### Data Table Component ##### //

import React from 'react'

class DataTableComp extends React.Component {
  render() {
    return (
      <table className="c-datatable">
        <caption>Delicious Fruit</caption>
        <thead>
          <tr>
            <th scope="col">Quantity</th>
            <th scope="col">Apples</th>
            <th scope="col">Oranges</th>
            <th scope="col">Pears</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">One</th>
            <td>Odio</td>
            <td>Lorem</td>
            <td>Optio</td>
          </tr>
          <tr>
            <th scope="row">Two</th>
            <td>Iusto</td>
            <td>Architecto</td>
            <td>Lorem</td>
          </tr>
          <tr>
            <th scope="row">Three</th>
            <td>Lorem</td>
            <td>Assumenda</td>
            <td>Quos</td>
          </tr>
        </tbody>
      </table>
    )
  }
}

module.exports = DataTableComp;
