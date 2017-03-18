// ##### Item Unavailable Objects ##### //

import React from 'react'

class ItemUnavailableObj extends React.Component {
  render() {
    return (
      <div>
        
        <h2>Item Unavailable - Embargoed</h2>

        <div className="o-itemunavailable__embargoed">
          <h2 className="o-itemunavailable__lede">This item is under embargo until <strong>1 January 2017</strong>.</h2>
          <p>You may have access to the publisher's version here:</p>
          <a href="" className="o-textlink__secondary">http://www.ieee-security.org/TC/SPW2014/papers/5103a251.pdf</a>
          <a href="" className="o-textlink__secondary">Notify me by email when this item becomes available</a>
        </div>

        <h2>Item Unavailable - Withdrawn</h2>

        <div className="o-itemunavailable__withdrawn">
          <p className="o-itemunavailable__lede">This item has been withdrawn and is <strong>no longer available</strong>.</p>
        </div>

      </div>
    )
  }
}

module.exports = ItemUnavailableObj;
