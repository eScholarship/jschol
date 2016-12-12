// ##### Front Matter Component ##### //

import React from 'react'

class FrontmatterComp extends React.Component {
  render() {
    return (
      <div className="c-frontmatter">
        <a href="">
          <img src="http://placehold.it/150x200?text=Image" alt="" className="c-frontmatter__img"/>
        </a>
        <div className="c-frontmatter__text">
          <h2 className="c-frontmatter__heading">
            <a href="">Volume 41, Issue 1, 2015</a>
          </h2>
          <div className="c-frontmatter__subheading">Focus: Caribbean Studies and Literatures</div>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Pariatur fuga laborum, qui debitis vitae quaerat quas ab officia, dolor dignissimos ipsum nam ratione unde animi? Officiis rerum unde eveniet natus.
            Laboriosam tenetur vel, rem culpa maiores non, tempora voluptatibus quasi quos provident exercitationem itaque dolorum quam sequi dolor odio hic accusamus, repellendus ut dignissimos. Labore modi consectetur ullam, iste accusamus!
            Dolore quod illum praesentium sint. Consectetur illum voluptas reiciendis possimus ullam nesciunt, laboriosam nisi nihil hic. Veritatis porro doloribus iste eos, assumenda fugiat dicta nesciunt. Autem sed recusandae at quod!
            Ducimus adipisci provident nam voluptatem officia. Quos maiores molestias atque alias deserunt ullam laborum similique, quae cum excepturi. Rem harum facilis perspiciatis a illum, eum, officiis. Ducimus officia, veniam ea.
          </p>
        </div>
      </div>
    )
  }
}

module.exports = FrontmatterComp;
