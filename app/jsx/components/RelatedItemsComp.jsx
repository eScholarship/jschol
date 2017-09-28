// ##### Related Items Component ##### //

import React from 'react'

class RelatedItemsComp extends React.Component {
  render() {
    console.log(this.props.data)
    return (
      <ul className="c-relateditems">
        <li>
          <h3>
            <a className="o-textlink__secondary" href="">Entre la ficción y el periodismo: Cambio social y la crónica mexicana contemporánea</a>
          </h3>
          <span>Nadeau, Evelyn</span>
        </li>
        <li>
          <h3>
            <a className="o-textlink__secondary" href="">Journalism in Catalonia During Francoism</a>
            </h3>
          <span>Reguant, Monserrat</span>
        </li>
        <li>
          <h3>
            <a className="o-textlink__secondary" href="">En torno a un cuento olvidado de Clarín: "El oso mayor"</a>
          </h3>
          <span>Gil, Angeles Ezama</span>
        </li>
        <li>
          <h3>
            <a className="o-textlink__secondary" href="">Interview with Guillermo Cabrera Infante</a>
          </h3>
          <span>Graham-Jones, Jean; Deosthale, Duleeh3</span>
        </li>
        <li>
          <h3>
            <a className="o-textlink__secondary" href="">Lazlo Moussong. Castillos en la letra. Xalah3a, México: Universidad Veracruzana, 1986.</a>
          </h3>
          <span>Radchik, Laura</span>
        </li>
      </ul>
    )
  }
}

module.exports = RelatedItemsComp;
