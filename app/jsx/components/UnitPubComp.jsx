// ##### Unit Publication Component ##### //

import React from 'react'
import $ from 'jquery'
import dotdotdot from 'jquery.dotdotdot'

class UnitPubComp extends React.Component {
  componentDidMount() {
    $('.c-pub__heading, .c-pub__abstract').dotdotdot({watch: 'window'
    });
  }
  render() {
    return (
      <div className="c-unitpub">
        <h4 className="c-unitpub__heading"><a href="">Series 1 Title</a></h4>
        <div className="c-pub">
          <h5 className="c-pub__heading">
            <a href="">Language Ideologies and Hegemonic Factors Imposed upon Judeo-Spanish Speaking Communities</a>
          </h5>
          <div className="c-authorlist">
            <ul className="c-authorlist__list">
              <li><a href="">Kirschen, Bryan</a></li>
              <li><a href="">Shaffer, Christopher D</a></li>
              <li><a href="">Reed, Laura K</a></li>
            </ul>
          </div>
          <div className="c-pub__abstract">
            <p>Id doloremque possimus officia natus et, deleniti rem ipsa sunt tenetur quam veritatis assumenda illum quasi iusto nostrum nesciunt, provident maiores nisi voluptates blanditiis non ea magni repellat. At odit cum quaerat consequuntur aperiam culpa ut, repudiandae, illum laboriosam reprehenderit dolore, perspiciatis.
            </p>
            <p>Reprehenderit iure obcaecati quasi doloribus laudantium ut labore ab, ullam ratione vel laboriosam illum saepe at odit ipsa dolorem, in, officiis tempore provident. Placeat velit necessitatibus iusto optio laudantium qui corporis cum nam, quam blanditiis, autem, nostrum consectetur quasi vitae. Ab quae recusandae quam est iure sunt similique ipsum blanditiis!
            </p>
          </div>
        </div>
        <div className="c-pub">
          <h5 className="c-pub__heading">
            <a href="">From the New Heights: The City and Migrating Latinas in Real Women Have Curves and María Full of Grace</a>
          </h5>
          <div className="c-authorlist">
            <ul className="c-authorlist__list">
              <li><a href="">Dahle, Kevin W</a></li>
              <li><a href="">Smith, Sheryl T</a></li>
              <li><a href="">Barshop, William</a></li>
            </ul>
          </div>
          <div className="c-pub__abstract">
            <p>Amet sed voluptas quibusdam iusto eveniet aliquam, dolor nam quae! Est debitis veritatis porro ipsam neque eligendi tempore quis cupiditate consequatur voluptatum. Provident alias est officia corporis, dolorem ad doloribus accusamus consequuntur eaque odit fugit similique soluta et quas! Illo, magni, aspernatur.
            </p>
            <p>Quas delectus totam ducimus cumque fuga, maiores repudiandae velit esse enim repellendus itaque aliquid, nostrum quos perferendis dolore quis quod, at quaerat omnis, debitis nesciunt quae consectetur sequi explicabo soluta. Quae iste iure officia rem, maxime corrupti eligendi atque! Ab dignissimos, itaque nostrum totam aliquam quas voluptates suscipit modi est?
            </p>
          </div>
        </div>
        <div className="c-pub">
          <h5 className="c-pub__heading">
            <a href="">Coupled Cardiac Electrophysiology and Contraction using Finite Element</a>
          </h5>
          <div className="c-authorlist">
            <ul className="c-authorlist__list">
              <li><a href="">Pardo, Maria Gracia</a></li>
              <li><a href="">Lee, Paul</a></li>
              <li><a href="">Wong, Jeannette</a></li>
            </ul>
          </div>
          <div className="c-pub__abstract">
            <p>Perferendis, ducimus quaerat temporibus dolorum omnis beatae, quas. Quam et corporis, sequi, consequatur quia odio nam rerum dolore ipsam, nostrum totam numquam quisquam nobis asperiores praesentium accusamus ex eaque reiciendis error? Nulla ut aperiam ipsa blanditiis quidem esse impedit odit reiciendis eius?
            </p>
            <p>Molestiae, itaque ratione recusandae adipisci eaque omnis voluptates. Alias, commodi, nemo. Velit cum eum aut qui? Quam excepturi, nostrum iure delectus veritatis voluptatum quibusdam eligendi amet error officia nobis dolorem neque at accusantium enim dicta sint expedita, totam numquam eveniet fuga qui inventore ratione molestias laborum. Excepturi ab dicta suscipit.
            </p>
          </div>
        </div>
        <div className="c-unitpub__publications">24 more works&mdash; <a href="">show all</a></div>
      </div>
    )
  }
}

module.exports = UnitPubComp;
