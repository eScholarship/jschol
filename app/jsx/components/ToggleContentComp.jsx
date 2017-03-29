// ##### Toggle Content Component ##### //

import React from 'react'

class ToggleContentComp extends React.Component {
  render() {
    return (
      <details className="c-togglecontent" open>
        <summary>Main Content</summary>
        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Eum nihil quidem nisi sapiente vel obcaecati esse vero placeat! Dicta fugiat quam, nemo accusamus cum, non voluptas sit eveniet. Voluptates odio consectetur eum dicta vel at rerum accusamus inventore officiis, voluptate deleniti et reiciendis aliquam illo eaque laborum neque excepturi pariatur unde obcaecati molestiae dolores voluptas non earum minima. Libero dolores rerum nesciunt deserunt incidunt, aspernatur similique fugit beatae quis impedit corrupti, voluptate, unde facilis. Voluptatibus labore sunt maxime, accusantium animi mollitia ducimus. Vel ipsum reiciendis, a voluptates delectus. Itaque perferendis debitis odit sed. Earum vero aut laborum numquam accusantium dolores!</p>
      </details>
    )
  }
}

module.exports = ToggleContentComp;
