// ##### Text List Objects ##### //

import React from 'react'

class TextListObj extends React.Component {
  render() {
    return (
      <div>

        <h1>Bulleted List</h1>

        <ul className="o-textlist1">
          <li>Lorem ipsum dolor sit amet.
          </li>
          <li>Culpa quis deleniti <a href="">voluptates quae</a>.
          </li>
          <li>Nihil, quaerat ratione! Fugiat, consectetur.
          </li>
          <li>Incidunt distinctio maiores non vel.
          </li>
          <li>A eligendi inventore recusandae veniam.
          </li>
        </ul>

        <h1>Non-bulleted List</h1>

        <ul className="o-textlist2">
          <li>Lorem ipsum dolor sit amet.
          </li>
          <li>Aperiam, iusto esse veniam illum.
          </li>
          <li>Perferendis id culpa laborum rerum.
          </li>
          <li><a href="">Officiis numquam dicta sit</a>, natus?
          </li>
          <li>Commodi non totam, inventore. Deserunt.
          </li>
        </ul>

      </div>
    )
  }
}

module.exports = TextListObj;
