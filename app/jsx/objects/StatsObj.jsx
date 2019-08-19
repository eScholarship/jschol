// ##### Statistics Objects ##### //

import React from 'react'

class StatsObj extends React.Component {
  render() {
    return (
      <div className="o-stat"> {/* This parent element not used within carousels */}
        <div className="o-stat--item">
          <a href="">24,844</a> Items
        </div>
        <div className="o-stat--view">
          <b>380,941</b> Views
        </div>
        <div className="o-stat--passed">
          <a href="">6,532</a> Items since UC <br/> OA Policy passed
        </div>
        <div className="o-stat--journals">
          <a href="">31</a> eScholarship Journals
        </div>
        <div className="o-stat--units">
          <a href="">119</a> Research Units
        </div>
        <div className="o-stat--articles">
          <a href="">648</a> Articles
        </div>
        <div className="o-stat--books">
          <a href="">1,491</a> Books
        </div>
        <div className="o-stat--theses">
          <a href="">89</a> Theses
        </div>
      </div>
    )
  }
}

export default StatsObj;
