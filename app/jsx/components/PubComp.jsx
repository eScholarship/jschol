// ##### Publication Component ##### //

import React from 'react'
import $ from 'jquery'
import dotdotdot from 'jquery.dotdotdot'
import AuthorListComp from '../components/AuthorListComp.jsx'
import MediaListComp from '../components/MediaListComp.jsx'

class PubComp extends React.Component {
  componentDidMount() {
    $('.c-pub__heading, .c-pub__abstract').dotdotdot({watch: 'window'
    });
  }
  render() {
    return (
      <div className="c-pub">
        <h2 className="c-pub__heading">
          <a href="">From the New Heights: The City and Migrating Latinas in Real Women Have Curves and María Full of Grace</a>
        </h2>
        <AuthorListComp />
        <div className="c-pub__abstract">
          <p>Quaerat impedit debitis vero officia ullam, nesciunt, culpa labore at praesentium, accusantium quibusdam est voluptate accusamus ab odit non ipsa, qui sed similique! Culpa vitae nesciunt ratione quos vel quasi, nemo neque! Id debitis consequatur saepe, rem, excepturi illum obcaecati commodi dolore eaque esse quod impedit assumenda voluptatem voluptate, ex deserunt suscipit.
          </p>
          <p>In similique deleniti nemo atque cumque mollitia sint quam beatae. Culpa sunt modi, deleniti dolore praesentium aspernatur eum dolor architecto illum, assumenda mollitia quos reiciendis, similique facilis laborum qui placeat vel a. Porro illo tenetur voluptates libero error sed iure fuga aperiam, facere natus reiciendis voluptatibus, vitae ipsam earum repellendus eos, officia provident soluta sapiente numquam quo molestiae illum quasi!
          </p>
        </div>
        <MediaListComp />
      </div>
    )
  }
}

module.exports = PubComp;
